ALTER TABLE public.line_links ADD COLUMN IF NOT EXISTS reminders_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.line_reminders_sent (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  occurrence_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id, occurrence_at)
);

GRANT SELECT ON public.line_reminders_sent TO authenticated;
GRANT ALL ON public.line_reminders_sent TO service_role;

ALTER TABLE public.line_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sent reminders"
ON public.line_reminders_sent
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);