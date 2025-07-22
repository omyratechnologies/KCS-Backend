import { S3Client } from "bun";
import { nanoid } from "napi-nanoid";

import log, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

export class UploadFactory {
    private static instance: UploadFactory;
    private static client: S3Client;

    public static getInstance(): UploadFactory {
        if (!UploadFactory.instance) {
            UploadFactory.instance = new UploadFactory();
        }
        return UploadFactory.instance;
    }

    public static createUploadClient() {
        if (!UploadFactory.client) {
            UploadFactory.client = new S3Client({
                accessKeyId: config.R2_ACCESS_KEY_ID,
                secretAccessKey: config.R2_SECRET_ACCESS_KEY,
                region: config.R2_REGION,
                bucket: config.R2_BUCKET,
                endpoint: config.R2_ENDPOINT,
            });
            log("R2 Client created", LogTypes.LOGS, "S3 Uploader");
        }
    }

    public static readonly upload = async (file: File) => {
        try {
            log(`Starting file upload: ${file.name}, size: ${file.size}`, LogTypes.LOGS, "S3 Uploader");
            
            const file_name = `${nanoid()}-${file.name}`;
            const file_data = this.client.file(file_name);
            const buffer = await file.arrayBuffer();
            
            log("File converted to buffer, uploading to S3...", LogTypes.LOGS, "S3 Uploader");
            
            await file_data.write(buffer, {
                acl: "public-read",
                type: file.type,
            });

            const url = config.R2_BUCKET_URL + file_name;
            log(`File uploaded successfully: ${url}`, LogTypes.LOGS, "S3 Uploader");

            return {
                file_name,
                url,
            };
        } catch (error) {
            log(`Error uploading file to S3: ${error}`, LogTypes.ERROR, "S3 Uploader");
            throw error;
        }
    };
}
