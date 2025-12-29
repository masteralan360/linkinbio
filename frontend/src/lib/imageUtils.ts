/**
 * Image utility functions for compression and upload to Backblaze B2
 */

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

// Get Backblaze B2 configuration from environment
const B2_ENDPOINT = import.meta.env.VITE_B2_ENDPOINT || '';
const B2_BUCKET = import.meta.env.VITE_B2_BUCKET || '';
const B2_KEY_ID = import.meta.env.VITE_B2_KEY_ID || '';
const B2_APP_KEY = import.meta.env.VITE_B2_APP_KEY || '';

export const isB2Configured = B2_ENDPOINT && B2_BUCKET && B2_KEY_ID && B2_APP_KEY;

// Upload image to Backblaze B2 via presigned URL or direct upload
export async function uploadToB2(
    blob: Blob,
    fileName: string
): Promise<string> {
    if (!isB2Configured) {
        throw new Error('Backblaze B2 is not configured. Please set environment variables.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `profiles/${timestamp}-${fileName}`;

    // For B2 S3-compatible API, we need to use presigned URLs or a backend proxy
    // Since we're doing client-side upload, we'll use the S3-compatible API
    const uploadUrl = `https://${B2_BUCKET}.${B2_ENDPOINT}/${uniqueFileName}`;

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'image/jpeg',
            'Authorization': `Basic ${btoa(`${B2_KEY_ID}:${B2_APP_KEY}`)}`,
        },
        body: blob,
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    // Return the public URL
    return `https://${B2_BUCKET}.${B2_ENDPOINT}/${uniqueFileName}`;
}

// Create a data URL from a blob for preview
export function createPreviewUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
}

// Revoke a preview URL to free memory
export function revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
}
