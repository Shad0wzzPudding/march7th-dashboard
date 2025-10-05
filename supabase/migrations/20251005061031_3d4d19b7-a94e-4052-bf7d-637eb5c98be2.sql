-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily notifications at 08:00 Thai time (01:00 UTC)
SELECT cron.schedule(
  'daily-push-notifications',
  '0 1 * * *', -- 01:00 UTC = 08:00 Thai time
  $$
  SELECT
    net.http_post(
        url:='https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-daily-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybHlwdnRsbGVmY2xud2pheXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTQ4NTMsImV4cCI6MjA2OTI5MDg1M30.EAI5O2d6DkMcmVmmRymWuQoo-I-DkeN-woVLCSBCoAM"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);