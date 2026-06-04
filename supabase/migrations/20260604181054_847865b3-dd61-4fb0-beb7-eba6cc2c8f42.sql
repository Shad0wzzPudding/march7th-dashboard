ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS tasks_user_sort_idx ON public.tasks (user_id, sort_order);
CREATE INDEX IF NOT EXISTS events_user_sort_idx ON public.events (user_id, sort_order);