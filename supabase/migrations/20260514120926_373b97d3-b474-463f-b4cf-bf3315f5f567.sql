CREATE TABLE public.shift_task_medician (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_visit_id UUID NOT NULL REFERENCES public.daily_visits(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  medication TEXT,
  dosage TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL DEFAULT current_company_id()
);

CREATE INDEX shift_task_medician_company_id_idx ON public.shift_task_medician(company_id);
CREATE INDEX shift_task_medician_daily_visit_id_idx ON public.shift_task_medician(daily_visit_id);

ALTER TABLE public.shift_task_medician ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON public.shift_task_medician FOR SELECT TO authenticated
  USING ((company_id = current_company_id()) OR is_super_admin());
CREATE POLICY "tenant_insert" ON public.shift_task_medician FOR INSERT TO authenticated
  WITH CHECK ((company_id = current_company_id()) OR is_super_admin());
CREATE POLICY "tenant_update" ON public.shift_task_medician FOR UPDATE TO authenticated
  USING ((company_id = current_company_id()) OR is_super_admin())
  WITH CHECK ((company_id = current_company_id()) OR is_super_admin());
CREATE POLICY "tenant_delete" ON public.shift_task_medician FOR DELETE TO authenticated
  USING ((company_id = current_company_id()) OR is_super_admin());