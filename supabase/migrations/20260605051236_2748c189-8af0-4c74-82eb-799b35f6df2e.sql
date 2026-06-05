
REVOKE EXECUTE ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_daily_tasks_for_new_day() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_daily_tasks_for_today(uuid) FROM PUBLIC, anon;
-- Keep EXECUTE for authenticated on ensure_daily_tasks_for_today since the app calls it; function enforces auth.uid() = p_user_id check internally.
GRANT EXECUTE ON FUNCTION public.ensure_daily_tasks_for_today(uuid) TO authenticated;
