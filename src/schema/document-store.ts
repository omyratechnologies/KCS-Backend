import z from "zod";

import "zod-openapi/extend";

// Schema for document store data
export const documentStoreSchema = z
    .object({
        id: z.string().openapi({ example: "doc123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        document_name: z.string().openapi({ example: "Student Certificate" }),
        document_type: z.string().openapi({ example: "certificate" }),
        document_meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { format: "pdf", size: "1.2MB" } }),
        issued_to: z.string().openapi({ example: "student123" }),
        issuer_id: z.string().openapi({ example: "admin456" }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "DocumentStore" });

// Create Document Store Request
export const createDocumentStoreRequestBodySchema = z
    .object({
        document_name: z.string().openapi({ example: "Student Certificate" }),
        document_type: z.string().openapi({ example: "certificate" }),
        document_meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { format: "pdf", size: "1.2MB" } }),
        issued_to: z.string().openapi({ example: "student123" }),
        issuer_id: z.string().openapi({ example: "admin456" }),
    })
    .openapi({ ref: "CreateDocumentStoreRequest" });

export const createDocumentStoreResponseSchema = documentStoreSchema.openapi({
    ref: "CreateDocumentStoreResponse",
});

// Update Document Store Request
export const updateDocumentStoreRequestBodySchema = z
    .object({
        document_name: z
            .string()
            .optional()
            .openapi({ example: "Updated Student Certificate" }),
        document_type: z
            .string()
            .optional()
            .openapi({ example: "certificate" }),
        document_meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: { format: "pdf", size: "1.5MB", updated: true },
            }),
        issued_to: z.string().optional().openapi({ example: "student123" }),
        issuer_id: z.string().optional().openapi({ example: "admin789" }),
    })
    .openapi({ ref: "UpdateDocumentStoreRequest" });

export const updateDocumentStoreResponseSchema = documentStoreSchema.openapi({
    ref: "UpdateDocumentStoreResponse",
});

// Get Document Stores Response
export const getDocumentStoresResponseSchema = z
    .array(documentStoreSchema)
    .openapi({ ref: "GetDocumentStoresResponse" });

// Delete Document Store Response
export const deleteDocumentStoreResponseSchema = documentStoreSchema.openapi({
    ref: "DeleteDocumentStoreResponse",
});

// Error Response
export const errorResponseSchema = z
    .object({
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
