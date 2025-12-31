import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { ThemeConfig, defaultTheme, Link as AppLink } from "@/lib/api";
import { 
    FaTiktok, 
    FaSnapchat, 
    FaWhatsapp, 
    FaInstagram, 
    FaTwitter, 
    FaFacebook, 
    FaYoutube, 
    FaLinkedin, 
    FaGithub, 
    FaDiscord,
    FaTelegram,
    FaReddit,
    FaPinterest,
    FaSpotify,
    FaApple,
    FaGoogle,
    FaAmazon,
    FaPaypal,
    FaEbay,
    FaShopify,
    FaEtsy,
    FaTwitch,
    FaSoundcloud,
    FaBandcamp,
    FaPatreon,
    FaMedium,
    FaBehance,
    FaDribbble,
    FaSkype,
    FaVimeo,
    FaTumblr,
    FaWordpress,
    FaYelp,
    FaAirbnb,
    FaUber,
    FaDropbox,
    FaGoogleDrive,
    FaSlack,
    FaMicrosoft,
} from "react-icons/fa";
import { SiOnlyfans, SiFigma, SiViber } from "react-icons/si";
import { MdPhone } from "react-icons/md";
import type { IconType } from "react-icons";

interface ProfilePreviewProps {
    user: {
        name: string | null;
        image: string | null;
        bio: string | null;
    };
    links: AppLink[];
    theme?: ThemeConfig;
}

