-- Drop dependent RLS policies first, then recreate columns and policies

-- Drop RLS policies that depend on business_id columns
DROP POLICY IF EXISTS "Business admins can manage business users" ON public.business_users;
DROP POLICY IF EXISTS "Business owners can manage business users" ON public.business_users;
DROP POLICY IF EXISTS "Users can view their own business user record" ON public.business_users;

DROP POLICY IF EXISTS "Users can view reviews for their business" ON public.reviews;
DROP POLICY IF EXISTS "Users can update reviews for their business" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete reviews for their business" ON public.reviews;
DROP POLICY IF EXISTS "Super admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Super admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Secure review submissions" ON public.reviews;

-- Drop existing foreign key constraints
ALTER TABLE public.business_users DROP CONSTRAINT IF EXISTS business_users_business_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_business_id_fkey;

-- Drop and recreate business_users.business_id column
ALTER TABLE public.business_users DROP COLUMN business_id CASCADE;
ALTER TABLE public.business_users ADD COLUMN business_id BIGINT NOT NULL;

-- Drop and recreate reviews.business_id column  
ALTER TABLE public.reviews DROP COLUMN business_id CASCADE;
ALTER TABLE public.reviews ADD COLUMN business_id BIGINT NOT NULL;

-- Add new foreign key constraints
ALTER TABLE public.business_users 
ADD CONSTRAINT business_users_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.business_settings(business_id);