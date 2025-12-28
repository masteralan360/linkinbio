import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { linksApi, type Link, type CreateLinkData, type UpdateLinkData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useLinks() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const {
        data: links = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ["links"],
        queryFn: linksApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: linksApi.create,
        onMutate: async (newLink: CreateLinkData) => {
            await queryClient.cancelQueries({ queryKey: ["links"] });
            const previousLinks = queryClient.getQueryData<Link[]>(["links"]);

            // Optimistic update
            const optimisticLink: Link = {
                id: `temp-${Date.now()}`,
                userId: "",
                title: newLink.title,
                url: newLink.url,
                position: (previousLinks?.length ?? 0),
                isPublic: newLink.isPublic ?? true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            queryClient.setQueryData<Link[]>(["links"], (old) => [
                ...(old ?? []),
                optimisticLink,
            ]);

            return { previousLinks };
        },
        onError: (err, _, context) => {
            queryClient.setQueryData(["links"], context?.previousLinks);
            toast({
                title: "Error",
                description: err.message || "Failed to create link",
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        },
        onSuccess: () => {
            toast({
                title: "Link created",
                description: "Your new link has been added.",
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateLinkData }) =>
            linksApi.update(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ["links"] });
            const previousLinks = queryClient.getQueryData<Link[]>(["links"]);

            queryClient.setQueryData<Link[]>(["links"], (old) =>
                old?.map((link) =>
                    link.id === id ? { ...link, ...data, updatedAt: new Date().toISOString() } : link
                ) ?? []
            );

            return { previousLinks };
        },
        onError: (err, _, context) => {
            queryClient.setQueryData(["links"], context?.previousLinks);
            toast({
                title: "Error",
                description: err.message || "Failed to update link",
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        },
        onSuccess: () => {
            toast({
                title: "Link updated",
                description: "Your changes have been saved.",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: linksApi.delete,
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ["links"] });
            const previousLinks = queryClient.getQueryData<Link[]>(["links"]);

            queryClient.setQueryData<Link[]>(["links"], (old) =>
                old?.filter((link) => link.id !== id) ?? []
            );

            return { previousLinks };
        },
        onError: (err, _, context) => {
            queryClient.setQueryData(["links"], context?.previousLinks);
            toast({
                title: "Error",
                description: err.message || "Failed to delete link",
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        },
        onSuccess: () => {
            toast({
                title: "Link deleted",
                description: "The link has been removed.",
            });
        },
    });

    const reorderMutation = useMutation({
        mutationFn: linksApi.reorder,
        onMutate: async (linkIds: string[]) => {
            await queryClient.cancelQueries({ queryKey: ["links"] });
            const previousLinks = queryClient.getQueryData<Link[]>(["links"]);

            // Reorder based on the new order
            const linkMap = new Map(previousLinks?.map((link) => [link.id, link]));
            const reorderedLinks = linkIds
                .map((id, index) => {
                    const link = linkMap.get(id);
                    return link ? { ...link, position: index } : null;
                })
                .filter(Boolean) as Link[];

            queryClient.setQueryData<Link[]>(["links"], reorderedLinks);

            return { previousLinks };
        },
        onError: (err, _, context) => {
            queryClient.setQueryData(["links"], context?.previousLinks);
            toast({
                title: "Error",
                description: err.message || "Failed to reorder links",
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        },
    });

    const toggleVisibilityMutation = useMutation({
        mutationFn: linksApi.toggleVisibility,
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ["links"] });
            const previousLinks = queryClient.getQueryData<Link[]>(["links"]);

            queryClient.setQueryData<Link[]>(["links"], (old) =>
                old?.map((link) =>
                    link.id === id ? { ...link, isPublic: !link.isPublic } : link
                ) ?? []
            );

            return { previousLinks };
        },
        onError: (err, _, context) => {
            queryClient.setQueryData(["links"], context?.previousLinks);
            toast({
                title: "Error",
                description: err.message || "Failed to toggle visibility",
                variant: "destructive",
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
        },
    });

    return {
        links,
        isLoading,
        error,
        createLink: createMutation.mutate,
        isCreating: createMutation.isPending,
        updateLink: (id: string, data: UpdateLinkData) =>
            updateMutation.mutate({ id, data }),
        isUpdating: updateMutation.isPending,
        deleteLink: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,
        reorderLinks: reorderMutation.mutate,
        isReordering: reorderMutation.isPending,
        toggleVisibility: toggleVisibilityMutation.mutate,
        isTogglingVisibility: toggleVisibilityMutation.isPending,
    };
}
