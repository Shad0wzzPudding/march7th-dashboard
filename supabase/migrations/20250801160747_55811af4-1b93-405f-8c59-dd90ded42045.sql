-- Add deadline column to events table
ALTER TABLE public.events 
ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;