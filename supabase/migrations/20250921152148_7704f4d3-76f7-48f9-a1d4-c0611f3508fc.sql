-- Fix any remaining functions that don't have search_path set

-- Fix handle_new_user_and_business function if it exists and doesn't have search_path
CREATE OR REPLACE FUNCTION public.handle_new_user_and_business()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_business_id BIGINT;
  business_name_text TEXT;
BEGIN
  business_name_text := new.raw_user_meta_data->>'business_name';

  -- Block user creation if business_name is not provided
  IF business_name_text IS NULL OR business_name_text = '' THEN
    RAISE EXCEPTION 'Business name is required to sign up.';
  END IF;

  -- Create the user's profile
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'business_admin')
  ON CONFLICT (id) DO NOTHING;

  -- Generate a unique 10-digit business_id
  LOOP
    new_business_id := floor(random() * 9000000000) + 1000000000;
    PERFORM 1 FROM "public"."business_settings" WHERE "business_id" = new_business_id;
    IF NOT FOUND THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Create a new business_settings record.
  INSERT INTO "public"."business_settings" (user_id, business_name, business_id, public_path, status, review_threshold)
  VALUES (new.id, business_name_text, new_business_id, lower(regexp_replace(business_name_text, '\W+', '', 'g')), 'inactive', 4);

  -- Update the user's profile with the new business_id and business_name
  UPDATE "public"."profiles"
  SET "business_id" = new_business_id, "business_name" = business_name_text
  WHERE id = new.id;

  RETURN new;
END;
$function$;