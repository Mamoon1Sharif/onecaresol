CREATE TABLE public.care_management_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_ongoing BOOLEAN NOT NULL DEFAULT true,
  visits TEXT[] NOT NULL DEFAULT '{}',
  is_medication BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Active',
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cmt_receiver ON public.care_management_tasks(care_receiver_id);
CREATE INDEX idx_cmt_company ON public.care_management_tasks(company_id);

ALTER TABLE public.care_management_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view care tasks"
ON public.care_management_tasks FOR SELECT
TO authenticated
USING (company_id = public.current_company_id());

CREATE POLICY "Company members can insert care tasks"
ON public.care_management_tasks FOR INSERT
TO authenticated
WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "Company members can update care tasks"
ON public.care_management_tasks FOR UPDATE
TO authenticated
USING (company_id = public.current_company_id());

CREATE POLICY "Company members can delete care tasks"
ON public.care_management_tasks FOR DELETE
TO authenticated
USING (company_id = public.current_company_id());

CREATE TRIGGER trg_cmt_updated_at
BEFORE UPDATE ON public.care_management_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();