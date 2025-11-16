import z from "zod";

import "zod-openapi/extend";

// Schema for label data
export const labelSchema = z
    .object({
        id: z.string().openapi({ example: "label_123" }),
        campus_id: z.string().openapi({ example: "campus_123" }),
        name: z.string().openapi({ example: "Important" }),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).openapi({ example: "#FF5733" }),
        updated_by: z.string().openapi({ example: "user_123" }),
        created_at: z.string().openapi({ example: "2024-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2024-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Label" });

// Create Label Request
export const createLabelRequestBodySchema = z
    .object({
        name: z.string().min(1).max(50).openapi({ example: "Important" }),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).openapi({ example: "#FF5733" }),
    })
    .openapi({ ref: "CreateLabelRequest" });

export const createLabelResponseSchema = labelSchema.openapi({
    ref: "CreateLabelResponse",
});

// Update Label Request
export const updateLabelRequestBodySchema = z
    .object({
        name: z.string().min(1).max(50).optional().openapi({ example: "Very Important" }),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().openapi({ example: "#00FF00" }),
    })
    .openapi({ ref: "UpdateLabelRequest" });

export const updateLabelResponseSchema = labelSchema.openapi({
    ref: "UpdateLabelResponse",
});

// Get Labels Response
export const getLabelsResponseSchema = z.array(labelSchema).openapi({ ref: "GetLabelsResponse" });

// Delete Label Response
export const deleteLabelResponseSchema = z
    .object({
        message: z.string().openapi({ example: "Label deleted successfully" }),
    })
    .openapi({ ref: "DeleteLabelResponse" });
