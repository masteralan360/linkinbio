import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link2, ArrowRight, Sparkles, UserPlus } from "lucide-react";

export default function Home() {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center px-4">
            {/* Hero Section */}
            <div className="relative mb-8">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full scale-150" />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl">
                    <Link2 className="w-12 h-12 text-primary-foreground" />
                </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    One Link for
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                    All Your Links
                </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mb-8">
                Create your personal link hub. Share all your important links in one beautiful,
                minimal page.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                    <>
                        <Link href="/dashboard">
                            <Button size="lg" className="gap-2 group">
                                Go to Dashboard
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        {user && (
                            <Link href={`/profile/${user.username || user.id}`}>
                                <Button size="lg" variant="outline" className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    View My Page
                                </Button>
                            </Link>
                        )}
                    </>
                ) : (
                    <>
                        <Link href="/signup">
                            <Button size="lg" className="gap-2 group">
                                <UserPlus className="w-4 h-4" />
                                Sign Up
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="gap-2 group">
                                Sign In
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </>
                )}
            </div>


            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-3xl">
                <div className="p-6 rounded-xl border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Link2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Unlimited Links</h3>
                    <p className="text-sm text-muted-foreground">
                        Add as many links as you need to your personal page.
                    </p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Clean Design</h3>
                    <p className="text-sm text-muted-foreground">
                        Beautiful, minimal design that puts your links front and center.
                    </p>
                </div>

                <div className="p-6 rounded-xl border bg-card">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <ArrowRight className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Easy to Use</h3>
                    <p className="text-sm text-muted-foreground">
                        Drag and drop to reorder. Toggle visibility with one click.
                    </p>
                </div>
            </div>
        </div>
    );
}
