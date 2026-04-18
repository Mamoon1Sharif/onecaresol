-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('caregiver-documents', 'caregiver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (authenticated users full access for now)
CREATE POLICY "Auth read caregiver-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'caregiver-documents');

CREATE POLICY "Auth insert caregiver-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'caregiver-documents');

CREATE POLICY "Auth update caregiver-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'caregiver-documents');

CREATE POLICY "Auth delete caregiver-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'caregiver-documents');

-- Categories table
CREATE TABLE public.caregiver_document_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_document_categories" ON public.caregiver_document_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_document_categories" ON public.caregiver_document_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_document_categories" ON public.caregiver_document_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_document_categories" ON public.caregiver_document_categories FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_document_categories_updated_at
BEFORE UPDATE ON public.caregiver_document_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Documents table
CREATE TABLE public.caregiver_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  service_user_id UUID REFERENCES public.care_receivers(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  tags TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.caregiver_document_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.caregiver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read caregiver_documents" ON public.caregiver_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert caregiver_documents" ON public.caregiver_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update caregiver_documents" ON public.caregiver_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete caregiver_documents" ON public.caregiver_documents FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_caregiver_documents_updated_at
BEFORE UPDATE ON public.caregiver_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_caregiver_documents_care_giver_id ON public.caregiver_documents(care_giver_id);
CREATE INDEX idx_caregiver_documents_category_id ON public.caregiver_documents(category_id);