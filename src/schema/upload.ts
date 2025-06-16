import z from "zod";

import "zod-openapi/extend";

// Schema for upload data
export const uploadSchema = z
    .object({
        id: z.string().openapi({ example: "upload123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        user_id: z.string().openapi({ example: "user456" }),
        original_file_name: z.string().openapi({ example: "assignment.pdf" }),
        stored_file_name: z
            .string()
            .openapi({ example: "1234567890_assignment.pdf" }),
        file_size: z.number().openapi({ example: 1024 }),
        file_type: z.string().openapi({ example: "application/pdf" }),
        s3_url: z
            .string()
            .openapi({
                example:
                    "https://s3.amazonaws.com/bucket/1234567890_assignment.pdf",
            }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                uploadedBy: "John Doe",
                category: "assignment",
                description: "Math assignment for Grade 10",
            },
        }),
        created_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
    })
    .openapi({ ref: "Upload" });

// Create Upload Response
export const createUploadResponseSchema = uploadSchema.openapi({
    ref: "CreateUploadResponse",
});

// Get Uploads Response
export const getUploadsResponseSchema = z
    .array(uploadSchema)
    .openapi({ ref: "GetUploadsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "No file uploaded" }),
    })
    .openapi({ ref: "ErrorResponse" });
