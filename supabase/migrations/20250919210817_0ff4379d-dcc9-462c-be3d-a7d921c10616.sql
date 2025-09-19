-- Add thank_you_message column to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS thank_you_message TEXT DEFAULT 'Thank you for your feedback! We appreciate your time.';