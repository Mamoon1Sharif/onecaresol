CREATE TABLE public.reminder_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID,
  scope TEXT NOT NULL CHECK (scope IN ('client','team')),
  reminder_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view reminder templates"
  ON public.reminder_templates FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert reminder templates"
  ON public.reminder_templates FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update reminder templates"
  ON public.reminder_templates FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated can delete reminder templates"
  ON public.reminder_templates FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_reminder_templates_updated_at
  BEFORE UPDATE ON public.reminder_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults from screenshot
INSERT INTO public.reminder_templates (scope, reminder_name, description, status) VALUES
  ('client','6 Month Review','6 Month Review','Active'),
  ('client','6 month review due',NULL,'Active'),
  ('client','6 Week Review','6 Week review','Active'),
  ('client','6 week review due',NULL,'Active'),
  ('client','Annual Review',NULL,'Active'),
  ('client','Care Plan Review',NULL,'Active'),
  ('client','Catheter products to reorder',NULL,'Active'),
  ('client','Early call',NULL,'Active'),
  ('client','General Audit',NULL,'Active'),
  ('client','Hearing aids check','Arrange for aids to be cleaned at the hospital','Active'),
  ('client','Hoist Service Due','6 monthly service','Active'),
  ('client','Hospital Bed service',NULL,'Active'),
  ('client','Incontinence products','To activate order for inco pads','Active'),
  ('client','Medication Review',NULL,'Active'),
  ('client','Re-order medication',NULL,'Active'),
  ('team','1-2-1 Supervision due',NULL,'Active'),
  ('team','10 Year service reminder',NULL,'Active'),
  ('team','15 Year Service Reminder',NULL,'Active'),
  ('team','20 Year Service Reminder',NULL,'Active'),
  ('team','25 Year Service Reminder',NULL,'Active'),
  ('team','3 Month Probation Review',NULL,'Active'),
  ('team','6 Month Probation Review',NULL,'Active'),
  ('team','Appraisial',NULL,'Active'),
  ('team','Car Insurance Certificate',NULL,'Active'),
  ('team','Car Tax','Check car is taxed','Active'),
  ('team','Catheter Care Competency Check',NULL,'Active'),
  ('team','Competency check for Moving and Handling',NULL,'Active'),
  ('team','CoS Expiry Date',NULL,'Active'),
  ('team','DBS Refund due','To refund £65.20','Active');