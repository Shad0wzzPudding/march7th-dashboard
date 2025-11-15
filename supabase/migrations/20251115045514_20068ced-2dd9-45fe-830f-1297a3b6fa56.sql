-- Add authorization checks to SECURITY DEFINER functions to prevent privilege escalation

-- Update ensure_daily_tasks_for_today to verify caller authorization
CREATE OR REPLACE FUNCTION public.ensure_daily_tasks_for_today(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- SECURITY: Verify the caller is authorized to access this user's data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users data';
  END IF;

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

-- Note: reset_daily_tasks_for_new_day() is intentionally left as-is
-- It's designed to be called by scheduled cron jobs (not by users)
-- and operates on all users' data as part of system maintenance.
-- Access to this function should be restricted via application logic,
-- not at the database level, since it needs to run with elevated privileges
-- for legitimate system operations.