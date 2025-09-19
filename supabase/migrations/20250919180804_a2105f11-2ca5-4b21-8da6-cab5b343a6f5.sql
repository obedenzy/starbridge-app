-- Create missing profile for the user
INSERT INTO public.profiles (user_id, full_name, email, business_name, last_login)
VALUES (
  'a826b895-aa25-4a9d-b3a1-f54e259246e8',
  'Enoch Imoh',
  'nebulenz@gmail.com',
  'Test Biz',
  now()
);

-- Create missing business settings for the user
INSERT INTO public.business_settings (user_id, business_name, contact_email, public_path, status)
VALUES (
  'a826b895-aa25-4a9d-b3a1-f54e259246e8',
  'Test Biz',
  'nebulenz@gmail.com',
  'test-biz-a826b895',
  'inactive'
);

-- Ensure user has business_user role
INSERT INTO public.user_roles (user_id, role)
VALUES ('a826b895-aa25-4a9d-b3a1-f54e259246e8', 'business_user')
ON CONFLICT (user_id, role) DO NOTHING;