import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { profileApi } from "@/lib/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Link2, AlertCircle } from "lucide-react";
import ProfilePreview from "@/components/ProfilePreview";

export default function PublicProfile() {
    const [, params] = useRoute("/profile/:username");
    const username = params?.username;

    const {
        data: profile,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["profile", username],
        queryFn: () => profileApi.getByUsername(username!),
        enabled: !!username,
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
            <div className="max-w-md mx-auto p-8">
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

    return (
        <ProfilePreview
            user={profile.user}
            links={profile.links}
            theme={profile.user.theme}
        />
    );
}
