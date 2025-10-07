-- Enable required extensions for scheduling and HTTP requests
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Unschedule existing job if present to avoid duplicates
DO $$
BEGIN
  PERFORM cron.unschedule('daily-8am-asia-bangkok');
EXCEPTION WHEN others THEN
  -- ignore if it doesn't exist
  NULL;
END;
$$;

-- Schedule daily run at 08:00 Asia/Bangkok (UTC+7) -> 01:00 UTC
select
  cron.schedule(
    'daily-8am-asia-bangkok',
    '0 1 * * *',
    $$
    select net.http_post(
      url := 'https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-daily-notifications',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'x-cron-secret','cron-trigger-secret'
      ),
      body := jsonb_build_object('trigger','cron','tz','Asia/Bangkok','invoked_at', now())
    );
    $$
  );