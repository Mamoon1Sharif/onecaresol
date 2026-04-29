ALTER TABLE public.care_receivers
  ADD COLUMN IF NOT EXISTS approved_tasks text[] NOT NULL DEFAULT ARRAY[
    'Personal hygiene / wash',
    'Assist with dressing',
    'Prepare breakfast',
    'Prepare lunch',
    'Prepare dinner',
    'Administer medication',
    'Toileting / continence care',
    'Mobility support',
    'Light housekeeping',
    'Laundry',
    'Companionship & conversation',
    'Record vital signs',
    'Repositioning',
    'Empty / change catheter bag'
  ]::text[];