
-- =====================================================================
-- 1. COMPANIES TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code text UNIQUE NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

INSERT INTO public.companies (company_code, name)
VALUES ('DEFAULT', 'Default Company')
ON CONFLICT (company_code) DO NOTHING;

-- =====================================================================
-- 2. COMPANY_USERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  username text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, username),
  UNIQUE (user_id)
);

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 3. SECURITY DEFINER HELPERS
-- =====================================================================
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.company_users WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.resolve_login_email(_company_code text, _username text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT u.email
  FROM public.company_users cu
  JOIN public.companies c ON c.id = cu.company_id
  JOIN auth.users u ON u.id = cu.user_id
  WHERE lower(c.company_code) = lower(_company_code)
    AND lower(cu.username) = lower(_username)
    AND c.status = 'Active'
    AND cu.status = 'Active'
  LIMIT 1
$$;

-- =====================================================================
-- 4. ADD company_id TO EVERY TENANT TABLE + BACKFILL
-- =====================================================================
DO $$
DECLARE
  default_co uuid;
  t text;
  tenant_tables text[] := ARRAY[
    'care_givers','care_receivers',
    'caregiver_availability','caregiver_changelog','caregiver_document_categories',
    'caregiver_documents','caregiver_holidays','caregiver_incidents','caregiver_key_contacts',
    'caregiver_private_notes','caregiver_push_notifications','caregiver_qualifications',
    'caregiver_reminders','caregiver_rota_notes','caregiver_vaccinations',
    'communication_actions','communication_logs','communication_reasons',
    'daily_visits','dashboard_visits','health_goals','medications',
    'receiver_availability','receiver_changelog','receiver_dnar_settings',
    'receiver_document_categories','receiver_documents','receiver_holidays',
    'receiver_incidents','receiver_key_contacts','receiver_private_notes',
    'receiver_push_notifications','receiver_qualification_requirements',
    'receiver_qualifications','receiver_reminders','receiver_user_preferences',
    'risk_assessments','shift_notes','shift_tasks','shifts','visit_notes'
  ];
BEGIN
  SELECT id INTO default_co FROM public.companies WHERE company_code = 'DEFAULT';

  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id uuid', t);
    EXECUTE format('UPDATE public.%I SET company_id = %L WHERE company_id IS NULL', t, default_co);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET NOT NULL', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET DEFAULT public.current_company_id()', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(company_id)', t || '_company_id_idx', t);
  END LOOP;
END$$;

-- =====================================================================
-- 5. REPLACE PERMISSIVE RLS WITH COMPANY-SCOPED POLICIES
-- =====================================================================
DO $$
DECLARE
  t text;
  pol record;
  tenant_tables text[] := ARRAY[
    'care_givers','care_receivers',
    'caregiver_availability','caregiver_changelog','caregiver_document_categories',
    'caregiver_documents','caregiver_holidays','caregiver_incidents','caregiver_key_contacts',
    'caregiver_private_notes','caregiver_push_notifications','caregiver_qualifications',
    'caregiver_reminders','caregiver_rota_notes','caregiver_vaccinations',
    'communication_actions','communication_logs','communication_reasons',
    'daily_visits','dashboard_visits','health_goals','medications',
    'receiver_availability','receiver_changelog','receiver_dnar_settings',
    'receiver_document_categories','receiver_documents','receiver_holidays',
    'receiver_incidents','receiver_key_contacts','receiver_private_notes',
    'receiver_push_notifications','receiver_qualification_requirements',
    'receiver_qualifications','receiver_reminders','receiver_user_preferences',
    'risk_assessments','shift_notes','shift_tasks','shifts','visit_notes'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format($p$
      CREATE POLICY "tenant_select" ON public.%I FOR SELECT TO authenticated
      USING (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "tenant_insert" ON public.%I FOR INSERT TO authenticated
      WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "tenant_update" ON public.%I FOR UPDATE TO authenticated
      USING (company_id = public.current_company_id() OR public.is_super_admin())
      WITH CHECK (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);

    EXECUTE format($p$
      CREATE POLICY "tenant_delete" ON public.%I FOR DELETE TO authenticated
      USING (company_id = public.current_company_id() OR public.is_super_admin())
    $p$, t);
  END LOOP;
END$$;

-- =====================================================================
-- 6. RLS for companies + company_users
-- =====================================================================
DROP POLICY IF EXISTS "members_view_company" ON public.companies;
CREATE POLICY "members_view_company" ON public.companies
FOR SELECT TO authenticated
USING (id = public.current_company_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_insert_companies" ON public.companies;
CREATE POLICY "super_admin_insert_companies" ON public.companies
FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_update_companies" ON public.companies;
CREATE POLICY "super_admin_update_companies" ON public.companies
FOR UPDATE TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_delete_companies" ON public.companies;
CREATE POLICY "super_admin_delete_companies" ON public.companies
FOR DELETE TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "view_same_company_users" ON public.company_users;
CREATE POLICY "view_same_company_users" ON public.company_users
FOR SELECT TO authenticated
USING (company_id = public.current_company_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "company_admin_insert_users" ON public.company_users;
CREATE POLICY "company_admin_insert_users" ON public.company_users
FOR INSERT TO authenticated
WITH CHECK (
  public.is_super_admin() OR
  (public.is_company_admin() AND company_id = public.current_company_id())
);

DROP POLICY IF EXISTS "company_admin_update_users" ON public.company_users;
CREATE POLICY "company_admin_update_users" ON public.company_users
FOR UPDATE TO authenticated
USING (
  public.is_super_admin() OR
  (public.is_company_admin() AND company_id = public.current_company_id())
);

DROP POLICY IF EXISTS "company_admin_delete_users" ON public.company_users;
CREATE POLICY "company_admin_delete_users" ON public.company_users
FOR DELETE TO authenticated
USING (
  public.is_super_admin() OR
  (public.is_company_admin() AND company_id = public.current_company_id())
);

-- =====================================================================
-- 7. updated_at triggers
-- =====================================================================
DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_company_users_updated_at ON public.company_users;
CREATE TRIGGER trg_company_users_updated_at BEFORE UPDATE ON public.company_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
