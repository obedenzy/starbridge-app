-- Create business_users table to track users for each business
CREATE TABLE public.business_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'business_user',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Enable RLS on business_users
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

-- Create policies for business_users table
CREATE POLICY "Business admins can manage business users" 
ON public.business_users 
FOR ALL 
USING (
  business_id IN (
    SELECT bs.id 
    FROM public.business_settings bs 
    JOIN public.business_users bu ON bs.id = bu.business_id 
    WHERE bu.user_id = auth.uid() AND bu.role = 'business_admin'
  )
);

CREATE POLICY "Business owners can manage business users" 
ON public.business_users 
FOR ALL 
USING (
  business_id IN (
    SELECT id 
    FROM public.business_settings 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own business user record" 
ON public.business_users 
FOR SELECT 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_business_users_updated_at
  BEFORE UPDATE ON public.business_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();