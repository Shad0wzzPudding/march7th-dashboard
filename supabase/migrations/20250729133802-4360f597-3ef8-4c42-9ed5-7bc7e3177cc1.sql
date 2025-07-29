-- Create tables for the March 7th Dashboard

-- Interests table
CREATE TABLE public.interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity log table for recent changes
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  item_type TEXT NOT NULL, -- 'interest', 'task', 'event'
  item_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies for interests
CREATE POLICY "Users can manage their own interests" 
ON public.interests 
FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for tasks
CREATE POLICY "Users can manage their own tasks" 
ON public.tasks 
FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for events
CREATE POLICY "Users can manage their own events" 
ON public.events 
FOR ALL 
USING (auth.uid() = user_id);

-- Create policies for activity log
CREATE POLICY "Users can view their own activity log" 
ON public.activity_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity log entries" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_interests_updated_at
  BEFORE UPDATE ON public.interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action_type, item_type, item_title)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.title, OLD.title)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity logging
CREATE TRIGGER log_interests_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.interests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_tasks_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_events_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();