-- Fix the column type conversion with proper casting
-- Since we're changing UUID to BIGINT, we need to handle this carefully

-- First, let's update the business_users table
-- We'll need to update existing records to use the correct business_id from business_settings
UPDATE public.business_users 
SET business_id = (
    SELECT bs.business_id::text::uuid 
    FROM public.business_settings bs 
    WHERE bs.id = business_users.business_id::uuid
)
WHERE EXISTS (
    SELECT 1 FROM public.business_settings bs 
    WHERE bs.id = business_users.business_id::uuid
);

-- Now convert the column type
ALTER TABLE public.business_users 
ALTER COLUMN business_id TYPE BIGINT 
USING (
    SELECT bs.business_id 
    FROM public.business_settings bs 
    WHERE bs.id = business_users.business_id::uuid
);

-- Update the reviews table similarly
UPDATE public.reviews 
SET business_id = (
    SELECT bs.business_id::text::uuid 
    FROM public.business_settings bs 
    WHERE bs.id = reviews.business_id::uuid
)
WHERE EXISTS (
    SELECT 1 FROM public.business_settings bs 
    WHERE bs.id = reviews.business_id::uuid
);

-- Convert the reviews.business_id column type
ALTER TABLE public.reviews 
ALTER COLUMN business_id TYPE BIGINT 
USING (
    SELECT bs.business_id 
    FROM public.business_settings bs 
    WHERE bs.id = reviews.business_id::uuid
);

-- Add the proper foreign key constraints
ALTER TABLE public.business_users 
ADD CONSTRAINT business_users_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);