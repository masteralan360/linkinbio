import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseConfigError } from "@/components/SupabaseConfigError";
import Navbar from "@/components/Navbar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PublicProfile from "@/pages/PublicProfile";
import Home from "@/pages/Home";

function App() {
    const { isLoading } = useAuth();

    // Show configuration error if Supabase is not configured
    if (!isSupabaseConfigured) {
        return <SupabaseConfigError />;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20" />
                    <div className="h-4 w-32 rounded bg-muted" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/login" component={Login} />
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/profile/:userId" component={PublicProfile} />
                    <Route>
                        <div className="text-center py-20">
                            <h1 className="text-4xl font-bold mb-4">404</h1>
                            <p className="text-muted-foreground">Page not found</p>
                        </div>
                    </Route>
                </Switch>
            </main>
            <Toaster />
        </div>
    );
}

export default App;
