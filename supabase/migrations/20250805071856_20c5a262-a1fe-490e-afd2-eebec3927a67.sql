-- Add date field to daily_tasks to track which day each task belongs to
ALTER TABLE public.daily_tasks 
ADD COLUMN task_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for better performance when querying by date
CREATE INDEX idx_daily_tasks_date ON public.daily_tasks (task_date);

-- Update existing daily tasks to have today's date
UPDATE public.daily_tasks 
SET task_date = CURRENT_DATE 
WHERE task_date IS NULL;