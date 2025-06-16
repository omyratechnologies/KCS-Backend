import z from "zod";

import "zod-openapi/extend";

// Schema for campus data (common fields returned in responses)
export const campusSchema = z
    .object({
        id: z.string().openapi({ example: "campus123" }),
        name: z.string().openapi({ example: "Main Campus" }),
        address: z.string().openapi({ example: "123 Education Ave, City" }),
        domain: z.string().openapi({ example: "maincampus.edu" }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { region: "North", capacity: 1000 } }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Campus" });

// Create Campus Request
export const createCampusRequestBodySchema = z
    .object({
        name: z.string().openapi({ example: "Main Campus" }),
        address: z.string().openapi({ example: "123 Education Ave, City" }),
        domain: z.string().openapi({ example: "maincampus.edu" }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { region: "North", capacity: 1000 } }),
    })
    .openapi({ ref: "CreateCampusRequest" });

export const createCampusResponseSchema = campusSchema.openapi({
    ref: "CreateCampusResponse",
});

// Get Campuses Response
export const getCampusesResponseSchema = z
    .array(campusSchema)
    .openapi({ ref: "GetCampusesResponse" });

// Get Campus Response
export const getCampusResponseSchema = campusSchema.openapi({
    ref: "GetCampusResponse",
});

// Update Campus Request
export const updateCampusRequestBodySchema = z
    .object({
        name: z.string().optional().openapi({ example: "Main Campus" }),
        address: z
            .string()
            .optional()
            .openapi({ example: "123 Education Ave, City" }),
        domain: z.string().optional().openapi({ example: "maincampus.edu" }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({ example: { region: "North", capacity: 1000 } }),
        is_active: z.boolean().optional().openapi({ example: true }),
        is_deleted: z.boolean().optional().openapi({ example: false }),
    })
    .openapi({ ref: "UpdateCampusRequest" });

export const updateCampusResponseSchema = z
    .object({
        message: z
            .string()
            .openapi({ example: "Campuses updated successfully" }),
    })
    .openapi({ ref: "UpdateCampusResponse" });

// Delete Campus Response
export const deleteCampusResponseSchema = z
    .object({
        message: z
            .string()
            .openapi({ example: "Campuses deleted successfully" }),
    })
    .openapi({ ref: "DeleteCampusResponse" });
