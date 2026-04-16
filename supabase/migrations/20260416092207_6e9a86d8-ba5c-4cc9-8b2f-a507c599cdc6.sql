
-- Update visit 1: on time (scheduled 08:00, checked in 07:55, out 14:05)
UPDATE daily_visits SET start_hour = 8, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '7 hours 55 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '14 hours 5 minutes')::timestamptz
WHERE id = '3a93d5ca-6d08-4454-821a-bac241cb0928';

-- Visit 2: late (scheduled 09:00, checked in 09:42, out 15:10)
UPDATE daily_visits SET start_hour = 9, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '9 hours 42 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '15 hours 10 minutes')::timestamptz
WHERE id = '5d58ce2d-7ab6-4256-a954-5d05369f7fb9';

-- Visit 3: on time (scheduled 07:00, checked in 06:58, out 13:02)
UPDATE daily_visits SET start_hour = 7, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '6 hours 58 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '13 hours 2 minutes')::timestamptz
WHERE id = 'c7b3b208-8a23-4cd1-944a-b2702de0d1ef';

-- Visit 4: late (scheduled 10:00, checked in 10:35, out 16:20)
UPDATE daily_visits SET start_hour = 10, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '10 hours 35 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '16 hours 20 minutes')::timestamptz
WHERE id = '4b052dab-377b-4553-91b1-6a853f7e6180';

-- Visit 5: on time (scheduled 08:00, checked in 08:02, out 14:00)
UPDATE daily_visits SET start_hour = 8, duration = 6,
  check_in_time = (CURRENT_DATE + INTERVAL '8 hours 2 minutes')::timestamptz,
  check_out_time = (CURRENT_DATE + INTERVAL '14 hours')::timestamptz
WHERE id = 'e1e4ff5c-7967-475a-916c-01afe39b82c2';

-- Add shift notes
INSERT INTO shift_notes (daily_visit_id, note, author) VALUES
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Client was in good spirits today. Completed morning routine without issues.', 'Anna Garcia'),
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Administered medication at 10am as prescribed.', 'Anna Garcia'),
  ('5d58ce2d-7ab6-4256-a954-5d05369f7fb9', 'Arrived late due to traffic. Client was understanding.', 'James Smith'),
  ('c7b3b208-8a23-4cd1-944a-b2702de0d1ef', 'Client had a good day. Went for a short walk in the garden.', 'Mamoon Sharif'),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Client was feeling unwell, monitored closely. Contacted GP.', 'Sarah Johnson'),
  ('e1e4ff5c-7967-475a-916c-01afe39b82c2', 'All tasks completed. Client in stable condition.', 'Mike Patel');

-- Add shift tasks
INSERT INTO shift_tasks (daily_visit_id, title, is_completed, completed_by, completed_at) VALUES
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Morning medication', true, 'Anna Garcia', now()),
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Prepare breakfast', true, 'Anna Garcia', now()),
  ('3a93d5ca-6d08-4454-821a-bac241cb0928', 'Personal hygiene assistance', true, 'Anna Garcia', now()),
  ('5d58ce2d-7ab6-4256-a954-5d05369f7fb9', 'Lunch preparation', true, 'James Smith', now()),
  ('5d58ce2d-7ab6-4256-a954-5d05369f7fb9', 'Administer afternoon meds', false, null, null),
  ('c7b3b208-8a23-4cd1-944a-b2702de0d1ef', 'Morning walk', true, 'Mamoon Sharif', now()),
  ('c7b3b208-8a23-4cd1-944a-b2702de0d1ef', 'Prepare lunch', true, 'Mamoon Sharif', now()),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Health check', true, 'Sarah Johnson', now()),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Contact GP', true, 'Sarah Johnson', now()),
  ('4b052dab-377b-4553-91b1-6a853f7e6180', 'Evening medication', false, null, null),
  ('e1e4ff5c-7967-475a-916c-01afe39b82c2', 'Morning routine', true, 'Mike Patel', now()),
  ('e1e4ff5c-7967-475a-916c-01afe39b82c2', 'Prepare meals', true, 'Mike Patel', now());
