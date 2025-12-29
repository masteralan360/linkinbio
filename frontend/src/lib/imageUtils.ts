/**
 * Image utility functions for compression and upload to Supabase Storage
 */

import { supabase, isSupabaseConfigured } from "./supabase";

// Compress image using canvas API
export async function compressImage(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Draw image with white background (for transparency)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Could not compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error('Could not load image'));
        };
        reader.onerror = () => reject(new Error('Could not read file'));
    });
}

// Storage is configured if Supabase is configured
export const isStorageConfigured = isSupabaseConfigured;

// Upload image to Supabase Storage
export async function uploadProfileImage(
    blob: Blob,
    userId: string
): Promise<string> {
    if (!isStorageConfigured) {
        throw new Error('Supabase is not configured. Please set environment variables.');
    }

    // Generate unique filename using userId and timestamp
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}.jpg`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true, // Overwrite if exists
        });

    if (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

// Create a data URL from a blob for preview
export function createPreviewUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
}

// Revoke a preview URL to free memory
export function revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
}
