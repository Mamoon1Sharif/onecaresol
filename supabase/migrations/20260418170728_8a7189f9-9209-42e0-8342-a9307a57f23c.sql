-- Create caregiver_incidents table
CREATE TABLE public.caregiver_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  incident_ref TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Low',
  status TEXT NOT NULL DEFAULT 'Open',
  created_by TEXT,
  created_for TEXT,
  description TEXT NOT NULL DEFAULT '',
  incident_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_incidents" ON public.caregiver_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_incidents" ON public.caregiver_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_incidents" ON public.caregiver_incidents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_incidents" ON public.caregiver_incidents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_incidents_updated_at
BEFORE UPDATE ON public.caregiver_incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_caregiver_incidents_care_giver_id ON public.caregiver_incidents(care_giver_id);
CREATE INDEX idx_caregiver_incidents_status ON public.caregiver_incidents(status);