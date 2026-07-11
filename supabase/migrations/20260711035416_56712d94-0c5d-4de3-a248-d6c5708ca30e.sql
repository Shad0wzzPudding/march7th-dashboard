
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.interests ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
