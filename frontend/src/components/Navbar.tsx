import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Link2, LayoutDashboard, Settings } from "lucide-react";

export default function Navbar() {
    const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

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
                            <div className="flex items-center gap-3 pl-2 border-l">
                                <Avatar className="h-9 w-9 border shadow-sm">
                                    {user.image ? (
                                        <AvatarImage src={user.image} alt={user.name || ""} className="object-cover" />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-sm font-semibold leading-none">
                                        {user.name || "User"}
                                    </span>
                                    {user.username && (
                                        <span className="text-xs text-muted-foreground leading-tight">
                                            @{user.username}
                                        </span>
                                    )}
                                </div>
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
