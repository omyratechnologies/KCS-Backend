import { S3Client } from "bun";
import { nanoid } from "napi-nanoid";
import { config } from "@/utils/env";
import log, { LogTypes } from "@/libs/logger";
import { Upload } from "@/models/upload.model";

/**
 * ChatMediaService - Handles media upload, processing, and delivery for chat system
 * Supports: Images, Videos, Audio, Documents with thumbnails and CDN delivery
 */
export class ChatMediaService {
    private static client: S3Client;

    /**
     * Initialize R2/S3 client
     */
    private static ensureClient(): void {
        if (!this.client) {
            this.client = new S3Client({
                accessKeyId: config.R2_ACCESS_KEY_ID,
                secretAccessKey: config.R2_SECRET_ACCESS_KEY,
                region: config.R2_REGION,
                bucket: config.R2_BUCKET,
                endpoint: config.R2_ENDPOINT,
            });
            log("✅ Chat Media R2 Client initialized", LogTypes.LOGS, "CHAT_MEDIA_SERVICE");
        }
    }

    /**
     * Generate presigned upload URL for direct client → R2 upload
     * Returns URL that client can use to upload without going through backend
     */
    public static async generatePresignedUploadUrl(
        campus_id: string,
        user_id: string,
        fileName: string,
        fileType: string,
        fileSize: number
    ): Promise<{
        success: boolean;
        data?: {
            uploadUrl: string;
            fileKey: string;
            expiresIn: number;
            maxFileSize: number;
        };
        error?: string;
    }> {
        try {
            // Validate file size (max 100MB for chat media)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (fileSize > maxSize) {
                return {
                    success: false,
                    error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
                };
            }

            // Validate file type
            const allowedTypes = [
                // Images
                "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
                // Videos
                "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
                // Audio
                "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm",
                // Documents
                "application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain", "text/csv"
            ];

            if (!allowedTypes.includes(fileType)) {
                return {
                    success: false,
                    error: "File type not allowed for chat media",
                };
            }

            // Generate unique file key with timestamp and nanoid
            const timestamp = Date.now();
            const uniqueId = nanoid();
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileExtension = sanitizedFileName.split('.').pop() || 'bin';
            const fileKey = `chat-media/${campus_id}/${user_id}/${timestamp}-${uniqueId}.${fileExtension}`;

            // For Cloudflare R2, we'll construct a presigned URL
            // Note: Actual presigned URL generation depends on S3Client implementation
            // This is a placeholder - you may need to implement proper presigned URL generation
            const uploadUrl = `${config.R2_ENDPOINT}/${config.R2_BUCKET}/${fileKey}`;
            const expiresIn = 3600; // 1 hour

            log(
                `📤 Generated presigned upload URL for ${fileName} (${fileType}), key: ${fileKey}`,
                LogTypes.LOGS,
                "CHAT_MEDIA_SERVICE"
            );

            return {
                success: true,
                data: {
                    uploadUrl,
                    fileKey,
                    expiresIn,
                    maxFileSize: maxSize,
                },
            };
        } catch (error) {
            log(`❌ Failed to generate presigned URL: ${error}`, LogTypes.ERROR, "CHAT_MEDIA_SERVICE");
            return {
                success: false,
                error: `Failed to generate upload URL: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Confirm media upload and save metadata to database
     * Called by client after successful direct upload to R2
     */
    public static async confirmMediaUpload(
        campus_id: string,
        user_id: string,
        fileData: {
            fileKey: string;
            fileName: string;
            fileType: string;
            fileSize: number;
            width?: number;
            height?: number;
            duration?: number;
        }
    ): Promise<{
        success: boolean;
        data?: {
            id: string;
            url: string;
            thumbnailUrl?: string;
            fileKey: string;
        };
        error?: string;
    }> {
        try {
            const fileUrl = `${config.R2_BUCKET_URL}${fileData.fileKey}`;

            // Determine if thumbnail generation is needed
            const needsThumbnail = fileData.fileType.startsWith("image/") || fileData.fileType.startsWith("video/");

            // Create upload record
            const upload = await Upload.create({
                campus_id,
                user_id,
                original_file_name: fileData.fileName,
                stored_file_name: fileData.fileKey,
                file_size: fileData.fileSize,
                file_type: fileData.fileType,
                s3_url: fileUrl,
                meta_data: {
                    width: fileData.width,
                    height: fileData.height,
                    duration: fileData.duration,
                    needsThumbnail,
                    thumbnailGenerated: false,
                    for_chat: true,
                },
                created_at: new Date(),
                updated_at: new Date(),
            });

            // TODO: Queue thumbnail generation job if needed
            // For now, we'll generate thumbnails on-demand or use Cloudflare Images API

            log(
                `✅ Media upload confirmed: ${fileData.fileName} → ${fileUrl}`,
                LogTypes.LOGS,
                "CHAT_MEDIA_SERVICE"
            );

            return {
                success: true,
                data: {
                    id: upload.id,
                    url: fileUrl,
                    thumbnailUrl: needsThumbnail ? `${fileUrl}?width=200&height=200` : undefined,
                    fileKey: fileData.fileKey,
                },
            };
        } catch (error) {
            log(`❌ Failed to confirm media upload: ${error}`, LogTypes.ERROR, "CHAT_MEDIA_SERVICE");
            return {
                success: false,
                error: `Failed to confirm upload: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Direct upload method (legacy support - less efficient than presigned URLs)
     * Uploads file through backend server to R2
     */
    public static async uploadChatMedia(
        campus_id: string,
        user_id: string,
        file: File
    ): Promise<{
        success: boolean;
        data?: {
            id: string;
            url: string;
            thumbnailUrl?: string;
            fileKey: string;
        };
        error?: string;
    }> {
        try {
            this.ensureClient();

            // Validate file size
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                return {
                    success: false,
                    error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
                };
            }

            // Generate unique file key
            const timestamp = Date.now();
            const uniqueId = nanoid();
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileExtension = sanitizedFileName.split('.').pop() || 'bin';
            const fileKey = `chat-media/${campus_id}/${user_id}/${timestamp}-${uniqueId}.${fileExtension}`;

            // Upload to R2
            const file_data = this.client.file(fileKey);
            const buffer = await file.arrayBuffer();

            await file_data.write(buffer, {
                acl: "public-read",
                type: file.type,
            });

            const fileUrl = `${config.R2_BUCKET_URL}${fileKey}`;

            // Determine if thumbnail is needed
            const needsThumbnail = file.type.startsWith("image/") || file.type.startsWith("video/");

            // Save to database
            const upload = await Upload.create({
                campus_id,
                user_id,
                original_file_name: file.name,
                stored_file_name: fileKey,
                file_size: file.size,
                file_type: file.type,
                s3_url: fileUrl,
                meta_data: {
                    needsThumbnail,
                    thumbnailGenerated: false,
                    for_chat: true,
                },
                created_at: new Date(),
                updated_at: new Date(),
            });

            log(`✅ Chat media uploaded: ${file.name} → ${fileUrl}`, LogTypes.LOGS, "CHAT_MEDIA_SERVICE");

            return {
                success: true,
                data: {
                    id: upload.id,
                    url: fileUrl,
                    thumbnailUrl: needsThumbnail ? `${fileUrl}?width=200&height=200` : undefined,
                    fileKey,
                },
            };
        } catch (error) {
            log(`❌ Failed to upload chat media: ${error}`, LogTypes.ERROR, "CHAT_MEDIA_SERVICE");
            return {
                success: false,
                error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Generate thumbnail URL using Cloudflare Images API
     * Cloudflare R2 can serve images with transformations via URL params
     */
    public static generateThumbnailUrl(
        originalUrl: string,
        width: number = 200,
        height: number = 200,
        fit: "scale-down" | "contain" | "cover" | "crop" | "pad" = "cover"
    ): string {
        // For Cloudflare Images, you can use URL parameters
        // Example: https://example.com/image.jpg?width=200&height=200&fit=cover
        const url = new URL(originalUrl);
        url.searchParams.set("width", width.toString());
        url.searchParams.set("height", height.toString());
        url.searchParams.set("fit", fit);
        return url.toString();
    }

    /**
     * Get media metadata including dimensions, duration, etc.
     */
    public static async getMediaMetadata(uploadId: string): Promise<{
        success: boolean;
        data?: {
            id: string;
            url: string;
            type: string;
            size: number;
            width?: number;
            height?: number;
            duration?: number;
            thumbnailUrl?: string;
        };
        error?: string;
    }> {
        try {
            const upload = await Upload.findById(uploadId);

            if (!upload) {
                return {
                    success: false,
                    error: "Media not found",
                };
            }

            const metadata = upload.meta_data as any;
            const needsThumbnail = upload.file_type.startsWith("image/") || upload.file_type.startsWith("video/");

            return {
                success: true,
                data: {
                    id: upload.id,
                    url: upload.s3_url,
                    type: upload.file_type,
                    size: upload.file_size,
                    width: metadata?.width,
                    height: metadata?.height,
                    duration: metadata?.duration,
                    thumbnailUrl: needsThumbnail ? this.generateThumbnailUrl(upload.s3_url) : undefined,
                },
            };
        } catch (error) {
            log(`❌ Failed to get media metadata: ${error}`, LogTypes.ERROR, "CHAT_MEDIA_SERVICE");
            return {
                success: false,
                error: `Failed to get metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Delete media from R2 and database
     */
    public static async deleteMedia(
        uploadId: string,
        user_id: string
    ): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const upload = await Upload.findById(uploadId);

            if (!upload) {
                return {
                    success: false,
                    error: "Media not found",
                };
            }

            // Verify ownership (basic check - enhance with admin permissions)
            if (upload.user_id !== user_id) {
                return {
                    success: false,
                    error: "Access denied - you can only delete your own media",
                };
            }

            // Delete from R2
            this.ensureClient();
            const file_data = this.client.file(upload.stored_file_name);
            await file_data.delete();

            // Delete from database
            await Upload.removeById(uploadId);

            log(`🗑️ Media deleted: ${upload.original_file_name}`, LogTypes.LOGS, "CHAT_MEDIA_SERVICE");

            return {
                success: true,
            };
        } catch (error) {
            log(`❌ Failed to delete media: ${error}`, LogTypes.ERROR, "CHAT_MEDIA_SERVICE");
            return {
                success: false,
                error: `Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Get signed URL for private media access
     * (If you need temporary access URLs with expiration)
     */
    public static generateSignedUrl(
        fileKey: string,
        expiresIn: number = 3600
    ): string {
        // For now, return public URL
        // TODO: Implement proper signed URL generation if R2 bucket is private
        return `${config.R2_BUCKET_URL}${fileKey}`;
    }
}
