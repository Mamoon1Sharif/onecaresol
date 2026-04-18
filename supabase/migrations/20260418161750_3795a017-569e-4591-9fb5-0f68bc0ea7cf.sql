
CREATE TABLE public.caregiver_private_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  service_user_id UUID REFERENCES public.care_receivers(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_private_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_private_notes" ON public.caregiver_private_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_private_notes" ON public.caregiver_private_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_private_notes" ON public.caregiver_private_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_private_notes" ON public.caregiver_private_notes FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_private_notes_updated_at
BEFORE UPDATE ON public.caregiver_private_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.caregiver_rota_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  rota_ref TEXT,
  note_ref TEXT,
  staff_name TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL,
  note_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_rota_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_rota_notes" ON public.caregiver_rota_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_rota_notes" ON public.caregiver_rota_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_rota_notes" ON public.caregiver_rota_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_rota_notes" ON public.caregiver_rota_notes FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_caregiver_private_notes_cg ON public.caregiver_private_notes(care_giver_id);
CREATE INDEX idx_caregiver_rota_notes_cg ON public.caregiver_rota_notes(care_giver_id);
