ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'company_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'company_member';