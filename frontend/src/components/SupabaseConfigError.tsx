import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function SupabaseConfigError() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                        <CardTitle>Configuration Required</CardTitle>
                    </div>
                    <CardDescription>
                        Supabase environment variables are not configured.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Please create a <code className="px-1 py-0.5 bg-muted rounded text-xs">.env</code> file in the{" "}
                        <code className="px-1 py-0.5 bg-muted rounded text-xs">frontend/</code> directory with:
                    </p>
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs space-y-1">
                        <div>VITE_SUPABASE_URL=your-supabase-url</div>
                        <div>VITE_SUPABASE_ANON_KEY=your-supabase-anon-key</div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Get these values from your Supabase project settings:{" "}
                        <a
                            href="https://app.supabase.com/project/_/settings/api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Settings → API
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

