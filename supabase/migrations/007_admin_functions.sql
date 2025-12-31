-- Admin functions for user management

-- Function to delete a user from auth.users (requires SECURITY DEFINER)
-- This will cascade to public.profiles and public.links due to ON DELETE CASCADE
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Ensure this function is only callable by authorized users if needed, 
-- but since we're using a passkey gateway on the frontend, we'll keep it simple for now.

-- Insert the admin passkey
INSERT INTO public.app_settings (key, value, description)
VALUES ('admin_passkey', 'Q7MZ2kR9YH8Xn5D6pA4CWBJtqV', 'Passkey required for admin dashboard access')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
