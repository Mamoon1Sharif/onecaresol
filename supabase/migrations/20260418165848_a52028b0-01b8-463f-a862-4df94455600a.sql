
CREATE TABLE public.caregiver_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  start_date DATE,
  expiry_date DATE,
  never_expires BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'In Date',
  sub_status TEXT NOT NULL DEFAULT 'None',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_qualifications_cg ON public.caregiver_qualifications(care_giver_id, qualification);

ALTER TABLE public.caregiver_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_qualifications"
  ON public.caregiver_qualifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_qualifications"
  ON public.caregiver_qualifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_qualifications"
  ON public.caregiver_qualifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_qualifications"
  ON public.caregiver_qualifications FOR DELETE TO authenticated USING (true);
