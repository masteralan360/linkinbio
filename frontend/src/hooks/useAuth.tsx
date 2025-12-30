import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { settingsApi } from "@/lib/api";

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isLoggingIn: boolean;
    isLoggingOut: boolean;
    isSigningUp: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithGithub: () => Promise<void>;
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    signUpWithPasskey: (email: string, password: string, passkey: string, username: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth timeout - max time to wait for auth to resolve
const AUTH_TIMEOUT_MS = 8000;
const LOGIN_TIMEOUT_MS = 15000;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [, setLocation] = useLocation();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const initRef = useRef(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        // Prevent double initialization
        if (initRef.current) return;
        initRef.current = true;
        mountedRef.current = true;

        // If Supabase is not configured, skip auth initialization
        if (!isSupabaseConfigured) {
            setIsLoading(false);
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout>;

        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
            if (mountedRef.current && isLoading) {
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
                    if (mountedRef.current) setIsLoading(false);
                    return;
                }

                if (session?.user && mountedRef.current) {
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
                        image: session.user.user_metadata?.avatar_url || null,
                    });
                    setIsLoading(false);
                } else if (mountedRef.current) {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error getting session:", error);
                if (mountedRef.current) setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mountedRef.current) return;

            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
                    image: session.user.user_metadata?.avatar_url || null,
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

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

        // Create a timeout to prevent infinite hanging
        const loginTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Login timed out. Please try again.")), LOGIN_TIMEOUT_MS);
        });

        try {
            // Race between login and timeout
            const result = await Promise.race([
                supabase.auth.signInWithPassword({ email, password }),
                loginTimeout
            ]);

            const { data, error } = result as { data: { user: any }, error: any };

            if (error) throw error;

            if (data.user) {
                setUser({
                    id: data.user.id,
                    email: data.user.email || '',
                    name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User',
                    image: data.user.user_metadata?.avatar_url || null,
                });
                setLocation("/dashboard");
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            // Always reset isLoggingIn
            setIsLoggingIn(false);
        }
    };

    const signUpWithPasskey = async (email: string, password: string, passkey: string, username: string) => {
        if (!isSupabaseConfigured) {
            throw new Error("Supabase is not configured. Please set environment variables.");
        }

        setIsSigningUp(true);

        try {
            // First validate the passkey
            const isValidPasskey = await settingsApi.validatePasskey(passkey);
            if (!isValidPasskey) {
                throw new Error("Invalid passkey. Please contact the administrator.");
            }

            // Create the user account (auto-confirm is enabled in Supabase)
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/profile-maker`,
                    data: {
                        username: username,
                    },
                },
            });

            if (error) throw error;

            if (data.user) {
                setUser({
                    id: data.user.id,
                    email: data.user.email || '',
                    name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User',
                    image: data.user.user_metadata?.avatar_url || null,
                });
                // Small delay to ensure auth state is settled before redirect
                await new Promise(resolve => setTimeout(resolve, 100));
                // Redirect to profile maker
                setLocation("/profile-maker");
            }
        } catch (error) {
            console.error("Sign up error:", error);
            throw error;
        } finally {
            setIsSigningUp(false);
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

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        isLoggingIn,
        isLoggingOut,
        isSigningUp,
        loginWithGoogle,
        loginWithGithub,
        loginWithCredentials,
        signUpWithPasskey,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
