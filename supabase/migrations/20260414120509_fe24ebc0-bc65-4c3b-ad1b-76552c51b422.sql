
-- Add time tracking columns to daily_visits
ALTER TABLE public.daily_visits
  ADD COLUMN IF NOT EXISTS check_in_time timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS check_out_time timestamptz DEFAULT NULL;

-- Shift notes table
CREATE TABLE public.shift_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_visit_id uuid NOT NULL REFERENCES public.daily_visits(id) ON DELETE CASCADE,
  note text NOT NULL,
  author text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read shift_notes" ON public.shift_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert shift_notes" ON public.shift_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update shift_notes" ON public.shift_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete shift_notes" ON public.shift_notes FOR DELETE TO authenticated USING (true);

-- Shift tasks table
CREATE TABLE public.shift_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_visit_id uuid NOT NULL REFERENCES public.daily_visits(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_by text DEFAULT NULL,
  completed_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read shift_tasks" ON public.shift_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert shift_tasks" ON public.shift_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update shift_tasks" ON public.shift_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete shift_tasks" ON public.shift_tasks FOR DELETE TO authenticated USING (true);

-- Enable realtime for both new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_tasks;
