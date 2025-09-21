-- First, manually create the missing user roles and business users entries for current user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('c4ca74ce-afc5-4349-a99e-a3774e6ecc2d', 'business_admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.business_users (user_id, business_id, role) 
VALUES ('c4ca74ce-afc5-4349-a99e-a3774e6ecc2d', 8612767411, 'business_admin')
ON CONFLICT DO NOTHING;

-- Fix the business_users table constraint issue by adding proper unique constraints
-- First check if constraint exists and add if missing
DO $$
BEGIN
    -- Add unique constraint for business_users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'business_users_user_id_business_id_key'
    ) THEN
        ALTER TABLE public.business_users 
        ADD CONSTRAINT business_users_user_id_business_id_key UNIQUE (user_id, business_id);
    END IF;
END $$;