
-- Care Givers
CREATE TABLE public.care_givers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  skills TEXT[] DEFAULT '{}',
  last_check_in TEXT DEFAULT 'Never',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_givers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read care_givers" ON public.care_givers FOR SELECT USING (true);
CREATE POLICY "Public insert care_givers" ON public.care_givers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update care_givers" ON public.care_givers FOR UPDATE USING (true);
CREATE POLICY "Public delete care_givers" ON public.care_givers FOR DELETE USING (true);

-- Care Receivers
CREATE TABLE public.care_receivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  address TEXT,
  next_of_kin TEXT,
  next_of_kin_phone TEXT,
  care_status TEXT NOT NULL DEFAULT 'Active',
  care_plan TEXT DEFAULT '',
  dnacpr BOOLEAN NOT NULL DEFAULT false,
  care_type TEXT NOT NULL DEFAULT '8h-morning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_receivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read care_receivers" ON public.care_receivers FOR SELECT USING (true);
CREATE POLICY "Public insert care_receivers" ON public.care_receivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update care_receivers" ON public.care_receivers FOR UPDATE USING (true);
CREATE POLICY "Public delete care_receivers" ON public.care_receivers FOR DELETE USING (true);

-- Medications
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  administered_by TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read medications" ON public.medications FOR SELECT USING (true);
CREATE POLICY "Public insert medications" ON public.medications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update medications" ON public.medications FOR UPDATE USING (true);
CREATE POLICY "Public delete medications" ON public.medications FOR DELETE USING (true);

-- Visit Notes
CREATE TABLE public.visit_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  caregiver TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read visit_notes" ON public.visit_notes FOR SELECT USING (true);
CREATE POLICY "Public insert visit_notes" ON public.visit_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update visit_notes" ON public.visit_notes FOR UPDATE USING (true);
CREATE POLICY "Public delete visit_notes" ON public.visit_notes FOR DELETE USING (true);

-- Risk Assessments
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Low',
  mitigations TEXT DEFAULT '',
  last_reviewed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read risk_assessments" ON public.risk_assessments FOR SELECT USING (true);
CREATE POLICY "Public insert risk_assessments" ON public.risk_assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update risk_assessments" ON public.risk_assessments FOR UPDATE USING (true);
CREATE POLICY "Public delete risk_assessments" ON public.risk_assessments FOR DELETE USING (true);

-- Health Goals
CREATE TABLE public.health_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID NOT NULL REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  target TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Not Started',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read health_goals" ON public.health_goals FOR SELECT USING (true);
CREATE POLICY "Public insert health_goals" ON public.health_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update health_goals" ON public.health_goals FOR UPDATE USING (true);
CREATE POLICY "Public delete health_goals" ON public.health_goals FOR DELETE USING (true);

-- Shifts (Weekly Roster)
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID REFERENCES public.care_givers(id) ON DELETE SET NULL,
  care_receiver_id UUID REFERENCES public.care_receivers(id) ON DELETE SET NULL,
  day INTEGER NOT NULL DEFAULT 0,
  start_time TEXT NOT NULL DEFAULT '07:00',
  end_time TEXT NOT NULL DEFAULT '14:00',
  shift_type TEXT NOT NULL DEFAULT 'Morning',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Public insert shifts" ON public.shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update shifts" ON public.shifts FOR UPDATE USING (true);
CREATE POLICY "Public delete shifts" ON public.shifts FOR DELETE USING (true);

-- Daily Visits (Daily Roster)
CREATE TABLE public.daily_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_receiver_id UUID REFERENCES public.care_receivers(id) ON DELETE CASCADE,
  care_giver_id UUID REFERENCES public.care_givers(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_hour INTEGER NOT NULL DEFAULT 8,
  duration INTEGER NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read daily_visits" ON public.daily_visits FOR SELECT USING (true);
CREATE POLICY "Public insert daily_visits" ON public.daily_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update daily_visits" ON public.daily_visits FOR UPDATE USING (true);
CREATE POLICY "Public delete daily_visits" ON public.daily_visits FOR DELETE USING (true);

-- Dashboard Visits (Live Monitor)
CREATE TABLE public.dashboard_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver TEXT NOT NULL,
  assigned_member TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  check_in_status TEXT NOT NULL DEFAULT 'Not Arrived',
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read dashboard_visits" ON public.dashboard_visits FOR SELECT USING (true);
CREATE POLICY "Public insert dashboard_visits" ON public.dashboard_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update dashboard_visits" ON public.dashboard_visits FOR UPDATE USING (true);
CREATE POLICY "Public delete dashboard_visits" ON public.dashboard_visits FOR DELETE USING (true);

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_care_givers_updated_at BEFORE UPDATE ON public.care_givers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_receivers_updated_at BEFORE UPDATE ON public.care_receivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_visits_updated_at BEFORE UPDATE ON public.daily_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dashboard_visits and daily_visits
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_visits;
