import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, AlertCircle, Loader2, KeyRound } from "lucide-react";

export default function SignUp() {
    const [, setLocation] = useLocation();
    const { isAuthenticated, signUpWithPasskey, isSigningUp } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passkey, setPasskey] = useState("");
    const [signUpError, setSignUpError] = useState<string | null>(null);

    useEffect(() => {
        // Only redirect if already authenticated AND not currently signing up
        // The signUpWithPasskey function handles redirect to profile-maker
        if (isAuthenticated && !isSigningUp) {
            setLocation("/profile-maker");
        }
    }, [isAuthenticated, isSigningUp, setLocation]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignUpError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setSignUpError("Passwords do not match");
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setSignUpError("Password must be at least 6 characters");
            return;
        }

        try {
            await signUpWithPasskey(email, password, passkey);
        } catch (err) {
            setSignUpError(err instanceof Error ? err.message : "Sign up failed");
        }
    };

    return (
        <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <Link2 className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                    <CardDescription>
                        Sign up to create your personal link page
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {signUpError && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            <p className="text-sm text-destructive">{signUpError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passkey" className="flex items-center gap-2">
                                <KeyRound className="w-4 h-4" />
                                Passkey
                            </Label>
                            <Input
                                id="passkey"
                                type="password"
                                placeholder="Enter your registration passkey"
                                value={passkey}
                                onChange={(e) => setPasskey(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Contact the administrator to get your passkey
                            </p>
                        </div>
                        <Button type="submit" className="w-full h-12" disabled={isSigningUp}>
                            {isSigningUp ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
                        </div>
                    </div>

                    <Link href="/login">
                        <Button variant="outline" className="w-full h-12">
                            Sign In
                        </Button>
                    </Link>

                    <p className="text-xs text-center text-muted-foreground pt-2">
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
