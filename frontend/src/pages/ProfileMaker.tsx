import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/api";
import { compressImage, uploadToB2, isB2Configured, createPreviewUrl, revokePreviewUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Upload, Camera, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ProfileMaker() {
    const [, setLocation] = useLocation();
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            setLocation("/login");
        }
    }, [authLoading, isAuthenticated, setLocation]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreview) {
                revokePreviewUrl(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError("Please select a valid image file");
            return;
        }

        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
            setError("Image is too large. Please select an image under 10MB");
            return;
        }

        setError(null);
        setIsCompressing(true);

        try {
            // Compress the image
            const compressedBlob = await compressImage(file, 400, 400, 0.85);

            // Create preview URL
            const previewUrl = createPreviewUrl(compressedBlob);

            // Revoke old preview URL
            if (imagePreview) {
                revokePreviewUrl(imagePreview);
            }

            setImageFile(new File([compressedBlob], file.name, { type: 'image/jpeg' }));
            setImagePreview(previewUrl);
        } catch (err) {
            setError("Failed to process image. Please try another image.");
            console.error("Image compression error:", err);
        } finally {
            setIsCompressing(false);
        }
    }, [imagePreview]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            // Create a fake event to reuse handleImageSelect logic
            const fakeEvent = {
                target: { files: [file] }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleImageSelect(fakeEvent);
        }
    }, [handleImageSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }

        setError(null);
        setIsSaving(true);

        try {
            let imageUrl: string | undefined;

            // Upload image if selected
            if (imageFile && isB2Configured) {
                try {
                    const compressedBlob = await compressImage(imageFile, 400, 400, 0.85);
                    imageUrl = await uploadToB2(compressedBlob, imageFile.name);
                } catch (uploadErr) {
                    console.error("Image upload error:", uploadErr);
                    // Continue without image if B2 upload fails
                }
            }

            // Update profile in database
            await profileApi.update({
                name: name.trim(),
                bio: bio.trim() || undefined,
                image: imageUrl,
            });

            setSuccess(true);

            // Redirect to dashboard after short delay
            setTimeout(() => {
                setLocation("/dashboard");
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                        Set up your profile to personalize your link page
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-green-500">Profile saved! Redirecting to dashboard...</p>
                        </div>
                    )}

                    {/* Profile Picture Upload */}
                    <div className="space-y-3">
                        <Label>Profile Picture</Label>
                        <div
                            className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            {isCompressing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Compressing image...</p>
                                </div>
                            ) : imagePreview ? (
                                <div className="relative">
                                    <img
                                        src={imagePreview}
                                        alt="Profile preview"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
                                    />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                        <Camera className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Click or drag to upload</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            JPG, PNG or GIF (max 10MB)
                                        </p>
                                    </div>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>
                        {!isB2Configured && (
                            <p className="text-xs text-amber-500">
                                ⚠️ Image storage is not configured. Profile picture won't be saved.
                            </p>
                        )}
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name *</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {name.length}/50
                        </p>
                    </div>

                    {/* Bio Textarea */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            placeholder="Tell people a little about yourself..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={160}
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {bio.length}/160
                        </p>
                    </div>

                    {/* Save Button */}
                    <Button
                        onClick={handleSave}
                        className="w-full h-12"
                        disabled={isSaving || success}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Saved!
                            </>
                        ) : (
                            "Save Profile"
                        )}
                    </Button>

                    {user && (
                        <p className="text-xs text-center text-muted-foreground">
                            Signed in as {user.email}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
