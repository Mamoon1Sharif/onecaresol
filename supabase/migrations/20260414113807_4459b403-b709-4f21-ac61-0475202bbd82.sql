
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop all permissive public policies and replace with authenticated-only

-- care_givers
DROP POLICY IF EXISTS "Public read care_givers" ON public.care_givers;
DROP POLICY IF EXISTS "Public insert care_givers" ON public.care_givers;
DROP POLICY IF EXISTS "Public update care_givers" ON public.care_givers;
DROP POLICY IF EXISTS "Public delete care_givers" ON public.care_givers;
CREATE POLICY "Auth read care_givers" ON public.care_givers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert care_givers" ON public.care_givers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update care_givers" ON public.care_givers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete care_givers" ON public.care_givers FOR DELETE TO authenticated USING (true);

-- care_receivers
DROP POLICY IF EXISTS "Public read care_receivers" ON public.care_receivers;
DROP POLICY IF EXISTS "Public insert care_receivers" ON public.care_receivers;
DROP POLICY IF EXISTS "Public update care_receivers" ON public.care_receivers;
DROP POLICY IF EXISTS "Public delete care_receivers" ON public.care_receivers;
CREATE POLICY "Auth read care_receivers" ON public.care_receivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert care_receivers" ON public.care_receivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update care_receivers" ON public.care_receivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete care_receivers" ON public.care_receivers FOR DELETE TO authenticated USING (true);

-- medications
DROP POLICY IF EXISTS "Public read medications" ON public.medications;
DROP POLICY IF EXISTS "Public insert medications" ON public.medications;
DROP POLICY IF EXISTS "Public update medications" ON public.medications;
DROP POLICY IF EXISTS "Public delete medications" ON public.medications;
CREATE POLICY "Auth read medications" ON public.medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert medications" ON public.medications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update medications" ON public.medications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete medications" ON public.medications FOR DELETE TO authenticated USING (true);

-- visit_notes
DROP POLICY IF EXISTS "Public read visit_notes" ON public.visit_notes;
DROP POLICY IF EXISTS "Public insert visit_notes" ON public.visit_notes;
DROP POLICY IF EXISTS "Public update visit_notes" ON public.visit_notes;
DROP POLICY IF EXISTS "Public delete visit_notes" ON public.visit_notes;
CREATE POLICY "Auth read visit_notes" ON public.visit_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert visit_notes" ON public.visit_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update visit_notes" ON public.visit_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete visit_notes" ON public.visit_notes FOR DELETE TO authenticated USING (true);

-- risk_assessments
DROP POLICY IF EXISTS "Public read risk_assessments" ON public.risk_assessments;
DROP POLICY IF EXISTS "Public insert risk_assessments" ON public.risk_assessments;
DROP POLICY IF EXISTS "Public update risk_assessments" ON public.risk_assessments;
DROP POLICY IF EXISTS "Public delete risk_assessments" ON public.risk_assessments;
CREATE POLICY "Auth read risk_assessments" ON public.risk_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert risk_assessments" ON public.risk_assessments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update risk_assessments" ON public.risk_assessments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete risk_assessments" ON public.risk_assessments FOR DELETE TO authenticated USING (true);

-- health_goals
DROP POLICY IF EXISTS "Public read health_goals" ON public.health_goals;
DROP POLICY IF EXISTS "Public insert health_goals" ON public.health_goals;
DROP POLICY IF EXISTS "Public update health_goals" ON public.health_goals;
DROP POLICY IF EXISTS "Public delete health_goals" ON public.health_goals;
CREATE POLICY "Auth read health_goals" ON public.health_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert health_goals" ON public.health_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update health_goals" ON public.health_goals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete health_goals" ON public.health_goals FOR DELETE TO authenticated USING (true);

-- shifts
DROP POLICY IF EXISTS "Public read shifts" ON public.shifts;
DROP POLICY IF EXISTS "Public insert shifts" ON public.shifts;
DROP POLICY IF EXISTS "Public update shifts" ON public.shifts;
DROP POLICY IF EXISTS "Public delete shifts" ON public.shifts;
CREATE POLICY "Auth read shifts" ON public.shifts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert shifts" ON public.shifts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update shifts" ON public.shifts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete shifts" ON public.shifts FOR DELETE TO authenticated USING (true);

-- daily_visits
DROP POLICY IF EXISTS "Public read daily_visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Public insert daily_visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Public update daily_visits" ON public.daily_visits;
DROP POLICY IF EXISTS "Public delete daily_visits" ON public.daily_visits;
CREATE POLICY "Auth read daily_visits" ON public.daily_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert daily_visits" ON public.daily_visits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update daily_visits" ON public.daily_visits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete daily_visits" ON public.daily_visits FOR DELETE TO authenticated USING (true);

-- dashboard_visits
DROP POLICY IF EXISTS "Public read dashboard_visits" ON public.dashboard_visits;
DROP POLICY IF EXISTS "Public insert dashboard_visits" ON public.dashboard_visits;
DROP POLICY IF EXISTS "Public update dashboard_visits" ON public.dashboard_visits;
DROP POLICY IF EXISTS "Public delete dashboard_visits" ON public.dashboard_visits;
CREATE POLICY "Auth read dashboard_visits" ON public.dashboard_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert dashboard_visits" ON public.dashboard_visits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update dashboard_visits" ON public.dashboard_visits FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete dashboard_visits" ON public.dashboard_visits FOR DELETE TO authenticated USING (true);
