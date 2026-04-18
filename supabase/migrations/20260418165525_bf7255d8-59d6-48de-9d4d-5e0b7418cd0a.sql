
CREATE TABLE public.caregiver_vaccinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  dose TEXT,
  date_administered DATE,
  expiry_date DATE,
  batch_number TEXT,
  administered_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_vaccinations_cg ON public.caregiver_vaccinations(care_giver_id, date_administered DESC);

ALTER TABLE public.caregiver_vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_vaccinations"
  ON public.caregiver_vaccinations FOR DELETE TO authenticated USING (true);
