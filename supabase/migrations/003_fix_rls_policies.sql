-- Migration: Fix RLS policies that cause "Database error querying schema" on login
-- The issue is caused by conflicting SELECT policies on the profiles table

-- Drop existing conflicting SELECT policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read public profiles" ON public.profiles;

-- Create a single unified SELECT policy that allows all reads
-- This is needed for:
-- 1. Public profile pages (anyone can view)
-- 2. Authenticated users viewing their own profile
-- 3. Supabase Auth to query user data during authentication
CREATE POLICY "Allow all profile reads"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Ensure INSERT policy exists for the handle_new_user trigger
-- The trigger uses SECURITY DEFINER, but we still need a policy
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Also ensure profiles table has the correct structure
-- If admin user exists in auth.users but not in profiles, we can't auto-fix here
-- The handle_new_user trigger should have created it, but if it failed,
-- a manual insert through Supabase Dashboard is needed
