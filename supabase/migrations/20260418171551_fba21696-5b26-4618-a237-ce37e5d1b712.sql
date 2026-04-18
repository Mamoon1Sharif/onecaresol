-- Caregiver changelog (audit log) table
CREATE TABLE public.caregiver_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_giver_id UUID NOT NULL REFERENCES public.care_givers(id) ON DELETE CASCADE,
  record_id TEXT NOT NULL,
  made_by TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  for_name TEXT,
  log_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_caregiver_changelog_cg_time ON public.caregiver_changelog(care_giver_id, log_time DESC);

ALTER TABLE public.caregiver_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view changelog"
ON public.caregiver_changelog FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert changelog"
ON public.caregiver_changelog FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update changelog"
ON public.caregiver_changelog FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete changelog"
ON public.caregiver_changelog FOR DELETE TO authenticated USING (true);

-- Seed sample entries for the demo caregiver
INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '194038351', 'Emily Biggart', 'Updated Medication Rota Admin Status For Single Medication',
       'Medication administer status changed on 18/04/2026 at 11:41 by Emily Biggart', NULL, now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'medication signed for by staff member',
       'Medication result received for call 145958146 - Medication: Dermol Cream Admin Type: Not Required on 18/04/2026 at 11:41 by Emily Biggart', NULL, now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958083', 'Emily Biggart', 'Note Added By Staff Member',
       'Note added - Cancelled Call: Just wanted us to get jeff to get her some meds on 18/04/2026 at 11:41 by Emily Biggart',
       'Joan Marchant', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'staff member clocked out of shift',
       'clocked out of call 145958146 at 21:14 on 18/04/2026 at 11:41 by Emily Biggart',
       'Emily Biggart', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'staff member clocked into shift',
       'clocked in to call 145958146 at 20:45 on 18/04/2026 at 11:41 by Emily Biggart',
       'Emily Biggart', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958083', 'Emily Biggart', 'shift status changed',
       'Door step cancellation on 18/04/2026 at 11:41 by Emily Biggart',
       'Emily Biggart', now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'Task Incomplete On Rota',
       'Task Status result 2 received for call 145958146 on 18/04/2026 at 11:41 by Emily Biggart',
       NULL, now()
FROM public.care_givers LIMIT 1;

INSERT INTO public.caregiver_changelog (care_giver_id, record_id, made_by, title, description, for_name, log_time)
SELECT id, '145958146', 'Emily Biggart', 'Note Added By Staff Member',
       'Note added - Carol okay and in living room on arrival, used the standing sling and Walker to get her onto the commode and then wheeled through into bedroom. gave her time on the toilet and she had a small bowel movement. got her dressed into pyjamas with a fresh pull-up on and old one disposed in black bin outside. Assisted Carol to get into bed from off the commode. We made her comfortable and call done with consent and Carol also had some drink throughout the call and had a chat and then all okay on leaving. on 18/04/2026 at 11:41 by Emily Biggart',
       'Carol Stevens', now()
FROM public.care_givers LIMIT 1;