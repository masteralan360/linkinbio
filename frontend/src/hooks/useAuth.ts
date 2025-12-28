import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

export function useAuth() {
    const [, setLocation] = useLocation();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        // If Supabase is not configured, skip auth initialization
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        }).catch((error) => {
            console.error("Error getting session:", error);
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                await loadUserProfile(session.user.id);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadUserProfile = async (userId: string) => {
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, name, email, image")
                .eq("id", userId)
                .single();

            if (error) throw error;

            if (data) {
                setUser({
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    image: data.image,
                });
            }
        } catch (error) {
            console.error("Error loading user profile:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        if (!isSupabaseConfigured) {
            throw new Error("Supabase is not configured. Please set environment variables.");
        }

        setIsLoggingIn(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Google login error:", error);
            setIsLoggingIn(false);
            throw error;
        }
    };

    const loginWithGithub = async () => {
        if (!isSupabaseConfigured) {
            throw new Error("Supabase is not configured. Please set environment variables.");
        }

        setIsLoggingIn(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "github",
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("GitHub login error:", error);
            setIsLoggingIn(false);
            throw error;
        }
    };

    const loginWithCredentials = async (email: string, password: string) => {
        setIsLoggingIn(true);
        try {
            // Note: Supabase doesn't support email/password auth by default
            // This would need to be set up in Supabase dashboard
            // For now, we'll throw an error
            throw new Error("Email/password authentication not configured. Please use Google or GitHub.");
        } catch (error) {
            setIsLoggingIn(false);
            throw error;
        }
    };

    const logout = async () => {
        setIsLoggingOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setLocation("/");
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        } finally {
            setIsLoggingOut(false);
        }
    };

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        isLoggingIn,
        isLoggingOut,
        loginWithGoogle,
        loginWithGithub,
        loginWithCredentials,
        logout,
    };
}


