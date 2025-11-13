-- Ensure a unique constraint exists on push_subscriptions.user_id for proper upsert behavior
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'push_subscriptions'
      AND n.nspname = 'public'
      AND c.conname = 'push_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END
$$;