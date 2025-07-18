// eslint-disable-next-line simple-import-sort/imports
import { Context } from "hono";

import { UploadFactory } from "@/libs/s3/upload.factory";
import { IUploadData } from "@/models/upload.model";
import { UploadService } from "@/services/upload.service";

export class UploadController {
    public static readonly createUpload = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { file } = await ctx.req.parseBody();

            if (!file || typeof file === "string") {
                return ctx.json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const s3Data = await UploadFactory.upload(file);

            const fileData: Partial<IUploadData> = {
                file_size: file.size,
                file_type: file.type,
                original_file_name: file.name,
                stored_file_name: s3Data.file_name,
                s3_url: s3Data.url,
                meta_data: {},
            };

            const upload = await UploadService.createUpload(
                campus_id,
                user_id,
                fileData
            );

            return ctx.json(upload);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly getUploads = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");

            const uploads = await UploadService.getFilesByUserId(user_id);

            return ctx.json(uploads);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly getUpload = async (ctx: Context) => {
        try {
            const upload_id = ctx.req.param("upload_id");

            const upload = await UploadService.getFileById(upload_id);

            return ctx.json(upload);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly getUploadByCampus = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const upload = await UploadService.getFilesByCampusId(campus_id);

            return ctx.json(upload);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };
}
