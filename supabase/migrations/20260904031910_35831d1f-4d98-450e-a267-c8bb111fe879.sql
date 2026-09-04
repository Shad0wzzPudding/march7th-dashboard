CREATE TABLE public.line_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  link_code text NOT NULL UNIQUE,
  line_user_id text UNIQUE,
  display_name text,
  is_enabled boolean NOT NULL DEFAULT true,
  linked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.line_links TO authenticated;
GRANT ALL ON public.line_links TO service_role;

ALTER TABLE public.line_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own line link"
ON public.line_links FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_line_links_updated_at
BEFORE UPDATE ON public.line_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();