import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { profileApi, defaultTheme, ThemeConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Save, RotateCcw, Monitor, Smartphone, Layout } from "lucide-react";
import ProfilePreview from "@/components/ProfilePreview";

export default function Design() {
    const [, setLocation] = useLocation();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toast } = useToast();

    // Data State
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
    const [profileLinks, setProfileLinks] = useState<any[]>([]); // Using 'any' for simplicity with Link type, can refine
    const [profileUser, setProfileUser] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Fetch Initial Data
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                try {
                    const profile = await profileApi.get(user.id);
                    setProfileUser(profile.user);
                    setProfileLinks(profile.links);
                    if (profile.user.theme) {
                        setTheme(profile.user.theme);
                    }
                } catch (error) {
                    console.error("Failed to load design settings", error);
                    toast({ variant: "destructive", title: "Error", description: "Failed to load appearance settings" });
                } finally {
                    setLoading(false);
                }
            }
        };

        if (isAuthenticated && !authLoading) {
            loadData();
        } else if (!authLoading && !isAuthenticated) {
            setLocation("/login");
        }
    }, [user, isAuthenticated, authLoading, setLocation, toast]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileApi.update({ theme });
            toast({ title: "Changes Saved", description: "Your profile design has been updated." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save changes" });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm("Are you sure you want to reset to default design?")) {
            setTheme(defaultTheme);
        }
    };

    // Helper for Color Input
    const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const [localValue, setLocalValue] = useState(value);

        // Sync local value with prop value when it changes externally
        useEffect(() => {
            setLocalValue(value);
        }, [value]);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            // Only update parent if it's a valid hex color format
            if (/^#?[0-9A-Fa-f]{0,6}$/.test(newValue)) {
                const formattedValue = newValue.startsWith('#') ? newValue : `#${newValue}`;
                if (formattedValue.length === 7 || formattedValue.length === 4) {
                    onChange(formattedValue);
                }
            }
        };

        const handleInputBlur = () => {
            // Validate and format on blur
            let formatted = localValue.trim();
            if (!formatted.startsWith('#')) {
                formatted = `#${formatted}`;
            }
            // Ensure it's a valid hex color
            if (/^#[0-9A-Fa-f]{6}$/.test(formatted)) {
                onChange(formatted);
                setLocalValue(formatted);
            } else if (/^#[0-9A-Fa-f]{3}$/.test(formatted)) {
                // Expand 3-digit hex to 6-digit
                const expanded = `#${formatted[1]}${formatted[1]}${formatted[2]}${formatted[2]}${formatted[3]}${formatted[3]}`;
                onChange(expanded);
                setLocalValue(expanded);
            } else {
                // Reset to original value if invalid
                setLocalValue(value);
            }
        };

        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="flex gap-2 items-center">
                    <div className="relative w-10 h-10 rounded-md overflow-hidden border-2 border-border cursor-pointer hover:border-primary/50 transition-colors">
                        <input
                            type="color"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                            onInput={(e) => {
                                // Keep the color picker open while dragging
                                e.stopPropagation();
                            }}
                        />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ backgroundColor: value }}
                        />
                    </div>
                    <Input
                        ref={inputRef}
                        value={localValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className="font-mono uppercase"
                        maxLength={7}
                        placeholder="#000000"
                    />
                </div>
            </div>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Left Control Panel */}
            <div className="w-full md:w-1/2 p-6 border-r h-screen overflow-y-auto bg-card sticky top-0">
                <div className="max-w-xl mx-auto space-y-8 pb-20">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">Design</h1>
                                <p className="text-muted-foreground text-sm">Customize your profile appearance</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Save Button */}
                    <div className="sticky top-0 z-10 bg-card py-4 border-b md:relative md:border-none md:p-0 md:bg-transparent">
                        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-primary hover:bg-primary/90 text-lg shadow-md">
                            {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                            Save Changes
                        </Button>
                    </div>

                    {/* Background */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Background</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Tabs
                                value={theme.backgroundType}
                                onValueChange={(v) => setTheme({ ...theme, backgroundType: v as 'solid' | 'gradient' })}
                                className="w-full"
                            >
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="solid">Solid Color</TabsTrigger>
                                    <TabsTrigger value="gradient">Gradient</TabsTrigger>
                                </TabsList>
                                <TabsContent value="solid" className="pt-4">
                                    <ColorPicker
                                        label="Background Color"
                                        value={theme.backgroundColor}
                                        onChange={(v) => setTheme({ ...theme, backgroundColor: v })}
                                    />
                                </TabsContent>
                                <TabsContent value="gradient" className="pt-4 space-y-4">
                                    <ColorPicker
                                        label="Gradient Start"
                                        value={theme.gradientStart}
                                        onChange={(v) => setTheme({ ...theme, gradientStart: v })}
                                    />
                                    <ColorPicker
                                        label="Gradient End"
                                        value={theme.gradientEnd}
                                        onChange={(v) => setTheme({ ...theme, gradientEnd: v })}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Profile Picture Shape */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Picture Shape</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'circle', label: 'Circle', class: 'rounded-full' },
                                    { id: 'square', label: 'Square', class: 'rounded-none' },
                                    { id: 'rounded', label: 'Rounded', class: 'rounded-2xl' },
                                ].map((shape) => (
                                    <button
                                        key={shape.id}
                                        onClick={() => setTheme({ ...theme, profileShape: shape.id as any })}
                                        className={`
                                            flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-all
                                            ${theme.profileShape === shape.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-input'}
                                        `}
                                    >
                                        <div className={`w-12 h-12 border-2 border-foreground ${shape.class}`} />
                                        <span className="text-sm font-medium">{shape.label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Typography Colors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Text Colors</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ColorPicker
                                label="Display Name Color"
                                value={theme.nameColor}
                                onChange={(v) => setTheme({ ...theme, nameColor: v })}
                            />
                            <ColorPicker
                                label="Bio Color"
                                value={theme.bioColor}
                                onChange={(v) => setTheme({ ...theme, bioColor: v })}
                            />
                        </CardContent>
                    </Card>

                    {/* Buttons Style */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Links Style</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ColorPicker
                                label="Links Title Color"
                                value={theme.linksTitleColor}
                                onChange={(v) => setTheme({ ...theme, linksTitleColor: v })}
                            />
                            <ColorPicker
                                label="Button Background Color"
                                value={theme.buttonColor}
                                onChange={(v) => setTheme({ ...theme, buttonColor: v })}
                            />

                            <div className="pt-2">
                                <Label className="mb-2 block">Links Title Alignment</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['left', 'center', 'right'].map((align) => (
                                        <Button
                                            key={align}
                                            variant={theme.linksAlignment === align ? "default" : "outline"}
                                            onClick={() => setTheme({ ...theme, linksAlignment: align as any })}
                                            className="capitalize"
                                        >
                                            {align}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2">
                                <Label className="mb-2 block">Button Height: {theme.buttonHeight ?? 8}</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="range"
                                        min="0"
                                        max="20"
                                        value={theme.buttonHeight ?? 8}
                                        onChange={(e) => setTheme({ ...theme, buttonHeight: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={theme.buttonHeight ?? 8}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            const clamped = Math.max(0, Math.min(20, val));
                                            setTheme({ ...theme, buttonHeight: clamped });
                                        }}
                                        className="w-20"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Label className="mb-2 block">Button Border Radius: {theme.buttonBorderRadius ?? 5}</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        type="range"
                                        min="0"
                                        max="20"
                                        value={theme.buttonBorderRadius ?? 5}
                                        onChange={(e) => setTheme({ ...theme, buttonBorderRadius: parseInt(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={theme.buttonBorderRadius ?? 5}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            const clamped = Math.max(0, Math.min(20, val));
                                            setTheme({ ...theme, buttonBorderRadius: clamped });
                                        }}
                                        className="w-20"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-4">
                                <ColorPicker
                                    label="Left Icon Color"
                                    value={theme.leftIconColor ?? '#9333ea'}
                                    onChange={(v) => setTheme({ ...theme, leftIconColor: v })}
                                />

                                <div className="pt-2">
                                    <Label className="mb-2 block">Icon Size: {theme.iconSize ?? 15}</Label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="range"
                                            min="0"
                                            max="20"
                                            value={theme.iconSize ?? 15}
                                            onChange={(e) => setTheme({ ...theme, iconSize: parseInt(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <Input
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={theme.iconSize ?? 15}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                const clamped = Math.max(0, Math.min(20, val));
                                                setTheme({ ...theme, iconSize: clamped });
                                            }}
                                            className="w-20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reset */}
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="w-full border-dashed text-muted-foreground hover:text-destructive hover:border-destructive"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Design
                    </Button>

                </div>
            </div>

            {/* Right Preview Panel */}
            <div className="hidden md:flex flex-1 bg-muted/20 items-center justify-center relative overscroll-none h-screen sticky top-0">
                <div className="absolute top-6 left-6 flex gap-2">
                    <div className="px-3 py-1 bg-background/80 backdrop-blur rounded-full text-xs font-medium border shadow-sm flex items-center gap-2">
                        <Monitor className="w-3 h-3" />
                        Live Preview
                    </div>
                </div>

                {/* Mobile Preview Container */}
                <div className="w-[375px] h-[812px] bg-background border rounded-[3rem] shadow-2xl overflow-hidden relative ring-8 ring-muted/50">
                    <div className="absolute top-0 w-full h-full overflow-y-auto scrollbar-hide">
                        <ProfilePreview
                            user={profileUser || { name: 'Your Name', bio: 'Bio goes here', image: null }}
                            links={profileLinks}
                            theme={theme}
                        />
                    </div>
                    {/* Notch/Phone decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50 pointer-events-none" />
                </div>
            </div>

            {/* Mobile Preview Toggle (Visible only on small screens) */}
            {/* Note: User requested 50/50 split, implying desktop. For mobile, it would typically stack or tab. 
                 The current code handles desktop split properly. Mobile will stack controls then preview would be at bottom or hidden.
             */}
        </div>
    );
}
