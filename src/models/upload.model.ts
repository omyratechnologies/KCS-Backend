import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IUploadData {
    id: string;
    campus_id: string;
    user_id: string;
    original_file_name: string;
    stored_file_name: string;
    file_size: number;
    file_type: string;
    s3_url: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const UploadSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    original_file_name: { type: String, required: true },
    stored_file_name: { type: String, required: true },
    file_size: { type: Number, required: true },
    file_type: { type: String, required: true },
    s3_url: { type: String, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

UploadSchema.index.findByCampusId = { by: "campus_id" };
UploadSchema.index.findByUserId = { by: "user_id" };
UploadSchema.index.findByFileName = { by: "original_file_name" };

const Upload = ottoman.model<IUploadData>("uploads", UploadSchema);

export { type IUploadData, Upload };
