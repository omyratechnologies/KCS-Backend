import { Context } from "hono";
import { UploadFactory } from "@/libs/s3/upload.factory";
import { AndroidApk, IAndroidApk } from "@/models/android_apk.model";
import log, { LogTypes } from "@/libs/logger";

export class AndroidApkController {
    /**
     * Upload and store an APK file
     */
    public static readonly uploadApk = async (ctx: Context) => {
        try {
            log(`Starting APK upload process`, LogTypes.LOGS, "APK Controller");
            
            let file, packageName, version;
            try {
                const body = await ctx.req.parseBody();
                file = body.file;
                packageName = body.packageName;
                version = body.version;
                log(`Parsed body successfully`, LogTypes.LOGS, "APK Controller");
            } catch (parseError) {
                log(`Error parsing request body: ${parseError}`, LogTypes.ERROR, "APK Controller");
                return ctx.json({
                    success: false,
                    message: "Error parsing request body - invalid multipart form data",
                }, 400);
            }

            // Validate required fields
            if (!file || typeof file === "string") {
                log(`No file uploaded or invalid file type`, LogTypes.ERROR, "APK Controller");
                return ctx.json({
                    success: false,
                    message: "No APK file uploaded",
                }, 400);
            }

            if (!packageName || !version) {
                log(`Missing packageName or version: ${packageName}, ${version}`, LogTypes.ERROR, "APK Controller");
                return ctx.json({
                    success: false,
                    message: "Package name and version are required",
                }, 400);
            }

            log(`Received file: ${file.name}, size: ${file.size}, type: ${file.type}`, LogTypes.LOGS, "APK Controller");

            // Validate file type
            if (!file.name.endsWith('.apk') && file.type !== 'application/vnd.android.package-archive') {
                log(`Invalid file type: ${file.type}, name: ${file.name}`, LogTypes.ERROR, "APK Controller");
                return ctx.json({
                    success: false,
                    message: "Invalid file type. Only APK files are allowed",
                }, 400);
            }

            // Validate file size (max 100MB)
            const maxSize = 100 * 1024 * 1024; // 100MB in bytes
            if (file.size > maxSize) {
                log(`File too large: ${file.size} bytes (max: ${maxSize})`, LogTypes.ERROR, "APK Controller");
                return ctx.json({
                    success: false,
                    message: "File too large. Maximum size allowed is 100MB",
                }, 400);
            }

            // Check if this package and version already exists
            let existingApk;
            try {
                existingApk = await AndroidApk.findOne({
                    packageName: packageName as string,
                    version: version as string
                });
            } catch (findError) {
                // If it's a "document not found" error or collection doesn't exist, treat as no existing APK
                if (findError instanceof Error && findError.message.includes("document not found")) {
                    log(`Collection doesn't exist yet, proceeding with upload`, LogTypes.LOGS, "APK Controller");
                    existingApk = null;
                } else {
                    log(`Error checking for existing APK: ${findError}`, LogTypes.ERROR, "APK Controller");
                    throw findError; // Re-throw other types of errors
                }
            }

            if (existingApk) {
                return ctx.json({
                    success: false,
                    message: "APK with this package name and version already exists",
                }, 409);
            }

            // Initialize S3 client and upload file
            UploadFactory.createUploadClient();
            
            let s3Data;
            try {
                // Add timeout for S3 upload (30 seconds)
                const uploadPromise = UploadFactory.upload(file);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
                );
                
                s3Data = await Promise.race([uploadPromise, timeoutPromise]);
                log(`File uploaded to S3: ${s3Data.url}`, LogTypes.LOGS, "APK Controller");
            } catch (uploadError) {
                log(`Error uploading file to S3: ${uploadError}`, LogTypes.ERROR, "APK Controller");
                return ctx.json({
                    success: false,
                    message: uploadError instanceof Error && uploadError.message.includes('timeout') 
                        ? "Upload timeout - file too large or network issue" 
                        : "Failed to upload file to storage",
                }, 500);
            }

            // Calculate file size
            const fileSize = file.size || 0;

            // Save APK data to database
            const apkData: IAndroidApk = {
                packageName: packageName as string,
                version: version as string,
                filePath: s3Data.url,
                fileSize: fileSize,
                uploadDate: new Date()
            };

            let savedApk;
            try {
                log(`Saving APK to database: ${packageName} v${version}`, LogTypes.LOGS, "APK Controller");
                savedApk = await AndroidApk.create(apkData);
                log(`APK saved successfully with ID: ${savedApk.id}`, LogTypes.LOGS, "APK Controller");
            } catch (createError) {
                log(`Error creating APK document: ${createError}`, LogTypes.ERROR, "APK Controller");
                // If collection doesn't exist or other creation error, provide specific error
                const errorMessage = createError instanceof Error ? createError.message : String(createError);
                return ctx.json({
                    success: false,
                    message: `Failed to save APK to database: ${errorMessage}`,
                }, 500);
            }

            log(`APK uploaded successfully: ${packageName} v${version}`, LogTypes.LOGS, "APK Controller");

            return ctx.json({
                success: true,
                message: "APK uploaded successfully",
                data: {
                    id: savedApk.id,
                    packageName: savedApk.packageName,
                    version: savedApk.version,
                    uploadDate: savedApk.uploadDate,
                    fileSize: savedApk.fileSize,
                    downloadUrl: savedApk.filePath
                }
            }, 201);

        } catch (error) {
            log(`Error uploading APK: ${error}`, LogTypes.ERROR, "APK Controller");
            return ctx.json({
                success: false,
                message: "Internal server error while uploading APK",
            }, 500);
        }
    };

    /**
     * Get all APK files
     */
    public static readonly getAllApks = async (ctx: Context) => {
        try {
            let result;
            try {
                result = await AndroidApk.find({});
            } catch (findError) {
                // If collection doesn't exist yet, return empty array
                if (findError instanceof Error && findError.message.includes("document not found")) {
                    return ctx.json({
                        success: true,
                        message: "No APK files found (collection not created yet)",
                        data: []
                    });
                }
                throw findError;
            }
            
            // Convert Ottoman result to array if needed
            const apks = Array.isArray(result) ? result : result.rows || [];

            return ctx.json({
                success: true,
                message: "APK files retrieved successfully",
                data: apks.map(apk => ({
                    id: apk.id,
                    packageName: apk.packageName,
                    version: apk.version,
                    uploadDate: apk.uploadDate,
                    fileSize: apk.fileSize,
                    downloadUrl: apk.filePath
                }))
            });

        } catch (error) {
            log(`Error fetching APKs: ${error}`, LogTypes.ERROR, "APK Controller");
            return ctx.json({
                success: false,
                message: "Internal server error while fetching APKs",
            }, 500);
        }
    };

    /**
     * Get APK by package name
     */
    public static readonly getApkByPackageName = async (ctx: Context) => {
        try {
            const { packageName } = ctx.req.param();

            if (!packageName) {
                return ctx.json({
                    success: false,
                    message: "Package name is required",
                }, 400);
            }

            let result;
            try {
                result = await AndroidApk.find({ packageName });
            } catch (findError) {
                // If collection doesn't exist yet, return not found
                if (findError instanceof Error && findError.message.includes("document not found")) {
                    return ctx.json({
                        success: false,
                        message: "No APK found with this package name",
                    }, 404);
                }
                throw findError;
            }

            const apks = Array.isArray(result) ? result : result.rows || [];

            if (!apks || apks.length === 0) {
                return ctx.json({
                    success: false,
                    message: "No APK found with this package name",
                }, 404);
            }

            return ctx.json({
                success: true,
                message: "APK files retrieved successfully",
                data: apks.map(apk => ({
                    id: apk.id,
                    packageName: apk.packageName,
                    version: apk.version,
                    uploadDate: apk.uploadDate,
                    fileSize: apk.fileSize,
                    downloadUrl: apk.filePath
                }))
            });

        } catch (error) {
            log(`Error fetching APK by package name: ${error}`, LogTypes.ERROR, "APK Controller");
            return ctx.json({
                success: false,
                message: "Internal server error while fetching APK",
            }, 500);
        }
    };

    /**
     * Get specific APK by package name and version
     */
    public static readonly getApkByPackageAndVersion = async (ctx: Context) => {
        try {
            const { packageName, version } = ctx.req.param();

            if (!packageName || !version) {
                return ctx.json({
                    success: false,
                    message: "Package name and version are required",
                }, 400);
            }

            let apk;
            try {
                apk = await AndroidApk.findOne({ packageName, version });
            } catch (findError) {
                // If collection doesn't exist yet, return not found
                if (findError instanceof Error && findError.message.includes("document not found")) {
                    return ctx.json({
                        success: false,
                        message: "APK not found",
                    }, 404);
                }
                throw findError;
            }

            if (!apk) {
                return ctx.json({
                    success: false,
                    message: "APK not found",
                }, 404);
            }

            return ctx.json({
                success: true,
                message: "APK retrieved successfully",
                data: {
                    id: apk.id,
                    packageName: apk.packageName,
                    version: apk.version,
                    uploadDate: apk.uploadDate,
                    fileSize: apk.fileSize,
                    downloadUrl: apk.filePath
                }
            });

        } catch (error) {
            log(`Error fetching APK: ${error}`, LogTypes.ERROR, "APK Controller");
            return ctx.json({
                success: false,
                message: "Internal server error while fetching APK",
            }, 500);
        }
    };

    /**
     * Get latest version of APK by package name
     */
    public static readonly getLatestApkByPackageName = async (ctx: Context) => {
        try {
            const { packageName } = ctx.req.param();

            if (!packageName) {
                return ctx.json({
                    success: false,
                    message: "Package name is required",
                }, 400);
            }

            const result = await AndroidApk.find({ packageName });
            const apks = Array.isArray(result) ? result : result.rows || [];

            if (!apks || apks.length === 0) {
                return ctx.json({
                    success: false,
                    message: "No APK found with this package name",
                }, 404);
            }

            // Sort by upload date to get the latest
            const latestApk = apks.sort((a, b) => 
                new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
            )[0];

            return ctx.json({
                success: true,
                message: "Latest APK retrieved successfully",
                data: {
                    id: latestApk.id,
                    packageName: latestApk.packageName,
                    version: latestApk.version,
                    uploadDate: latestApk.uploadDate,
                    fileSize: latestApk.fileSize,
                    downloadUrl: latestApk.filePath
                }
            });

        } catch (error) {
            log(`Error fetching latest APK: ${error}`, LogTypes.ERROR, "APK Controller");
            return ctx.json({
                success: false,
                message: "Internal server error while fetching latest APK",
            }, 500);
        }
    };

    /**
     * Delete APK by ID
     */
    public static readonly deleteApk = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            if (!id) {
                return ctx.json({
                    success: false,
                    message: "APK ID is required",
                }, 400);
            }

            const apk = await AndroidApk.findById(id);

            if (!apk) {
                return ctx.json({
                    success: false,
                    message: "APK not found",
                }, 404);
            }

            await AndroidApk.removeById(id);

            log(`APK deleted successfully: ${apk.packageName} v${apk.version}`, LogTypes.LOGS, "APK Controller");

            return ctx.json({
                success: true,
                message: "APK deleted successfully",
            });

        } catch (error) {
            log(`Error deleting APK: ${error}`, LogTypes.ERROR, "APK Controller");
            return ctx.json({
                success: false,
                message: "Internal server error while deleting APK",
            }, 500);
        }
    };

    /**
     * Download APK file - redirects to the S3 URL
     */
    public static readonly downloadApk = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            if (!id) {
                return ctx.json({
                    success: false,
                    message: "APK ID is required",
                }, 400);
            }

            const apk = await AndroidApk.findById(id);

            if (!apk) {
                return ctx.json({
                    success: false,
                    message: "APK not found",
                }, 404);
            }

            // Redirect to the S3 URL for download
            return ctx.redirect(apk.filePath);

        } catch (error) {
            log(`Error downloading APK: ${error}`, LogTypes.ERROR, "APK Controller");
            return ctx.json({
                success: false,
                message: "Internal server error while downloading APK",
            }, 500);
        }
    };
}
