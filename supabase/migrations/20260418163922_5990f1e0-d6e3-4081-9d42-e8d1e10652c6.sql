CREATE TABLE public.caregiver_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'holiday',
  start_date DATE NOT NULL,
  end_date DATE,
  hours NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'approved',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_holidays" ON public.caregiver_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_holidays" ON public.caregiver_holidays FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_holidays" ON public.caregiver_holidays FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_holidays" ON public.caregiver_holidays FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_holidays_updated_at
BEFORE UPDATE ON public.caregiver_holidays
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();