// Function to detect platform from URL and return appropriate icon
function getPlatformIcon(url: string): IconType {
    const lowerUrl = url.toLowerCase();
    
    // Phone (tel:)
    if (lowerUrl.startsWith('tel:')) return MdPhone;
    
    // Viber (viber://)
    if (lowerUrl.startsWith('viber://')) return SiViber;
    
    // TikTok
    if (lowerUrl.includes('tiktok.com')) return FaTiktok;
    
    // Snapchat
    if (lowerUrl.includes('snapchat.com')) return FaSnapchat;
    
    // WhatsApp
    if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com') || lowerUrl.includes('api.whatsapp.com')) return FaWhatsapp;
    
    // Instagram
    if (lowerUrl.includes('instagram.com')) return FaInstagram;
    
    // Twitter/X
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return FaTwitter;
    
    // Facebook
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) return FaFacebook;
    
    // YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return FaYoutube;
    
    // LinkedIn
    if (lowerUrl.includes('linkedin.com')) return FaLinkedin;
    
    // GitHub
    if (lowerUrl.includes('github.com')) return FaGithub;
    
    // Discord
    if (lowerUrl.includes('discord.com') || lowerUrl.includes('discord.gg')) return FaDiscord;
    
    // Telegram
    if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram.org')) return FaTelegram;
    
    // Reddit
    if (lowerUrl.includes('reddit.com')) return FaReddit;
    
    // Pinterest
    if (lowerUrl.includes('pinterest.com')) return FaPinterest;
    
    // Spotify
    if (lowerUrl.includes('spotify.com') || lowerUrl.includes('open.spotify.com')) return FaSpotify;
    
    // Apple
    if (lowerUrl.includes('apple.com') || lowerUrl.includes('itunes.apple.com') || lowerUrl.includes('apps.apple.com')) return FaApple;
    
    // Google
    if (lowerUrl.includes('google.com') || lowerUrl.includes('goo.gl')) return FaGoogle;
    
    // Amazon
    if (lowerUrl.includes('amazon.com') || lowerUrl.includes('amazon.co.uk') || lowerUrl.includes('amazon.de')) return FaAmazon;
    
    // PayPal
    if (lowerUrl.includes('paypal.com')) return FaPaypal;
    
    // eBay
    if (lowerUrl.includes('ebay.com')) return FaEbay;
    
    // Shopify
    if (lowerUrl.includes('shopify.com') || lowerUrl.includes('.myshopify.com')) return FaShopify;
    
    // Etsy
    if (lowerUrl.includes('etsy.com')) return FaEtsy;
    
    // Twitch
    if (lowerUrl.includes('twitch.tv')) return FaTwitch;
    
    // SoundCloud
    if (lowerUrl.includes('soundcloud.com')) return FaSoundcloud;
    
    // Bandcamp
    if (lowerUrl.includes('bandcamp.com')) return FaBandcamp;
    
    // Patreon
    if (lowerUrl.includes('patreon.com')) return FaPatreon;
    
    // Medium
    if (lowerUrl.includes('medium.com')) return FaMedium;
    
    // Behance
    if (lowerUrl.includes('behance.net')) return FaBehance;
    
    // Dribbble
    if (lowerUrl.includes('dribbble.com')) return FaDribbble;
    
    // Figma
    if (lowerUrl.includes('figma.com')) return SiFigma;
    
    // Skype
    if (lowerUrl.includes('skype.com')) return FaSkype;
    
    // Vimeo
    if (lowerUrl.includes('vimeo.com')) return FaVimeo;
    
    // Tumblr
    if (lowerUrl.includes('tumblr.com')) return FaTumblr;
    
    // WordPress
    if (lowerUrl.includes('wordpress.com')) return FaWordpress;
    
    // Yelp
    if (lowerUrl.includes('yelp.com')) return FaYelp;
    
    // Airbnb
    if (lowerUrl.includes('airbnb.com')) return FaAirbnb;
    
    // Uber
    if (lowerUrl.includes('uber.com')) return FaUber;
    
    // Dropbox
    if (lowerUrl.includes('dropbox.com')) return FaDropbox;
    
    // Google Drive
    if (lowerUrl.includes('drive.google.com')) return FaGoogleDrive;
    
    // Slack
    if (lowerUrl.includes('slack.com')) return FaSlack;
    
    // Microsoft
    if (lowerUrl.includes('microsoft.com') || lowerUrl.includes('office.com')) return FaMicrosoft;
    
    // OnlyFans
    if (lowerUrl.includes('onlyfans.com')) return SiOnlyfans;
    
    // Default: generic link icon
    return Link2;
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
                                className="group block transition-transform hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <div
                                    className="relative w-full shadow-md hover:shadow-lg transition-all flex items-center px-4"
                                    style={{
                                        backgroundColor: theme.buttonColor,
                                        color: theme.linksTitleColor,
                                        height: `${(theme.buttonHeight ?? 8) * 0.4375}rem`, // Convert scale (0-20) to rem, where 8 = 3.5rem (current h-14)
                                        borderRadius: `${(theme.buttonBorderRadius ?? 5) * 0.1}rem`, // Convert scale (0-20) to rem, where 5 = 0.5rem (current rounded-lg)
                                    }}
                                >
                                    <div className="flex items-center w-full">
                                        {/* Left Icon (Dynamic based on URL) */}
                                        <div 
                                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center mr-3"
                                            style={{
                                                color: theme.leftIconColor ?? '#9333ea',
                                            }}
                                        >
                                            {(() => {
                                                const IconComponent = getPlatformIcon(link.url);
                                                const iconSize = (theme.iconSize ?? 15) * 0.125; // Convert scale (0-20) to rem, where 15 = 1.875rem (1.5x of original 1.25rem)
                                                return <IconComponent style={{ width: `${iconSize}rem`, height: `${iconSize}rem` }} />;
                                            })()}
                                        </div>

                                        {/* Text Container (Flex grow with alignment) */}
                                        <div
                                            className="flex-grow min-w-0 mx-2"
                                            style={{ textAlign: theme.linksAlignment as any }}
                                        >
                                            <span className="font-medium truncate block text-base">
                                                {link.title}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pb-8 pt-4">
                    <p className="text-sm font-medium opacity-60 flex items-center justify-center gap-1" style={{ color: theme.bioColor }}>
                        Powered by
                        <span className="text-primary font-bold hover:underline cursor-pointer">IraqLinked</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
