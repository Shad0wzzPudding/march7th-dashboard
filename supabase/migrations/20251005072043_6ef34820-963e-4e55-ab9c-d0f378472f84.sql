-- Remove any existing cron job to avoid duplicates
SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname = 'daily-push-notifications';

-- Recreate the cron job without hardcoded credentials
-- The edge function will validate requests internally
SELECT cron.schedule(
  'daily-push-notifications',
  '0 1 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-daily-notifications',
        headers:='{"Content-Type": "application/json", "X-Cron-Secret": "cron-trigger-secret"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);