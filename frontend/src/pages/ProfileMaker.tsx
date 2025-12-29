import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Construction } from "lucide-react";

export default function ProfileMaker() {
    const [, setLocation] = useLocation();
    const { isAuthenticated, isLoading, user } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            setLocation("/login");
        }
    }, [isLoading, isAuthenticated, setLocation]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Create Your Profile</CardTitle>
                    <CardDescription>
                        Welcome! Let's set up your personal link page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Placeholder content */}
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/20">
                        <Construction className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Profile Maker Coming Soon</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            This is where you'll be able to customize your profile, add a photo,
                            and set up your personal information.
                        </p>
                        {user && (
                            <p className="text-xs text-muted-foreground mt-4">
                                Signed in as: {user.email}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
