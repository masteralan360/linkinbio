import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, image")
        .eq("id", session.user.id)
        .single();

      setUser({
        id: session.user.id,
        email: session.user.email || "",
        name: profile?.name ?? "User",
        image: profile?.image ?? null,
      });
    } catch (err) {
      console.error("refreshUser failed", err);
      setUser(null);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let resolved = false;

    const init = async () => {
      await refreshUser();
      if (!resolved) {
        resolved = true;
        setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          refreshUser();
        } else {
          setUser(null);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}