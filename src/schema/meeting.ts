import z from "zod";

import "zod-openapi/extend";

// Schema for meeting data
export const meetingSchema = z
    .object({
        id: z.string().openapi({ example: "meeting123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        creator_id: z.string().openapi({ example: "user123" }),
        participants: z
            .array(z.string())
            .openapi({ example: ["user1", "user2", "user3"] }),
        meeting_name: z.string().openapi({ example: "Weekly Staff Meeting" }),
        meeting_description: z
            .string()
            .openapi({
                example:
                    "Discussion about upcoming events and curriculum changes",
            }),
        meeting_start_time: z
            .string()
            .openapi({ example: "2023-05-15T10:00:00Z" }),
        meeting_end_time: z
            .string()
            .openapi({ example: "2023-05-15T11:30:00Z" }),
        meeting_location: z.string().openapi({ example: "Conference Room A" }),
        meeting_meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                virtual: false,
                recurring: true,
                frequency: "weekly",
                meeting_link: "",
                meeting_id: "",
                meeting_password: "",
            },
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
    })
    .openapi({ ref: "Meeting" });

// Create Meeting Request
export const createMeetingRequestBodySchema = z
    .object({
        participants: z
            .array(z.string())
            .openapi({ example: ["user1", "user2", "user3"] }),
        meeting_name: z.string().openapi({ example: "Weekly Staff Meeting" }),
        meeting_description: z
            .string()
            .openapi({
                example:
                    "Discussion about upcoming events and curriculum changes",
            }),
        meeting_start_time: z
            .string()
            .openapi({ example: "2023-05-15T10:00:00Z" }),
        meeting_end_time: z
            .string()
            .openapi({ example: "2023-05-15T11:30:00Z" }),
        meeting_location: z.string().openapi({ example: "Conference Room A" }),
        meeting_meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                virtual: false,
                recurring: true,
                frequency: "weekly",
            },
        }),
    })
    .openapi({ ref: "CreateMeetingRequest" });

export const createMeetingResponseSchema = meetingSchema.openapi({
    ref: "CreateMeetingResponse",
});

// Update Meeting Request
export const updateMeetingRequestBodySchema = z
    .object({
        participants: z
            .array(z.string())
            .optional()
            .openapi({ example: ["user1", "user2", "user3", "user4"] }),
        meeting_name: z
            .string()
            .optional()
            .openapi({ example: "Updated Staff Meeting" }),
        meeting_description: z
            .string()
            .optional()
            .openapi({ example: "Updated discussion topics" }),
        meeting_start_time: z
            .string()
            .optional()
            .openapi({ example: "2023-05-15T10:30:00Z" }),
        meeting_end_time: z
            .string()
            .optional()
            .openapi({ example: "2023-05-15T12:00:00Z" }),
        meeting_location: z
            .string()
            .optional()
            .openapi({ example: "Conference Room B" }),
        meeting_meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    virtual: true,
                    recurring: true,
                    frequency: "weekly",
                    meeting_link: "https://zoom.us/j/123456789",
                    meeting_id: "123456789",
                    meeting_password: "password",
                },
            }),
        is_active: z.boolean().optional().openapi({ example: true }),
        is_deleted: z.boolean().optional().openapi({ example: false }),
    })
    .openapi({ ref: "UpdateMeetingRequest" });

export const updateMeetingResponseSchema = meetingSchema.openapi({
    ref: "UpdateMeetingResponse",
});

// Get Meetings Response
export const getMeetingsResponseSchema = z
    .array(meetingSchema)
    .openapi({ ref: "GetMeetingsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
