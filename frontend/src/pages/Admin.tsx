import { useState, useEffect } from "react";
import { settingsApi, adminApi, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ShieldCheck, Trash2, User, Mail, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Admin() {
    const [passkey, setPasskey] = useState("");
    const [isValidated, setIsValidated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<Profile[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const { toast } = useToast();

    // Check session storage on mount and handle timeout
    useEffect(() => {
        const checkAuth = () => {
            const expiresAt = sessionStorage.getItem("admin_expires_at");
            if (expiresAt) {
                const remaining = Math.max(0, Math.floor((parseInt(expiresAt) - Date.now()) / 1000));
                if (remaining > 0) {
                    setIsValidated(true);
                    setTimeLeft(remaining);
                } else {
                    setIsValidated(false);
                    sessionStorage.removeItem("admin_expires_at");
                }
            }
        };

        checkAuth();
        const interval = setInterval(checkAuth, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch users when validated
    useEffect(() => {
        if (isValidated) {
            fetchUsers();
        }
    }, [isValidated]);

    const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
            const data = await adminApi.listUsers();
            setUsers(data);
        } catch (error) {
            toast({
                title: "Error fetching users",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        } finally {
            setIsFetchingUsers(false);
        }
    };

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passkey) return;

        setIsLoading(true);
        try {
            const isValid = await settingsApi.validateAdminPasskey(passkey);
            if (isValid) {
                const expiresAt = Date.now() + 60 * 1000;
                sessionStorage.setItem("admin_expires_at", expiresAt.toString());
                setIsValidated(true);
                setTimeLeft(60);
                toast({
                    title: "Access Granted",
                    description: "You have 60 seconds of admin access.",
                });
            } else {
                toast({
                    title: "Invalid Passkey",
                    description: "The passkey you entered is incorrect.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An error occurred while validating the passkey.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await adminApi.deleteUser(userToDelete.id);
            setUsers(users.filter(u => u.id !== userToDelete.id));
            toast({
                title: "User deleted",
                description: `Account for ${userToDelete.email} has been removed.`,
            });
        } catch (error) {
            toast({
                title: "Error deleting user",
                description: error instanceof Error ? error.message : "An error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    if (!isValidated) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Admin Access</CardTitle>
                        <CardDescription>
                            Please enter the admin passkey to continue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleValidate} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Enter passkey"
                                    value={passkey}
                                    onChange={(e) => setPasskey(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Validating..." : "Submit"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground">
                            Manage users and system settings. Session expires in {timeLeft}s.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                        sessionStorage.removeItem("admin_expires_at");
                        setIsValidated(false);
                    }}>
                        Logout
                    </Button>
                    <Button variant="outline" onClick={fetchUsers} disabled={isFetchingUsers}>
                        {isFetchingUsers ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Refresh Users
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>
                        A total of {users.length} users are currently registered.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetchingUsers && users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Username</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={user.image || ""} alt={user.name || ""} />
                                                        <AvatarFallback>
                                                            <User className="w-4 h-4" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name || "Anonymous"}</span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                    @{user.username || "no-username"}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setUserToDelete(user)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the account
                            for <span className="font-semibold text-foreground">{userToDelete?.email}</span> and remove all their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteUser();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
