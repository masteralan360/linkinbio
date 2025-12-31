import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Link2, LayoutDashboard, Settings } from "lucide-react";

export default function Navbar() {
    const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            if (!user) {
                if (isMounted) {
                    setDisplayName(null);
                    setAvatarUrl(null);
                }
                return;
            }

            try {
                const profile = await profileApi.get(user.id);
                if (isMounted) {
                    setDisplayName(profile.user.name ?? null);
                    setAvatarUrl(profile.user.image ?? null);
                }
            } catch (err) {
                console.error("Failed to load profile for navbar:", err);
                if (isMounted) {
                    setDisplayName(null);
                    setAvatarUrl(null);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/">
                    <a className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <Link2 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            IraqLinked
                        </span>
                    </a>
                </Link>

                <div className="flex items-center gap-4">
                    {isAuthenticated && user ? (
                        <>
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/settings">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || ""} />}
                                    <AvatarFallback>
                                        {displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium hidden sm:block">
                                    {displayName ?? null}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                disabled={isLoggingOut}
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </>
                    ) : (
                        <Link href="/login">
                            <Button size="sm">Sign In</Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
