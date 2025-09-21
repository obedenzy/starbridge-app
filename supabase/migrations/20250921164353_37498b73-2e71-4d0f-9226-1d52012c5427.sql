-- Fix the user_roles table unique constraint issue
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add the proper unique constraint that the ON CONFLICT clause expects
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Check and fix business_settings foreign key constraint if needed
-- First, let's see what foreign keys exist
DO $$
BEGIN
    -- Drop the problematic foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'business_settings_user_id_fkey' 
        AND table_name = 'business_settings'
    ) THEN
        ALTER TABLE public.business_settings DROP CONSTRAINT business_settings_user_id_fkey;
    END IF;
    
    -- We don't want a foreign key to auth.users as it's managed by Supabase
    -- The user_id should just be a UUID that matches auth.uid()
END $$;