-- Update handle_new_user function to not create business settings for users created by business admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sqlstate TEXT;
  _message TEXT;
  _detail TEXT;
  _hint TEXT;
  _context TEXT;
  _generated_business_id BIGINT;
  _is_business_user BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE 'handle_new_user trigger fired for user: % (email: %)', NEW.id, NEW.email;

  -- Check if this user has requires_password_change metadata (indicating they were created by business admin)
  IF NEW.raw_user_meta_data ->> 'requires_password_change' = 'true' THEN
    _is_business_user := TRUE;
    RAISE NOTICE 'handle_new_user: User % was created by business admin, skipping business_settings creation', NEW.id;
  END IF;

  -- Handle profile creation/update with atomic exception handling
  BEGIN
    INSERT INTO public.profiles (user_id, full_name, email, business_name, last_login)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      business_name = EXCLUDED.business_name,
      last_login = EXCLUDED.last_login,
      updated_at = now();

  EXCEPTION
    WHEN unique_violation THEN
      RAISE WARNING 'handle_new_user: Profile unique_violation for user % (email: %). This email might be associated with another user_id. SQLSTATE: %', NEW.id, NEW.email, SQLSTATE;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS
        _sqlstate = RETURNED_SQLSTATE,
        _message = MESSAGE_TEXT,
        _detail = PG_EXCEPTION_DETAIL,
        _hint = PG_EXCEPTION_HINT,
        _context = PG_EXCEPTION_CONTEXT;
      RAISE WARNING 'handle_new_user: Unexpected error during profile creation/update for user % (email: %): SQLSTATE: %, Message: %, Detail: %, Hint: %, Context: %', NEW.id, NEW.email, _sqlstate, _message, _detail, _hint, _context;
  END;

  -- Only create business settings and assign business_admin role if user is NOT a super_admin AND NOT a business user created by admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'super_admin') AND NOT _is_business_user THEN
    RAISE NOTICE 'handle_new_user: User % is a new business owner. Creating business_settings and assigning business_admin role.', NEW.id;

    -- Create business settings
    BEGIN
      -- Generate unique 10-digit business_id as BIGINT
      _generated_business_id := (SELECT (floor(random() * 9000000000) + 1000000000)::BIGINT);
      
      -- Ensure uniqueness
      WHILE EXISTS (SELECT 1 FROM public.business_settings WHERE business_id = _generated_business_id) LOOP
        _generated_business_id := (SELECT (floor(random() * 9000000000) + 1000000000)::BIGINT);
      END LOOP;

      INSERT INTO public.business_settings (user_id, business_id, business_name, contact_email, public_path, status)
      VALUES (
        NEW.id,
        _generated_business_id,
        COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'),
        NEW.email,
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'my-business'), ' ', '-')) || '-' || _generated_business_id,
        'active'
      )
      ON CONFLICT (user_id) DO UPDATE SET
        business_id = EXCLUDED.business_id,
        business_name = EXCLUDED.business_name,
        contact_email = EXCLUDED.contact_email,
        public_path = EXCLUDED.public_path,
        status = EXCLUDED.status,
        updated_at = now();
        
      -- Update the profile with the business_id after business_settings creation
      UPDATE public.profiles 
      SET business_id = _generated_business_id,
          updated_at = now()
      WHERE user_id = NEW.id;
      
    EXCEPTION
      WHEN unique_violation THEN
        RAISE WARNING 'handle_new_user: Business settings unique_violation for user % (business_name: %, business_id: %). SQLSTATE: %', NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business'), _generated_business_id, SQLSTATE;
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
          _sqlstate = RETURNED_SQLSTATE,
          _message = MESSAGE_TEXT,
          _detail = PG_EXCEPTION_DETAIL,
          _hint = PG_EXCEPTION_HINT,
          _context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING 'handle_new_user: Unexpected error during business_settings creation for user % (email: %): SQLSTATE: %, Message: %, Detail: %, Hint: %, Context: %', NEW.id, NEW.email, _sqlstate, _message, _detail, _hint, _context;
    END;

    -- Assign business_admin role to the user - this is CRITICAL for the first user of a business
    BEGIN
      -- Insert into user_roles with proper error handling (using ON CONFLICT DO NOTHING)
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'business_admin')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Also add them as business_admin in business_users table (they own the business)
      INSERT INTO public.business_users (user_id, business_id, role)
      VALUES (NEW.id, _generated_business_id, 'business_admin')
      ON CONFLICT (user_id, business_id) DO UPDATE SET role = EXCLUDED.role;
      
      RAISE NOTICE 'handle_new_user: Successfully created user_roles and business_users entries for user %', NEW.id;
      
    EXCEPTION
      WHEN unique_violation THEN
        RAISE WARNING 'handle_new_user: User roles unique_violation for user % (role: business_admin). SQLSTATE: %', NEW.id, SQLSTATE;
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
          _sqlstate = RETURNED_SQLSTATE,
          _message = MESSAGE_TEXT,
          _detail = PG_EXCEPTION_DETAIL,
          _hint = PG_EXCEPTION_HINT,
          _context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING 'handle_new_user: Unexpected error during user_roles creation for user % (email: %): SQLSTATE: %, Message: %, Detail: %, Hint: %, Context: %', NEW.id, NEW.email, _sqlstate, _message, _detail, _hint, _context;
    END;
  ELSE
    RAISE NOTICE 'handle_new_user: User % is either a super_admin or business user created by admin. Skipping business_settings and business_admin role creation.', NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;