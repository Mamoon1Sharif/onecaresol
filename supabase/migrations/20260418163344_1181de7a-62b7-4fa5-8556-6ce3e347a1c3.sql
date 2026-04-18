CREATE TABLE public.caregiver_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '17:00',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_availability" ON public.caregiver_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_availability" ON public.caregiver_availability FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_availability" ON public.caregiver_availability FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_availability" ON public.caregiver_availability FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_availability_updated_at
BEFORE UPDATE ON public.caregiver_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();