ALTER TABLE public.daily_visits 
ADD COLUMN IF NOT EXISTS check_in_lat double precision,
ADD COLUMN IF NOT EXISTS check_in_lng double precision;