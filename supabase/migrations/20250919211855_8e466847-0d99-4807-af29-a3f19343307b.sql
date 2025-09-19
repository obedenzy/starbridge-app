-- Add custom subscription amount field to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS custom_subscription_amount INTEGER DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.business_settings.custom_subscription_amount IS 'Custom monthly subscription amount in cents. If NULL, uses default $250/month (25000 cents)';