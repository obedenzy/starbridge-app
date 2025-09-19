-- Add customer_email column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN customer_email TEXT;