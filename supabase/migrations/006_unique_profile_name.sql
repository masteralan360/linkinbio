-- Add unique constraint to profiles.name
-- First, handle any duplicates if they exist (optional, but good practice before adding constraint)
-- For now we assume no duplicates or let the constraint fail if there are

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_name_key UNIQUE (name);
