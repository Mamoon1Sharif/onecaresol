CREATE TABLE public.caregiver_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL,
  reminder_name TEXT NOT NULL,
  account TEXT,
  first_due DATE,
  repeat_interval TEXT NOT NULL DEFAULT 'Never',
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  was_set_for DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT,
  completion_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_reminders" ON public.caregiver_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_reminders" ON public.caregiver_reminders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_reminders" ON public.caregiver_reminders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_reminders" ON public.caregiver_reminders FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_reminders_updated_at
BEFORE UPDATE ON public.caregiver_reminders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.caregiver_reminders (care_giver_id, reminder_name, account, first_due, repeat_interval, end_date, status)
SELECT id, 'DBS/PVG Reminder', name, '2026-11-27', 'Never', '2026-11-27', 'active'
FROM public.care_givers;

INSERT INTO public.caregiver_reminders (care_giver_id, reminder_name, account, was_set_for, status, completed_at, completed_by, completion_notes)
SELECT id, 'Right to Work', name, '2025-12-21', 'cancelled', '2026-04-14 09:10:00+00', 'Elizebeth Jordan', 'View Notes'
FROM public.care_givers;