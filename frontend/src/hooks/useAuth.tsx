import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { settingsApi } from "@/lib/api";

interface AuthUser {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    username: string | null;
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
    refreshProfile: () => Promise<void>;
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

    // Helper to fetch user profile data
    const fetchUserProfile = async (userId: string, email: string) => {
        try {
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("name, image, username")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching profile in useAuth:", error);
                return {
                    id: userId,
                    email,
                    name: 'User',
                    image: null,
                    username: null,
                };
            }

            return {
                id: userId,
                email,
                name: profile?.name || 'User',
                image: profile?.image || null,
                username: profile?.username || null,
            };
        } catch (err) {
            console.error("Unexpected error fetching profile:", err);
            return { id: userId, email, name: 'User', image: null, username: null };
        }
    };

    const refreshProfile = async () => {
        if (!user) return;
        const profileData = await fetchUserProfile(user.id, user.email);
        if (mountedRef.current) {
            setUser(profileData);
        }
    };

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
                    const profileData = await fetchUserProfile(session.user.id, session.user.email || '');
                    if (mountedRef.current) {
                        setUser(profileData);
                        setIsLoading(false);
                    }
                } else if (mountedRef.current) {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error initAuth:", error);
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
                const profileData = await fetchUserProfile(session.user.id, session.user.email || '');
                if (mountedRef.current) {
                    setUser(profileData);
                }
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
                refreshProfile();
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
                const profileData = await fetchUserProfile(data.user.id, data.user.email || '');
                if (mountedRef.current) {
                    setUser(profileData);
                }
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
        refreshProfile,
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
