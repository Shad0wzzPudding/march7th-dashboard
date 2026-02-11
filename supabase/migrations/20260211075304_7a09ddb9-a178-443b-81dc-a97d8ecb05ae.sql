
-- Add columns to store item_id and previous data snapshot for undo functionality
ALTER TABLE public.activity_log ADD COLUMN item_id uuid;
ALTER TABLE public.activity_log ADD COLUMN previous_data jsonb;

-- Add DELETE policy so users can remove their own activity log entries
CREATE POLICY "Users can delete their own activity log entries"
ON public.activity_log
FOR DELETE
USING (auth.uid() = user_id);

-- Update the log_activity function to capture item_id and previous state
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action_type, item_type, item_title, item_id, previous_data)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.title, OLD.title),
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb
      ELSE NULL
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
