ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence_unit text,
  ADD COLUMN IF NOT EXISTS recurrence_interval integer NOT NULL DEFAULT 1;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_recurrence_unit_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_recurrence_unit_check
  CHECK (recurrence_unit IS NULL OR recurrence_unit IN ('day','week','month','year'));