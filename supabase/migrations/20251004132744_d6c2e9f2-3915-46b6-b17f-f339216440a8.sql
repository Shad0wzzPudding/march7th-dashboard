-- Ensure required extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Unschedule existing job safely by name if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-notifications-job') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'send-daily-notifications-job';
  END IF;
END
$$;

-- Re-schedule daily notifications at 08:00 UTC without embedding tokens
SELECT cron.schedule(
  'send-daily-notifications-job',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-daily-notifications',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:=jsonb_build_object('time', now())
    );
  $$
);
