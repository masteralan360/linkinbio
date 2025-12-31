import { supabase, type Link as DbLink, type Profile } from "./supabase";

// Link interface for frontend (camelCase)
export interface Link {
    id: string;
    userId: string;
    title: string;
    url: string;
    position: number;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

// Transform database link to match frontend expectations
const transformLink = (link: DbLink): Link => ({
    id: link.id,
    userId: link.user_id,
    title: link.title,
    url: link.url,
    position: link.position,
    isPublic: link.is_public,
    createdAt: link.created_at,
    updatedAt: link.updated_at,
});

export interface CreateLinkData {
    title: string;
    url: string;
    isPublic?: boolean;
}

export interface UpdateLinkData {
    title?: string;
    url?: string;
    isPublic?: boolean;
}

// Links API using Supabase
export const linksApi = {
    getAll: async (): Promise<Link[]> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from("links")
            .select("*")
            .eq("user_id", user.id)
            .order("position", { ascending: true });

        if (error) throw new Error(error.message);
        return (data || []).map(transformLink);
    },

    create: async (data: CreateLinkData): Promise<Link> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get current max position
        const { data: existingLinks } = await supabase
            .from("links")
            .select("position")
            .eq("user_id", user.id)
            .order("position", { ascending: false })
            .limit(1);

        const position = existingLinks && existingLinks.length > 0 ? existingLinks[0].position + 1 : 0;

        const { data: newLink, error } = await supabase
            .from("links")
            .insert({
                user_id: user.id,
                title: data.title,
                url: data.url,
                is_public: data.isPublic ?? true,
                position,
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return transformLink(newLink);
    },

    update: async (id: string, data: UpdateLinkData): Promise<Link> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.url !== undefined) updateData.url = data.url;
        if (data.isPublic !== undefined) updateData.is_public = data.isPublic;

        const { data: updatedLink, error } = await supabase
            .from("links")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        if (!updatedLink) throw new Error("Link not found");
        return transformLink(updatedLink);
    },

    delete: async (id: string): Promise<void> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("links").delete().eq("id", id).eq("user_id", user.id);

        if (error) throw new Error(error.message);
    },

    reorder: async (linkIds: string[]): Promise<Link[]> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Update positions in a transaction-like manner
        const updates = linkIds.map((id, index) =>
            supabase
                .from("links")
                .update({ position: index })
                .eq("id", id)
                .eq("user_id", user.id)
        );

        await Promise.all(updates);

        // Fetch updated links
        const { data, error } = await supabase
            .from("links")
            .select("*")
            .eq("user_id", user.id)
            .order("position", { ascending: true });

        if (error) throw new Error(error.message);
        return (data || []).map(transformLink);
    },

    toggleVisibility: async (id: string): Promise<Link> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Get current link
        const { data: currentLink, error: fetchError } = await supabase
            .from("links")
            .select("is_public")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (fetchError) throw new Error(fetchError.message);
        if (!currentLink) throw new Error("Link not found");

        // Toggle visibility
        const { data: updatedLink, error } = await supabase
            .from("links")
            .update({ is_public: !currentLink.is_public })
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return transformLink(updatedLink);
    },
};

export interface ThemeConfig {
    backgroundType: 'solid' | 'gradient';
    backgroundColor: string;
    gradientStart: string;
    gradientEnd: string;
    profileShape: 'circle' | 'square' | 'rounded';
    nameColor: string;
    bioColor: string;
    linksTitleColor: string;
    buttonColor: string;
    linksAlignment: 'left' | 'center' | 'right';
    buttonHeight: number;
    buttonBorderRadius: number;
    leftIconColor: string;
    iconSize: number;
}

export const defaultTheme: ThemeConfig = {
    backgroundType: 'solid',
    backgroundColor: '#ffffff',
    gradientStart: '#ffffff',
    gradientEnd: '#f0f0f0',
    profileShape: 'circle',
    nameColor: '#000000',
    bioColor: '#666666',
    linksTitleColor: '#000000',
    buttonColor: '#ffffff',
    linksAlignment: 'center',
    buttonHeight: 8,
    buttonBorderRadius: 5,
    leftIconColor: '#9333ea',
    iconSize: 15,
};

// Profile API using Supabase
export interface ProfileData {
    user: {
        id: string;
        name: string | null;
        image: string | null;
        bio: string | null;
        username: string | null;
        theme: ThemeConfig;
    };
    links: Link[];
}

export const profileApi = {
    get: async (userId: string): Promise<ProfileData> => {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, name, image, bio, username, theme")
            .eq("id", userId)
            .single();

        if (profileError) throw new Error(profileError.message);
        if (!profile) throw new Error("User not found");

        // Get public links
        const { data: links, error: linksError } = await supabase
            .from("links")
            .select("*")
            .eq("user_id", userId)
            .order("position", { ascending: true });

        if (linksError) throw new Error(linksError.message);

        return {
            user: {
                id: profile.id,
                name: profile.name,
                image: profile.image,
                bio: profile.bio || null,
                username: profile.username || null,
                theme: profile.theme || defaultTheme,
            },
            links: (links || []).map(transformLink),
        };
    },

    getByUsername: async (username: string): Promise<ProfileData> => {
        // Get user profile by username
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, name, image, bio, username, theme")
            .eq("username", username)
            .single();

        if (profileError) throw new Error(profileError.message);
        if (!profile) throw new Error("User not found");

        // Get public links using the fetched profile ID
        const { data: links, error: linksError } = await supabase
            .from("links")
            .select("*")
            .eq("user_id", profile.id)
            .eq("is_public", true)
            .order("position", { ascending: true });

        if (linksError) throw new Error(linksError.message);

        return {
            user: {
                id: profile.id,
                name: profile.name,
                image: profile.image,
                bio: profile.bio || null,
                username: profile.username,
                theme: profile.theme || defaultTheme,
            },
            links: (links || []).map(transformLink),
        };
    },

    // Update user profile
    update: async (data: { name?: string; bio?: string | null; image?: string | null; theme?: ThemeConfig }): Promise<void> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("profiles")
            .update(data)
            .eq("id", user.id);

        if (error) {
            // Check for unique violation on name column
            if (error.code === '23505') {
                throw new Error("This display name is already taken. Please choose another.");
            }
            throw new Error(error.message);
        }
    },
};

// Settings API for app configuration
export const settingsApi = {
    // Validate passkey for signup
    validatePasskey: async (passkey: string): Promise<boolean> => {
        const { data, error } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "signup_passkey")
            .single();

        if (error) {
            console.error("Error validating passkey:", error);
            return false;
        }

        return data?.value === passkey;
    },

    // Update username
    updateUsername: async (username: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Update profile
        const { error } = await supabase
            .from("profiles")
            .update({ username })
            .eq("id", user.id);

        if (error) {
            if (error.code === '23505') {
                throw new Error("This username is already taken. Please choose another.");
            }
            throw new Error(error.message);
        }
    },

    // Update email
    updateEmail: async (email: string): Promise<void> => {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw new Error(error.message);
    },

    // Update password
    updatePassword: async (password: string): Promise<void> => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message);
    },

    // Delete account
    deleteAccount: async (): Promise<void> => {
        const { error } = await supabase.rpc('delete_own_account');
        if (error) throw new Error(error.message);
        await supabase.auth.signOut();
    }
};
