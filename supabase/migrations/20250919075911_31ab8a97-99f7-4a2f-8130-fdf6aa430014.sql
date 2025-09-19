-- Add subscription tracking fields to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT,
ADD COLUMN subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_failed_at TIMESTAMP WITH TIME ZONE;