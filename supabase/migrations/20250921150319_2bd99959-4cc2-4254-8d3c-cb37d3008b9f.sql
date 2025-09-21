-- Since there's no data in business_users and reviews tables, 
-- we can directly change the column types without complex data migration

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.business_users DROP CONSTRAINT IF EXISTS business_users_business_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_business_id_fkey;

-- Change business_users.business_id from UUID to BIGINT
ALTER TABLE public.business_users ALTER COLUMN business_id TYPE BIGINT;

-- Change reviews.business_id from UUID to BIGINT  
ALTER TABLE public.reviews ALTER COLUMN business_id TYPE BIGINT;

-- Add new foreign key constraints referencing business_settings.business_id
ALTER TABLE public.business_users 
ADD CONSTRAINT business_users_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);