ALTER TABLE public.care_givers
  ADD COLUMN next_of_kin_relationship text,
  ADD COLUMN next_of_kin_email text,
  ADD COLUMN next_of_kin_secondary_phone text,
  ADD COLUMN next_of_kin_notes text;