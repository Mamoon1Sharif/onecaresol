
CREATE TABLE public.caregiver_key_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  is_nok BOOLEAN NOT NULL DEFAULT false,
  lives_with BOOLEAN NOT NULL DEFAULT false,
  is_ice BOOLEAN NOT NULL DEFAULT false,
  show_on_app BOOLEAN NOT NULL DEFAULT false,
  contact_type TEXT,
  name TEXT NOT NULL,
  tel1 TEXT,
  tel2 TEXT,
  mobile TEXT,
  email TEXT,
  address1 TEXT,
  address2 TEXT,
  area TEXT,
  postcode TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_key_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_key_contacts" ON public.caregiver_key_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_key_contacts" ON public.caregiver_key_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_key_contacts" ON public.caregiver_key_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_key_contacts" ON public.caregiver_key_contacts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_key_contacts_updated_at
BEFORE UPDATE ON public.caregiver_key_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_caregiver_key_contacts_cg ON public.caregiver_key_contacts(care_giver_id);
