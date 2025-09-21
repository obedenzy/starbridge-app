-- First, let's check current constraints and data types
-- Update business_users table to reference business_settings.business_id instead of business_settings.id
-- Note: business_id in business_settings is BIGINT, so business_id in other tables should match

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.business_users DROP CONSTRAINT IF EXISTS business_users_business_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_business_id_fkey;

-- Ensure business_id columns have the correct data type (BIGINT to match business_settings.business_id)
-- First check if we need to update the column types
DO $$
BEGIN
    -- Update business_users.business_id to BIGINT if not already
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'business_users' 
               AND column_name = 'business_id' 
               AND data_type != 'bigint') THEN
        ALTER TABLE public.business_users ALTER COLUMN business_id TYPE BIGINT;
    END IF;

    -- Update reviews.business_id to BIGINT if not already  
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reviews' 
               AND column_name = 'business_id' 
               AND data_type != 'bigint') THEN
        ALTER TABLE public.reviews ALTER COLUMN business_id TYPE BIGINT;
    END IF;
END $$;

-- Add new foreign key constraints referencing business_settings.business_id
ALTER TABLE public.business_users 
ADD CONSTRAINT business_users_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);