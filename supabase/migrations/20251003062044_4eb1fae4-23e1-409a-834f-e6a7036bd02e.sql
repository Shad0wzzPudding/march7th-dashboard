-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule daily notifications at 08:00 UTC (8:00 AM UTC every day)
SELECT cron.schedule(
  'send-daily-notifications-job',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-daily-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybHlwdnRsbGVmY2xud2pheXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTQ4NTMsImV4cCI6MjA2OTI5MDg1M30.EAI5O2d6DkMcmVmmRymWuQoo-I-DkeN-woVLCSBCoAM"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);