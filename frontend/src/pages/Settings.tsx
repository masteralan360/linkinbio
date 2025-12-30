import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { settingsApi, profileApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, ShieldAlert, ArrowLeft, Loader2, Save, Trash2, CheckCircle } from "lucide-react";

export default function Settings() {
    const [, setLocation] = useLocation();
    const { user, isAuthenticated, isLoading: authLoading, logout, refreshProfile } = useAuth();
    const { toast } = useToast();

    // Data Loading
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [originalUsername, setOriginalUsername] = useState("");

    // Form States
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    // Password Form
    const [currentPassword, setCurrentPassword] = useState(""); // Note: Supabase doesn't strictly verify current password for updates unless we use reauth flow, but we can just update 'password'
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    // Loading States
    const [savingUsername, setSavingUsername] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    // Validation Errors
    const [usernameError, setUsernameError] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                setEmail(user.email || "");
                try {
                    const profile = await profileApi.get(user.id);
                    if (profile.user.username) {
                        setUsername(profile.user.username);
                        setOriginalUsername(profile.user.username);
                    }
                } catch (error) {
                    console.error("Failed to load profile settings", error);
                } finally {
                    setLoadingProfile(false);
                }
            }
        };

        if (isAuthenticated && !authLoading) {
            loadData();
        } else if (!authLoading && !isAuthenticated) {
            setLocation("/login");
        }
    }, [user, isAuthenticated, authLoading, setLocation]);

    // Format helpers
    const isValidUsername = (u: string) => /^[a-z][a-z0-9-]{2,19}$/.test(u);

    // Handlers
    const handleUpdateUsername = async () => {
        setUsernameError(null);
        if (!isValidUsername(username)) {
            setUsernameError("Username must be 3-20 chars, lowercase, numbers, hyphens, start with letter.");
            return;
        }

        setSavingUsername(true);
        try {
            await settingsApi.updateUsername(username);
            await refreshProfile();
            setOriginalUsername(username);
            toast({ title: "Success", description: "Username updated successfully." });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update username"
            });
        } finally {
            setSavingUsername(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!email.includes("@")) {
            toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email." });
            return;
        }
        setSavingEmail(true);
        try {
            await settingsApi.updateEmail(email);
            await refreshProfile();
            toast({ title: "Check your email", description: "A confirmation link has been sent to your new address." });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update email"
            });
        } finally {
            setSavingEmail(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
            return;
        }

        setSavingPassword(true);
        try {
            await settingsApi.updatePassword(newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            toast({ title: "Success", description: "Password updated successfully." });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update password"
            });
        } finally {
            setSavingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            await settingsApi.deleteAccount();
            setLocation("/");
            toast({ title: "Account Deleted", description: "Your account has been permanently deleted." });
        } catch (error) {
            setDeletingAccount(false);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete account"
            });
        }
    };

    if (authLoading || loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="container max-w-2xl mx-auto py-10 px-4 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Account Settings</h1>
                        <p className="text-muted-foreground">Manage your account information and security.</p>
                    </div>
                </div>

                {/* Username Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Username
                        </CardTitle>
                        <CardDescription>
                            Choose a unique username for your profile.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                    placeholder="Enter username"
                                    maxLength={20}
                                />
                                <Button onClick={handleUpdateUsername} disabled={savingUsername || username === originalUsername}>
                                    {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                </Button>
                            </div>
                            {usernameError && <p className="text-sm text-destructive">{usernameError}</p>}
                            <p className="text-xs text-muted-foreground">
                                Your username is used in your profile URL: iraqlinked.vercel.app/profile/{username || 'username'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Email Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-green-500" />
                            Email Address
                        </CardTitle>
                        <CardDescription>
                            Update the email address associated with your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email address"
                                />
                                <Button
                                    onClick={handleUpdateEmail}
                                    disabled={savingEmail || email === user?.email}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Password Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-purple-500" />
                            Password
                        </CardTitle>
                        <CardDescription>
                            Keep your account secure by changing your password regularly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password (optional depending on provider)</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-1 text-muted-foreground">
                            <p className="font-medium text-foreground">Password requirements:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>At least 6 characters</li>
                                <li>Mix of uppercase and lowercase letters</li>
                                <li>At least one number or symbol</li>
                            </ul>
                        </div>
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={handleUpdatePassword}
                            disabled={savingPassword || !newPassword}
                        >
                            {savingPassword ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Change Password
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="w-5 h-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Irreversible and destructive actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    Delete Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete your account, public profile, and all your links.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { }}>Cancel</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteAccount}
                                        disabled={deletingAccount}
                                    >
                                        {deletingAccount ? "Deleting..." : "Yes, Delete My Account"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
