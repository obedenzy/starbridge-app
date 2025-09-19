-- Create missing profile and business settings for existing user
DO $$
DECLARE
    existing_user_id uuid;
BEGIN
    -- Get the user ID for nebulenz@gmail.com
    SELECT id INTO existing_user_id FROM auth.users WHERE email = 'nebulenz@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        -- Create profile if it doesn't exist
        INSERT INTO public.profiles (user_id, full_name, email, business_name, last_login)
        VALUES (
            existing_user_id,
            'Enoch Imoh',
            'nebulenz@gmail.com',
            'My Business',
            now()
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Create business settings if it doesn't exist
        INSERT INTO public.business_settings (user_id, business_name, contact_email, public_path, status)
        VALUES (
            existing_user_id,
            'My Business',
            'nebulenz@gmail.com',
            'my-business-' || SUBSTRING(existing_user_id::text FROM 1 FOR 8),
            'inactive'
        )
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Ensure user role exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (existing_user_id, 'business_user')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;