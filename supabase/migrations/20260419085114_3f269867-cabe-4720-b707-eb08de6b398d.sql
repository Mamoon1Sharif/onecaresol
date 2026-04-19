
-- Extend care_receivers
ALTER TABLE public.care_receivers
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS forename text,
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS alias text,
  ADD COLUMN IF NOT EXISTS suffix text,
  ADD COLUMN IF NOT EXISTS pref text,
  ADD COLUMN IF NOT EXISTS sub_status text,
  ADD COLUMN IF NOT EXISTS sex_assigned_at_birth text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS sexual_orientation text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS ni_number text,
  ADD COLUMN IF NOT EXISTS authority_ref text,
  ADD COLUMN IF NOT EXISTS social_services_id text,
  ADD COLUMN IF NOT EXISTS cm2000_link text,
  ADD COLUMN IF NOT EXISTS keysafe text,
  ADD COLUMN IF NOT EXISTS mediverify text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS phone_appears_on_app boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS mobile_num_1 text,
  ADD COLUMN IF NOT EXISTS mobile_num_2 text,
  ADD COLUMN IF NOT EXISTS email_1 text,
  ADD COLUMN IF NOT EXISTS email_2 text,
  ADD COLUMN IF NOT EXISTS reference_no text,
  ADD COLUMN IF NOT EXISTS carer_pref text,
  ADD COLUMN IF NOT EXISTS risk_rating_description text,
  ADD COLUMN IF NOT EXISTS under_regulated_activity boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS npc_number text,
  ADD COLUMN IF NOT EXISTS contract_type text,
  ADD COLUMN IF NOT EXISTS area_name text,
  ADD COLUMN IF NOT EXISTS onboarding_status text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS medical_company_number text,
  ADD COLUMN IF NOT EXISTS medical_service_user_number text,
  ADD COLUMN IF NOT EXISTS medical_password text,
  ADD COLUMN IF NOT EXISTS service_start_date date,
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'Active';

-- DNAR Settings
CREATE TABLE IF NOT EXISTS public.receiver_dnar_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  applies_from date,
  applies_until date,
  document_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_dnar_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_dnar_settings" ON public.receiver_dnar_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_dnar_settings" ON public.receiver_dnar_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_dnar_settings" ON public.receiver_dnar_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_dnar_settings" ON public.receiver_dnar_settings FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_dnar_settings_updated BEFORE UPDATE ON public.receiver_dnar_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Qualification Requirements
CREATE TABLE IF NOT EXISTS public.receiver_qualification_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  qualification text NOT NULL,
  mandatory boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_qualification_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_qual_req" ON public.receiver_qualification_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_qual_req" ON public.receiver_qualification_requirements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_qual_req" ON public.receiver_qualification_requirements FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_qual_req" ON public.receiver_qualification_requirements FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_qual_req_updated BEFORE UPDATE ON public.receiver_qualification_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User Preferences
CREATE TABLE IF NOT EXISTS public.receiver_user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  care_giver_id uuid NOT NULL,
  rating int NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (care_receiver_id, care_giver_id)
);
ALTER TABLE public.receiver_user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_user_prefs" ON public.receiver_user_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_user_prefs" ON public.receiver_user_preferences FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_user_prefs" ON public.receiver_user_preferences FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_user_prefs" ON public.receiver_user_preferences FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_user_prefs_updated BEFORE UPDATE ON public.receiver_user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
