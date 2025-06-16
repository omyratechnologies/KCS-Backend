import { IUploadData, Upload } from "@/models/upload.model";

export class UploadService {
    // Upload a File
    public static readonly createUpload = async (
        campus_id: string,
        user_id: string,
        file_data: Partial<IUploadData>
    ) => {
        return await Upload.create({
            campus_id,
            user_id,
            ...file_data,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // Get All Files by User ID
    public static readonly getFilesByUserId = async (user_id: string) => {
        const uploads: {
            rows: IUploadData[];
        } = await Upload.find(
            { user_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (uploads.rows.length === 0) {
            return [];
        }

        return uploads.rows;
    };

    // Get All Files by Campus ID
    public static readonly getFilesByCampusId = async (campus_id: string) => {
        const uploads: {
            rows: IUploadData[];
        } = await Upload.find(
            { campus_id },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (uploads.rows.length === 0) {
            return [];
        }

        return uploads.rows;
    };

    // Get File by ID
    public static readonly getFileById = async (id: string) => {
        return await Upload.findById(id);
    };
}
