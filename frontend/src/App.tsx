import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseConfigError } from "@/components/SupabaseConfigError";
import Navbar from "@/components/Navbar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PublicProfile from "@/pages/PublicProfile";
import Home from "@/pages/Home";

function AppContent() {
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

function App() {
    // Show configuration error if Supabase is not configured
    if (!isSupabaseConfigured) {
        return <SupabaseConfigError />;
    }

    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
