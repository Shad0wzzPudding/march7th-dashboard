-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily notification check at 8:00 AM every day
SELECT cron.schedule(
  'send-daily-notifications',
  '0 8 * * *', -- Run at 8:00 AM every day
  $$
  SELECT
    net.http_post(
        url:='https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-daily-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybHlwdnRsbGVmY2xud2pheXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTQ4NTMsImV4cCI6MjA2OTI5MDg1M30.EAI5O2d6DkMcmVmmRymWuQoo-I-DkeN-woVLCSBCoAM"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);