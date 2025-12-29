-- Create app_settings table for storing configurable values like the signup passkey
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read app_settings (needed for passkey validation)
CREATE POLICY "Anyone can read app_settings" ON public.app_settings
    FOR SELECT USING (true);

-- Insert the signup passkey (adjustable by database owner)
INSERT INTO public.app_settings (key, value, description) 
VALUES ('signup_passkey', 'v9F3Kp7M2XqR8A6WZJ4nY5DCHtB', 'Passkey required for user registration')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
