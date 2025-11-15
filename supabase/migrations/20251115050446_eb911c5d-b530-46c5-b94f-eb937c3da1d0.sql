-- Secure ensure_daily_tasks_for_today with authorization check
CREATE OR REPLACE FUNCTION public.ensure_daily_tasks_for_today(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization: caller must be the same as target user
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users'' data';
  END IF;

  -- Ensure today''s daily tasks exist; copy most recent day''s tasks if missing
  INSERT INTO public.daily_tasks (user_id, title, description, deadline, is_completed, task_date)
  SELECT 
    p_user_id,
    dt1.title,
    dt1.description,
    dt1.deadline,
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