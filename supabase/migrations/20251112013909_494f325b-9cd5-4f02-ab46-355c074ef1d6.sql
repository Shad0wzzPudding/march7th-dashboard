-- Fix RLS policy on push_subscriptions to allow inserts
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON push_subscriptions;

CREATE POLICY "Users can manage their own subscriptions"
ON push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);