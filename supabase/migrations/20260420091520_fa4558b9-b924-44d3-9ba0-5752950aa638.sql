
-- Communication Reasons (configurable list)
CREATE TABLE public.communication_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view reasons" ON public.communication_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert reasons" ON public.communication_reasons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update reasons" ON public.communication_reasons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete reasons" ON public.communication_reasons FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_communication_reasons_updated_at
BEFORE UPDATE ON public.communication_reasons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Communication Logs
CREATE TABLE public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL DEFAULT 'outgoing', -- outgoing | incoming
  comm_type TEXT NOT NULL DEFAULT 'call',     -- call | email
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  subject TEXT,
  notes TEXT,
  reason_id UUID REFERENCES public.communication_reasons(id) ON DELETE SET NULL,
  reason_label TEXT,
  logged_by TEXT,
  logged_for TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view comm logs" ON public.communication_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert comm logs" ON public.communication_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update comm logs" ON public.communication_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete comm logs" ON public.communication_logs FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_communication_logs_updated_at
BEFORE UPDATE ON public.communication_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_comm_logs_occurred_at ON public.communication_logs(occurred_at DESC);
CREATE INDEX idx_comm_logs_direction ON public.communication_logs(direction);

-- Communication Actions (follow-ups)
CREATE TABLE public.communication_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID REFERENCES public.communication_logs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth can view actions" ON public.communication_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth can insert actions" ON public.communication_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update actions" ON public.communication_actions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete actions" ON public.communication_actions FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_communication_actions_updated_at
BEFORE UPDATE ON public.communication_actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_comm_actions_log_id ON public.communication_actions(log_id);
