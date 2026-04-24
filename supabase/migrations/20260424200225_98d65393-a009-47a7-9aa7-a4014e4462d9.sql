-- Add avatar_url columns
ALTER TABLE public.care_givers ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.care_receivers ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create public avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-avatars (public read, authenticated write)
CREATE POLICY "Public can view profile avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated can upload profile avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated can update profile avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-avatars');

CREATE POLICY "Authenticated can delete profile avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-avatars');