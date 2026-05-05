-- Tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ec4899',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags"
ON public.tags
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add tag_ids array to existing tables
ALTER TABLE public.interests ADD COLUMN tag_ids UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE public.tasks ADD COLUMN tag_ids UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN tag_ids UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_interests_tag_ids ON public.interests USING GIN(tag_ids);
CREATE INDEX idx_tasks_tag_ids ON public.tasks USING GIN(tag_ids);
CREATE INDEX idx_events_tag_ids ON public.events USING GIN(tag_ids);