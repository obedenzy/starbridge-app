-- Fix user role creation during signup and ensure proper business admin assignment

-- First, let's update the handle_new_user function to properly create user roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _sqlstate TEXT;
  _message TEXT;
  _detail TEXT;
  _hint TEXT;
  _context TEXT;
  _generated_business_id BIGINT;
BEGIN
  RAISE NOTICE USING MESSAGE = 'handle_new_user trigger fired for user: ' || NEW.id || ', email: ' || NEW.email;

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
      RAISE WARNING USING MESSAGE = 'handle_new_user: Profile unique_violation for user ' || NEW.id || ' (email: ' || NEW.email || '). This email might be associated with another user_id. SQLSTATE: ' || SQLSTATE;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS
        _sqlstate = RETURNED_SQLSTATE,
        _message = MESSAGE_TEXT,
        _detail = PG_EXCEPTION_DETAIL,
        _hint = PG_EXCEPTION_HINT,
        _context = PG_EXCEPTION_CONTEXT;
      RAISE WARNING USING MESSAGE = 'handle_new_user: Unexpected error during profile creation/update for user ' || NEW.id || ' (email: ' || NEW.email || '): SQLSTATE: ' || _sqlstate || ', Message: ' || _message || ', Detail: ' || _detail || ', Hint: ' || _hint || ', Context: ' || _context;
  END;

  -- Create business settings and assign business_admin role ONLY if the user is NOT a super_admin
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'super_admin') THEN
    RAISE NOTICE USING MESSAGE = 'handle_new_user: User ' || NEW.id || ' is NOT a super_admin. Proceeding with business_settings creation and business_admin role assignment.';

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
        RAISE WARNING USING MESSAGE = 'handle_new_user: Business settings unique_violation for user ' || NEW.id || ' (business_name: ' || COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'My Business') || ', business_id: ' || _generated_business_id || '). SQLSTATE: ' || SQLSTATE;
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
          _sqlstate = RETURNED_SQLSTATE,
          _message = MESSAGE_TEXT,
          _detail = PG_EXCEPTION_DETAIL,
          _hint = PG_EXCEPTION_HINT,
          _context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING USING MESSAGE = 'handle_new_user: Unexpected error during business_settings creation for user ' || NEW.id || ' (email: ' || NEW.email || '): SQLSTATE: ' || _sqlstate || ', Message: ' || _message || ', Detail: ' || _detail || ', Hint: ' || _hint || ', Context: ' || _context;
    END;

    -- Assign business_admin role to the user - this is CRITICAL for the first user of a business
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'business_admin')
      ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;
      
      -- Also add them as business_admin in business_users table (they own the business)
      INSERT INTO public.business_users (user_id, business_id, role)
      VALUES (NEW.id, _generated_business_id, 'business_admin')
      ON CONFLICT (user_id, business_id) DO UPDATE SET role = EXCLUDED.role;
      
    EXCEPTION
      WHEN unique_violation THEN
        RAISE WARNING USING MESSAGE = 'handle_new_user: User roles unique_violation for user ' || NEW.id || ' (role: business_admin). SQLSTATE: ' || SQLSTATE;
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS
          _sqlstate = RETURNED_SQLSTATE,
          _message = MESSAGE_TEXT,
          _detail = PG_EXCEPTION_DETAIL,
          _hint = PG_EXCEPTION_HINT,
          _context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING USING MESSAGE = 'handle_new_user: Unexpected error during user_roles creation for user ' || NEW.id || ' (email: ' || NEW.email || '): SQLSTATE: ' || _sqlstate || ', Message: ' || _message || ', Detail: ' || _detail || ', Hint: ' || _hint || ', Context: ' || _context;
    END;
  ELSE
    RAISE NOTICE USING MESSAGE = 'handle_new_user: User ' || NEW.id || ' is a super_admin. Skipping business_settings creation and business_admin role assignment.';
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();