-- Fix the function search path security warning
CREATE OR REPLACE FUNCTION public.generate_unique_10_digit_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 10-digit number
        new_id := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        
        -- Check if this ID already exists in business_settings
        SELECT EXISTS(
            SELECT 1 FROM public.business_settings 
            WHERE business_id::TEXT = new_id
        ) INTO id_exists;
        
        -- If it doesn't exist, we can use it
        IF NOT id_exists THEN
            RETURN new_id;
        END IF;
    END LOOP;
END;
$$;