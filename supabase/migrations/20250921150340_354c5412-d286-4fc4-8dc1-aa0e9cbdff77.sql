-- Drop and recreate the business_id columns with correct type
-- Since tables are empty, this is safe

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.business_users DROP CONSTRAINT IF EXISTS business_users_business_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_business_id_fkey;

-- Drop and recreate business_users.business_id column
ALTER TABLE public.business_users DROP COLUMN business_id;
ALTER TABLE public.business_users ADD COLUMN business_id BIGINT NOT NULL;

-- Drop and recreate reviews.business_id column
ALTER TABLE public.reviews DROP COLUMN business_id;
ALTER TABLE public.reviews ADD COLUMN business_id BIGINT NOT NULL;

-- Add new foreign key constraints referencing business_settings.business_id
ALTER TABLE public.business_users 
ADD CONSTRAINT business_users_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);