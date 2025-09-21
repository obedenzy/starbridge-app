-- Fix security warnings by setting search_path for functions that don't have it set

-- Fix generate_random_string function
CREATE OR REPLACE FUNCTION public.generate_random_string(length integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  IF length < 0 THEN
    RAISE EXCEPTION 'Given length cannot be less than 0';
  END IF;
  FOR i IN 1..length LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Fix check_review_rate_limit function
CREATE OR REPLACE FUNCTION public.check_review_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if more than 3 reviews from same email in last hour
  IF (
    SELECT COUNT(*) 
    FROM public.reviews 
    WHERE customer_email = NEW.customer_email 
    AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum 3 reviews per email per hour.';
  END IF;
  
  -- Check if more than 1 review for same business from same email in last 24 hours
  IF (
    SELECT COUNT(*) 
    FROM public.reviews 
    WHERE business_id = NEW.business_id 
    AND customer_email = NEW.customer_email 
    AND created_at > NOW() - INTERVAL '24 hours'
  ) >= 1 THEN
    RAISE EXCEPTION 'You can only submit one review per business per day.';
  END IF;
  
  RETURN NEW;
END;
$function$;