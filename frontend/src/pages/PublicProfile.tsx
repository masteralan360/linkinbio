import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { profileApi } from "@/lib/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Link2, AlertCircle } from "lucide-react";

export default function PublicProfile() {
    const [, params] = useRoute("/profile/:userId");
    const userId = params?.userId;

    const {
        data: profile,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["profile", userId],
        queryFn: () => profileApi.get(userId!),
        enabled: !!userId,
    });

    if (isLoading) {
        return (
            <div className="max-w-md mx-auto space-y-6 animate-pulse">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-muted" />
                    <div className="h-6 w-32 rounded bg-muted" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 rounded-lg bg-muted" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-md mx-auto">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
                        <p className="text-muted-foreground">
                            This profile doesn't exist or is not available.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { user, links } = profile;

    return (
        <div className="max-w-md mx-auto space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center gap-4 pt-8">
                <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full scale-150" />
                    <Avatar className="relative w-24 h-24 ring-4 ring-background shadow-xl">
                        {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                            {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <h1 className="text-2xl font-bold">{user.name || "User"}</h1>
            </div>

            {/* Links */}
            {links.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Link2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No links yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {links.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block"
                        >
                            <Card className="transition-all hover:scale-[1.02] hover:shadow-lg hover:border-primary/50">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Link2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="font-medium truncate">{link.title}</span>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="text-center pb-8">
                <p className="text-xs text-muted-foreground">
                    Powered by{" "}
                    <a href="/" className="text-primary hover:underline">
                        LinkBio
                    </a>
                </p>
            </div>
        </div>
    );
}
