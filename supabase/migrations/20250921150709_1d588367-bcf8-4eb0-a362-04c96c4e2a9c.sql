-- Recreate RLS policies with updated business_id references

-- Business Users RLS Policies
CREATE POLICY "Business admins can manage business users" ON public.business_users
FOR ALL USING (
  business_id IN (
    SELECT bs.business_id
    FROM business_settings bs
    JOIN business_users bu ON bs.business_id = bu.business_id
    WHERE bu.user_id = auth.uid() AND bu.role = 'business_admin'::app_role
  )
);

CREATE POLICY "Business owners can manage business users" ON public.business_users
FOR ALL USING (
  business_id IN (
    SELECT bs.business_id
    FROM business_settings bs
    WHERE bs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own business user record" ON public.business_users
FOR SELECT USING (user_id = auth.uid());

-- Reviews RLS Policies  
CREATE POLICY "Users can view reviews for their business" ON public.reviews
FOR SELECT USING (
  business_id IN (
    SELECT bs.business_id
    FROM business_settings bs
    WHERE bs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update reviews for their business" ON public.reviews
FOR UPDATE USING (
  business_id IN (
    SELECT bs.business_id
    FROM business_settings bs
    WHERE bs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete reviews for their business" ON public.reviews
FOR DELETE USING (
  business_id IN (
    SELECT bs.business_id
    FROM business_settings bs
    WHERE bs.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all reviews" ON public.reviews
FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all reviews" ON public.reviews
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Secure review submissions" ON public.reviews
FOR INSERT WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM business_settings
    WHERE business_settings.business_id = reviews.business_id 
    AND business_settings.status = 'active'::text
  )) 
  AND (customer_name IS NOT NULL) 
  AND (customer_name <> ''::text) 
  AND (rating >= 1) 
  AND (rating <= 5) 
  AND ((rating >= 4) OR ((rating < 4) AND (customer_email IS NOT NULL) AND (customer_email <> ''::text) AND (comment IS NOT NULL) AND (comment <> ''::text)))
);