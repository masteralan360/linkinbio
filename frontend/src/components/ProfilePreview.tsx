import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { ThemeConfig, defaultTheme, Link as AppLink } from "@/lib/api";

interface ProfilePreviewProps {
    user: {
        name: string | null;
        image: string | null;
        bio: string | null;
    };
    links: AppLink[];
    theme?: ThemeConfig;
}

export default function ProfilePreview({ user, links, theme = defaultTheme }: ProfilePreviewProps) {
    // Style configurations based on theme
    const backgroundStyle = theme.backgroundType === 'gradient'
        ? { background: `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})` }
        : { backgroundColor: theme.backgroundColor };

    const avatarShapeClass =
        theme.profileShape === 'square' ? 'rounded-none' :
            theme.profileShape === 'rounded' ? 'rounded-2xl' :
                'rounded-full';

    const buttonStyle = {
        backgroundColor: theme.buttonColor,
        color: theme.linksTitleColor,
        textAlign: theme.linksAlignment as any, // 'left' | 'center' | 'right'
    };

    return (
        <div className="min-h-screen w-full transition-colors duration-300" style={backgroundStyle}>
            <div className="max-w-md mx-auto space-y-8 px-4 py-8">
                {/* Profile Header */}
                <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="relative">
                        {/* Glow effect only if not solid white background? Or keep consistent? Keeping consistent but customizable opacity? */}
                        {/* We'll keep the blur effect but perhaps subtle or adjust color? Defaulting to primary for now */}
                        <div className={`absolute inset-0 blur-3xl bg-black/10 ${avatarShapeClass} scale-150`} />
                        <Avatar className={`relative w-32 h-32 ring-4 ring-white/50 shadow-2xl ${avatarShapeClass}`}>
                            {user.image && <AvatarImage src={user.image} alt={user.name || ""} className="object-cover" />}
                            <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                                {user.name?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <h1 className="text-3xl font-bold mt-2" style={{ color: theme.nameColor }}>
                        {user.name || "@username"}
                    </h1>
                    {user.bio && (
                        <p className="text-center max-w-sm whitespace-pre-wrap" style={{ color: theme.bioColor }}>
                            {user.bio}
                        </p>
                    )}
                </div>

                {/* Links */}
                {links.length === 0 ? (
                    <Card className="bg-white/50 backdrop-blur-sm border-none shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mb-4">
                                <Link2 className="w-6 h-6 text-black/40" />
                            </div>
                            <p className="text-black/60">No links added yet</p>
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
                                className="group block transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div
                                    className="p-4 rounded-lg shadow-sm font-medium transition-all"
                                    style={buttonStyle}
                                >
                                    <div className="flex items-center justify-between">
                                        {/* Use flex logic for alignment */}
                                        <span className="w-full truncate">{link.title}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
