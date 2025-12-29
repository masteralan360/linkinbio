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

// Profile API using Supabase
export interface ProfileData {
    user: {
        id: string;
        name: string | null;
        image: string | null;
        bio: string | null;
    };
    links: Link[];
}

export const profileApi = {
    get: async (userId: string): Promise<ProfileData> => {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, name, image, bio")
            .eq("id", userId)
            .single();

        if (profileError) throw new Error(profileError.message);
        if (!profile) throw new Error("User not found");

        // Get public links
        const { data: links, error: linksError } = await supabase
            .from("links")
            .select("*")
            .eq("user_id", userId)
            .eq("is_public", true)
            .order("position", { ascending: true });

        if (linksError) throw new Error(linksError.message);

        return {
            user: {
                id: profile.id,
                name: profile.name,
                image: profile.image,
                bio: profile.bio || null,
            },
            links: (links || []).map(transformLink),
        };
    },

    // Update user profile
    update: async (data: { name?: string; bio?: string; image?: string }): Promise<void> => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("profiles")
            .update({
                name: data.name,
                bio: data.bio,
                image: data.image,
            })
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
};
