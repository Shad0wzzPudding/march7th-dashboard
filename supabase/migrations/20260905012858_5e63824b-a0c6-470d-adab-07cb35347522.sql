SELECT cron.schedule(
  'line-daily-digest-8am-bangkok',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://orlypvtllefclnwjayyf.supabase.co/functions/v1/send-line-daily',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-secret','cron-trigger-secret'
    ),
    body := jsonb_build_object('trigger','cron','tz','Asia/Bangkok','invoked_at', now())
  );
  $$
);