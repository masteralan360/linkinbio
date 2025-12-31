import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Create client with fallback values to prevent crashes
// The app will show an error message if these are not set
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
    : createClient("https://placeholder.supabase.co", "placeholder-key", {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Database types
export interface Profile {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    created_at: string;
    updated_at: string;
}

export interface Link {
    id: string;
    user_id: string;
    title: string;
    url: string;
    position: number;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}


