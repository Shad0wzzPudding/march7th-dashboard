-- Function to reset daily tasks completion status for a new day
CREATE OR REPLACE FUNCTION public.reset_daily_tasks_for_new_day()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update all daily tasks to be uncompleted for the current date
  -- This creates new entries for today if tasks existed for previous days
  INSERT INTO public.daily_tasks (user_id, title, description, deadline, is_completed, task_date)
  SELECT 
    user_id,
    title,
    description,
    deadline,
    false as is_completed,
    CURRENT_DATE as task_date
  FROM public.daily_tasks dt1
  WHERE dt1.task_date = (
    SELECT MAX(task_date) 
    FROM public.daily_tasks dt2 
    WHERE dt2.user_id = dt1.user_id
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM public.daily_tasks dt3 
    WHERE dt3.user_id = dt1.user_id 
    AND dt3.task_date = CURRENT_DATE
    AND dt3.title = dt1.title
  )
  AND dt1.task_date < CURRENT_DATE;
  
  -- For existing tasks on current date, reset them to uncompleted
  UPDATE public.daily_tasks 
  SET is_completed = false, updated_at = now()
  WHERE task_date = CURRENT_DATE 
  AND is_completed = true;
END;
$$;

-- Function to automatically copy and reset daily tasks when user accesses the app
CREATE OR REPLACE FUNCTION public.ensure_daily_tasks_for_today(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Copy tasks from the most recent day to today if no tasks exist for today
  INSERT INTO public.daily_tasks (user_id, title, description, deadline, is_completed, task_date)
  SELECT 
    p_user_id,
    title,
    description,
    deadline,
    false as is_completed,
    CURRENT_DATE as task_date
  FROM public.daily_tasks dt1
  WHERE dt1.user_id = p_user_id
  AND dt1.task_date = (
    SELECT MAX(task_date) 
    FROM public.daily_tasks dt2 
    WHERE dt2.user_id = p_user_id
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM public.daily_tasks dt3 
    WHERE dt3.user_id = p_user_id 
    AND dt3.task_date = CURRENT_DATE
    AND dt3.title = dt1.title
  )
  AND dt1.task_date < CURRENT_DATE;
END;
$$;