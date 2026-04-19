
-- ===== Receiver Notes =====
CREATE TABLE public.receiver_private_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  care_giver_id uuid,
  note text NOT NULL,
  note_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_private_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_private_notes" ON public.receiver_private_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_private_notes" ON public.receiver_private_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_private_notes" ON public.receiver_private_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_private_notes" ON public.receiver_private_notes FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rpn_updated BEFORE UPDATE ON public.receiver_private_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Reminders =====
CREATE TABLE public.receiver_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  reminder_name text NOT NULL,
  account text,
  first_due date,
  repeat_interval text NOT NULL DEFAULT 'Never',
  end_date date,
  status text NOT NULL DEFAULT 'active',
  was_set_for date,
  completed_at timestamptz,
  completed_by text,
  completion_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_reminders" ON public.receiver_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_reminders" ON public.receiver_reminders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_reminders" ON public.receiver_reminders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_reminders" ON public.receiver_reminders FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rr_updated BEFORE UPDATE ON public.receiver_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Holidays =====
CREATE TABLE public.receiver_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  entry_type text NOT NULL DEFAULT 'holiday',
  start_date date NOT NULL,
  end_date date,
  hours numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'approved',
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_holidays" ON public.receiver_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_holidays" ON public.receiver_holidays FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_holidays" ON public.receiver_holidays FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_holidays" ON public.receiver_holidays FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rh_updated BEFORE UPDATE ON public.receiver_holidays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Key Contacts =====
CREATE TABLE public.receiver_key_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  name text NOT NULL,
  contact_type text,
  is_nok boolean NOT NULL DEFAULT false,
  is_ice boolean NOT NULL DEFAULT false,
  lives_with boolean NOT NULL DEFAULT false,
  show_on_app boolean NOT NULL DEFAULT false,
  mobile text,
  tel1 text,
  tel2 text,
  email text,
  address1 text,
  address2 text,
  area text,
  postcode text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_key_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_key_contacts" ON public.receiver_key_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_key_contacts" ON public.receiver_key_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_key_contacts" ON public.receiver_key_contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_key_contacts" ON public.receiver_key_contacts FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rkc_updated BEFORE UPDATE ON public.receiver_key_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Availability =====
CREATE TABLE public.receiver_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  week_number integer NOT NULL,
  day_of_week integer NOT NULL,
  start_time text NOT NULL DEFAULT '09:00',
  end_time text NOT NULL DEFAULT '17:00',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_availability" ON public.receiver_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_availability" ON public.receiver_availability FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_availability" ON public.receiver_availability FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_availability" ON public.receiver_availability FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_ra_updated BEFORE UPDATE ON public.receiver_availability FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Incidents =====
CREATE TABLE public.receiver_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  incident_ref text NOT NULL,
  severity text NOT NULL DEFAULT 'Low',
  status text NOT NULL DEFAULT 'Open',
  created_by text,
  created_for text,
  description text NOT NULL DEFAULT '',
  incident_date timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_incidents" ON public.receiver_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_incidents" ON public.receiver_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_incidents" ON public.receiver_incidents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_incidents" ON public.receiver_incidents FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_ri_updated BEFORE UPDATE ON public.receiver_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Document Categories =====
CREATE TABLE public.receiver_document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_document_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_document_categories" ON public.receiver_document_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_document_categories" ON public.receiver_document_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_document_categories" ON public.receiver_document_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_document_categories" ON public.receiver_document_categories FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rdc_updated BEFORE UPDATE ON public.receiver_document_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Documents =====
CREATE TABLE public.receiver_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  category_id uuid REFERENCES public.receiver_document_categories(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_documents" ON public.receiver_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_documents" ON public.receiver_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_documents" ON public.receiver_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_documents" ON public.receiver_documents FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rd_updated BEFORE UPDATE ON public.receiver_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Receiver Changelog =====
CREATE TABLE public.receiver_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  record_id text NOT NULL,
  title text NOT NULL,
  made_by text NOT NULL,
  for_name text,
  description text NOT NULL DEFAULT '',
  log_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_changelog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_changelog" ON public.receiver_changelog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_changelog" ON public.receiver_changelog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_changelog" ON public.receiver_changelog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_changelog" ON public.receiver_changelog FOR DELETE TO authenticated USING (true);
CREATE INDEX idx_receiver_changelog_lookup ON public.receiver_changelog(care_receiver_id, log_time DESC);

-- ===== Receiver Push Notifications =====
CREATE TABLE public.receiver_push_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  note text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_push_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_push_notifications" ON public.receiver_push_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_push_notifications" ON public.receiver_push_notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_push_notifications" ON public.receiver_push_notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_push_notifications" ON public.receiver_push_notifications FOR DELETE TO authenticated USING (true);

-- ===== Receiver Qualifications =====
CREATE TABLE public.receiver_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_receiver_id uuid NOT NULL,
  qualification text NOT NULL,
  start_date date,
  expiry_date date,
  never_expires boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'In Date',
  sub_status text NOT NULL DEFAULT 'None',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receiver_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read receiver_qualifications" ON public.receiver_qualifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert receiver_qualifications" ON public.receiver_qualifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update receiver_qualifications" ON public.receiver_qualifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete receiver_qualifications" ON public.receiver_qualifications FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_rq_updated BEFORE UPDATE ON public.receiver_qualifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== Storage bucket for receiver documents =====
INSERT INTO storage.buckets (id, name, public) VALUES ('service-user-documents', 'service-user-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth read service-user-documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'service-user-documents');
CREATE POLICY "Auth insert service-user-documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-user-documents');
CREATE POLICY "Auth update service-user-documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'service-user-documents');
CREATE POLICY "Auth delete service-user-documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'service-user-documents');
