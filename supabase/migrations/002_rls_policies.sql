-- Row Level Security Policies for profiles table

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Anyone can read public profiles (for public profile pages)
CREATE POLICY "Anyone can read public profiles"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Row Level Security Policies for links table

-- Users can read their own links
CREATE POLICY "Users can read own links"
    ON public.links
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own links
CREATE POLICY "Users can insert own links"
    ON public.links
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own links
CREATE POLICY "Users can update own links"
    ON public.links
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete own links"
    ON public.links
    FOR DELETE
    USING (auth.uid() = user_id);

-- Anyone can read public links (for public profile pages)
CREATE POLICY "Anyone can read public links"
    ON public.links
    FOR SELECT
    USING (is_public = true);


