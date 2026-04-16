
-- Visit 2: was 42m late, now 12m late (scheduled 09:00, in at 09:12)
UPDATE daily_visits SET
  check_in_time = (CURRENT_DATE + INTERVAL '9 hours 12 minutes')::timestamptz
WHERE id = '5d58ce2d-7ab6-4256-a954-5d05369f7fb9';

-- Visit 4: was 35m late, now 18m late (scheduled 10:00, in at 10:18)
UPDATE daily_visits SET
  check_in_time = (CURRENT_DATE + INTERVAL '10 hours 18 minutes')::timestamptz
WHERE id = '4b052dab-377b-4553-91b1-6a853f7e6180';
