import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

// Timeout for auth operations to prevent infinite loading
const AUTH_TIMEOUT_MS = 10000;

export function useAuth() {
    const [, setLocation] = useLocation();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const initRef = useRef(false);

    useEffect(() => {
        // Prevent double initialization in StrictMode
        if (initRef.current) return;
        initRef.current = true;

        // If Supabase is not configured, skip auth initialization
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }

        let mounted = true;
        let timeoutId: ReturnType<typeof setTimeout>;

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn("Auth loading timeout - forcing completion");
                setIsLoading(false);
            }
        }, AUTH_TIMEOUT_MS);

        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Error getting session:", error);
                    if (mounted) setIsLoading(false);
                    return;
                }

                if (session?.user && mounted) {
                    await loadUserProfile(session.user.id);
                } else if (mounted) {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error getting session:", error);
                if (mounted) setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (session?.user) {
                // Only reload if user changed
                if (user?.id !== session.user.id) {
                    await loadUserProfile(session.user.id);
                }
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const loadUserProfile = async (userId: string) => {
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }

        try {
            const { data: authData, error } = await supabase.auth.getUser();

            if (error) {
                console.error("Error loading user:", error);
                setUser(null);
                setIsLoading(false);
                return;
            }

            if (authData?.user) {
                setUser({
                    id: authData.user.id,
                    email: authData.user.email || '',
                    name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || 'User',
                    image: authData.user.user_metadata?.avatar_url || null,
                });
            }
        } catch (error) {
            console.error("Error loading user:", error);
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
        if (!isSupabaseConfigured) {
            throw new Error("Supabase is not configured. Please set environment variables.");
        }

        setIsLoggingIn(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                await loadUserProfile(data.user.id);
                setLocation("/dashboard");
            }
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
