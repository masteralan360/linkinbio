import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLinks } from "@/hooks/useLinks";
import { useToast } from "@/hooks/use-toast";
import { profileApi } from "@/lib/api";
import { compressImage, uploadProfileImage, deleteProfileImage, createPreviewUrl, revokePreviewUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Plus,
    GripVertical,
    Pencil,
    Trash2,
    ExternalLink,
    Eye,
    EyeOff,
    Link2,
    Copy,
    Check,
    Camera,
    Loader2,
    Save,
    Palette,
    User,
} from "lucide-react";
import type { Link } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";

const linkSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    url: z.string().url("Must be a valid URL"),
    isPublic: z.boolean().optional(),
});

type LinkFormData = z.infer<typeof linkSchema>;

// Sortable link item component
function SortableLinkItem({
    link,
    onEdit,
    onDelete,
    onToggleVisibility,
}: {
    link: Link;
    onEdit: (link: Link) => void;
    onDelete: (id: string) => void;
    onToggleVisibility: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: link.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${!link.isPublic ? "opacity-60" : ""
                }`}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
            >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{link.title}</h3>
                <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                >
                    {link.url}
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleVisibility(link.id)}
                    title={link.isPublic ? "Hide from public" : "Show on public profile"}
                >
                    {link.isPublic ? (
                        <Eye className="w-4 h-4" />
                    ) : (
                        <EyeOff className="w-4 h-4" />
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(link)}
                    title="Edit link"
                >
                    <Pencil className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(link.id)}
                    title="Delete link"
                >
                    <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const { user, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();
    const {
        links,
        isLoading,
        createLink,
        isCreating,
        updateLink,
        isUpdating,
        deleteLink,
        reorderLinks,
        toggleVisibility,
    } = useLinks();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<Link | null>(null);
    const [copied, setCopied] = useState(false);

    // Profile modal state
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Profile picture state

    // Profile picture state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    // Profile editing state
    const [profileName, setProfileName] = useState("");
    const [profileBio, setProfileBio] = useState("");
    const [profileUsername, setProfileUsername] = useState<string | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Sync user data when it loads
    // Sync user data when it loads
    useEffect(() => {
        const fetchProfileData = async () => {
            if (user) {
                try {
                    const profileData = await profileApi.get(user.id);

                    // Require name to be set, otherwise redirect to profile maker
                    if (!profileData.user.name) {
                        setLocation("/profile-maker");
                        return;
                    }

                    setCurrentImageUrl(profileData.user.image || null);
                    setProfileName(profileData.user.name || "");
                    setProfileBio(profileData.user.bio || "");
                    setProfileUsername(profileData.user.username || null);
                } catch (error) {
                    console.error("Error fetching profile:", error);
                    // Fallback to auth user data if fetch fails
                    setCurrentImageUrl(user.image || null);
                    setProfileName(user.name || "");
                }
            }
        };

        fetchProfileData();
    }, [user]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const createForm = useForm<LinkFormData>({
        resolver: zodResolver(linkSchema),
        defaultValues: {
            title: "",
            url: "",
            isPublic: true,
        },
    });

    const editForm = useForm<LinkFormData>({
        resolver: zodResolver(linkSchema),
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            setLocation("/login");
        }
    }, [authLoading, isAuthenticated, setLocation]);

    // Reset edit form when editing link changes
    useEffect(() => {
        if (editingLink) {
            editForm.reset({
                title: editingLink.title,
                url: editingLink.url,
                isPublic: editingLink.isPublic,
            });
        }
    }, [editingLink, editForm]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = links.findIndex((l) => l.id === active.id);
            const newIndex = links.findIndex((l) => l.id === over.id);
            const newOrder = arrayMove(links, oldIndex, newIndex);
            reorderLinks(newOrder.map((l) => l.id));
        }
    };

    const onCreateSubmit = (data: LinkFormData) => {
        createLink(data, {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const onEditSubmit = (data: LinkFormData) => {
        if (!editingLink) return;
        updateLink(editingLink.id, data);
        setEditingLink(null);
    };

    const handleCopyProfileUrl = async () => {
        const identifier = profileUsername || user?.id;
        if (!identifier) return;

        const url = `${window.location.origin}/profile/${identifier}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                title: "Copied!",
                description: "Profile URL copied to clipboard",
            });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to copy URL",
            });
        }
    };

    // Profile picture handlers
    const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (!file.type.startsWith('image/')) {
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            return;
        }

        setIsUploadingImage(true);
        const oldImageUrl = currentImageUrl;

        try {
            // Compress the image
            const compressedBlob = await compressImage(file, 400, 400, 0.85);

            // Create preview
            const previewUrl = createPreviewUrl(compressedBlob);
            if (imagePreview) {
                revokePreviewUrl(imagePreview);
            }
            setImagePreview(previewUrl);

            // Upload new image first
            const newImageUrl = await uploadProfileImage(compressedBlob, user.id);

            // Add cache-busting timestamp
            const cacheBustedUrl = `${newImageUrl}?t=${Date.now()}`;

            // Update profile in database
            await profileApi.update({ image: newImageUrl });
            await refreshProfile();

            // Delete old image after successful upload
            if (oldImageUrl && !oldImageUrl.includes('avatar')) {
                await deleteProfileImage(oldImageUrl);
            }

            setCurrentImageUrl(cacheBustedUrl);
            setImagePreview(null);
            revokePreviewUrl(previewUrl);
        } catch (err) {
            console.error('Error uploading image:', err);
            setImagePreview(null);
        } finally {
            setIsUploadingImage(false);
        }
    }, [user, currentImageUrl, imagePreview]);

    // Save profile name and bio
    const handleSaveProfile = async () => {
        if (!user) return;

        if (!profileName.trim()) {
            setProfileError("Name is required");
            return;
        }

        setIsSavingProfile(true);
        setProfileError(null);

        try {
            await profileApi.update({
                name: profileName.trim(),
                bio: profileBio.trim() || null,
            });
            await refreshProfile();
            setProfileSaveSuccess(true);
            setTimeout(() => setProfileSaveSuccess(false), 2000);
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setIsSavingProfile(false);
        }
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your links and profile appearance.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyProfileUrl}
                    className="gap-2"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                    Copy Profile URL
                </Button>
            </div>

            {/* Main Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors group relative overflow-hidden"
                    onClick={() => setIsProfileModalOpen(true)}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Edit Profile</h3>
                            <p className="text-sm text-muted-foreground">Update your photo, name, and bio</p>
                        </div>
                    </CardContent>
                </Card>

                <div
                    onClick={() => setLocation("/design")}
                    className="cursor-pointer"
                >
                    <Card className="h-full hover:border-primary/50 transition-colors group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                                <Palette className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Design Appearance</h3>
                                <p className="text-sm text-muted-foreground">Customize colors, fonts, and themes</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Profile Edit Modal */}
            <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your public profile information
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {profileError && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive">{profileError}</p>
                            </div>
                        )}

                        {/* Avatar and basic info row */}
                        <div className="flex flex-col items-center gap-6">
                            <div
                                className="relative cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar className="w-24 h-24 ring-2 ring-border">
                                    {(imagePreview || currentImageUrl) && (
                                        <AvatarImage src={imagePreview || currentImageUrl || undefined} alt={user?.name || ""} />
                                    )}
                                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                        {profileName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    {isUploadingImage ? (
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    disabled={isUploadingImage}
                                />
                                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full border-2 border-background">
                                    <Pencil className="w-3 h-3" />
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="profileName">Display Name</Label>
                                    <Input
                                        id="profileName"
                                        value={profileName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileName(e.target.value)}
                                        placeholder="Your name"
                                        maxLength={50}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profileBio">Bio</Label>
                                    <Textarea
                                        id="profileBio"
                                        value={profileBio}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfileBio(e.target.value)}
                                        placeholder="Tell people about yourself..."
                                        maxLength={160}
                                        rows={3}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{profileBio.length}/160</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            className="gap-2"
                        >
                            {isSavingProfile ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : profileSaveSuccess ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {profileSaveSuccess ? "Saved!" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Links</h1>
                    <p className="text-muted-foreground">
                        Manage your public profile links
                    </p>
                </div>

                <div className="flex items-center gap-3">

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Link
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Link</DialogTitle>
                                <DialogDescription>
                                    Add a new link to your public profile.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="create-title">Title</Label>
                                        <Input
                                            id="create-title"
                                            placeholder="My Website"
                                            {...createForm.register("title")}
                                        />
                                        {createForm.formState.errors.title && (
                                            <p className="text-sm text-destructive">
                                                {createForm.formState.errors.title.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-url">URL</Label>
                                        <Input
                                            id="create-url"
                                            placeholder="https://example.com"
                                            {...createForm.register("url")}
                                        />
                                        {createForm.formState.errors.url && (
                                            <p className="text-sm text-destructive">
                                                {createForm.formState.errors.url.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="create-public"
                                            checked={createForm.watch("isPublic")}
                                            onCheckedChange={(checked) =>
                                                createForm.setValue("isPublic", checked)
                                            }
                                        />
                                        <Label htmlFor="create-public">Show on public profile</Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating ? "Adding..." : "Add Link"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Links List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-20 rounded-lg border bg-muted animate-pulse"
                        />
                    ))}
                </div>
            ) : links.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Link2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="mb-2">No links yet</CardTitle>
                        <CardDescription className="mb-4">
                            Add your first link to get started.
                        </CardDescription>
                        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add Link
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={links.map((l) => l.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-3">
                            {links.map((link) => (
                                <SortableLinkItem
                                    key={link.id}
                                    link={link}
                                    onEdit={setEditingLink}
                                    onDelete={deleteLink}
                                    onToggleVisibility={toggleVisibility}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Link</DialogTitle>
                        <DialogDescription>
                            Make changes to your link.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    placeholder="My Website"
                                    {...editForm.register("title")}
                                />
                                {editForm.formState.errors.title && (
                                    <p className="text-sm text-destructive">
                                        {editForm.formState.errors.title.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-url">URL</Label>
                                <Input
                                    id="edit-url"
                                    placeholder="https://example.com"
                                    {...editForm.register("url")}
                                />
                                {editForm.formState.errors.url && (
                                    <p className="text-sm text-destructive">
                                        {editForm.formState.errors.url.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="edit-public"
                                    checked={editForm.watch("isPublic")}
                                    onCheckedChange={(checked) =>
                                        editForm.setValue("isPublic", checked)
                                    }
                                />
                                <Label htmlFor="edit-public">Show on public profile</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
