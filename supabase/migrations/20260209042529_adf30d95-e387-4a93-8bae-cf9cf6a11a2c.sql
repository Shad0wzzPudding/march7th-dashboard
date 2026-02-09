-- Make deadline column nullable for tasks
ALTER TABLE public.tasks ALTER COLUMN deadline DROP NOT NULL;