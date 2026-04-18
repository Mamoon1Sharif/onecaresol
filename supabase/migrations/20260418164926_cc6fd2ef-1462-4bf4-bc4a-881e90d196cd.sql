
CREATE TABLE public.caregiver_push_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  created_by TEXT,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_push_notifications_cg ON public.caregiver_push_notifications(care_giver_id, created_at DESC);

ALTER TABLE public.caregiver_push_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth insert caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth delete caregiver_push_notifications"
  ON public.caregiver_push_notifications FOR DELETE TO authenticated USING (true);
