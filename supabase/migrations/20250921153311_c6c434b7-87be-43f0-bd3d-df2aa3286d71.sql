-- Fix function conflicts and ensure proper role system

-- Drop the conflicting UUID version of get_user_business_role function
DROP FUNCTION IF EXISTS public.get_user_business_role(user_id_param uuid, business_id_param uuid);

-- Keep only the BIGINT version that matches our current database structure
-- This function should already exist and work with business_id as BIGINT

-- Also ensure we have the correct versions of other functions
DROP FUNCTION IF EXISTS public.remove_user_from_business(business_id_param uuid, user_id_param uuid);
DROP FUNCTION IF EXISTS public.update_business_user_role(business_id_param uuid, user_id_param uuid, new_role_param app_role);
DROP FUNCTION IF EXISTS public.invite_user_to_business(business_id_param uuid, email_param text, role_param app_role);

-- These functions should already exist with BIGINT business_id_param from our previous migration