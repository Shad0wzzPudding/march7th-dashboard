-- Add start_date column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT now();