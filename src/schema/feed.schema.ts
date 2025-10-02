import { z } from "zod";

// Feed Types
export const FeedTypeSchema = z.enum([
    "Announcement",
    "Assignment", 
    "Event",
    "Discussion",
    "Achievement",
    "Resource",
    "Poll"
]);

export const FeedVisibilitySchema = z.enum([
    "public",
    "class", 
    "campus",
    "private"
]);

export const UserTypeSchema = z.enum([
    "Student",
    "Teacher",
    "Admin",
    "Super Admin"
]);

// Attachment Schema
export const AttachmentSchema = z.object({
    url: z.string().url(),
    filename: z.string().min(1),
    file_type: z.string().min(1),
    file_size: z.number().positive()
});

// Metadata Schema for different feed types
export const FeedMetadataSchema = z.object({
    assignment_due_date: z.string().datetime().optional(),
    event_date: z.string().datetime().optional(),
    event_location: z.string().optional(),
    poll_options: z.array(z.string()).optional(),
    poll_multiple_choice: z.boolean().optional(),
    poll_expires_at: z.string().datetime().optional(),
    resource_url: z.string().url().optional()
}).optional();

// Create Feed Schema
export const CreateFeedSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1, "Content is required"),
    type: FeedTypeSchema,
    class_id: z.string().optional(),
    subject_id: z.string().optional(),
    visibility: FeedVisibilitySchema.default("public"),
    tags: z.array(z.string()).default([]),
    attachments: z.array(AttachmentSchema).default([]),
    metadata: FeedMetadataSchema.default({})
}).refine((data) => {
    // Poll validation
    if (data.type === "Poll") {
        if (!data.metadata?.poll_options || data.metadata.poll_options.length < 2) {
            return false;
        }
    }
    return true;
}, {
    message: "Poll must have at least 2 options",
    path: ["metadata", "poll_options"]
});

// Update Feed Schema
export const UpdateFeedSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1).optional(),
    visibility: FeedVisibilitySchema.optional(),
    tags: z.array(z.string()).optional(),
    attachments: z.array(AttachmentSchema).optional(),
    metadata: FeedMetadataSchema.optional()
});

// Get Feeds Query Schema
export const GetFeedsQuerySchema = z.object({
    type: FeedTypeSchema.optional(),
    visibility: FeedVisibilitySchema.optional(),
    class_id: z.string().optional(),
    author_id: z.string().optional(),
    tags: z.string().optional(), // Comma-separated string
    page: z.string().transform(Number).default("1"),
    limit: z.string().transform(Number).default("20"),
    include_deleted: z.string().transform((val) => val === "true").default("false")
});

// Create Comment Schema
export const CreateCommentSchema = z.object({
    content: z.string().min(1, "Content is required"),
    parent_comment_id: z.string().optional(),
    attachments: z.array(AttachmentSchema).default([])
});

// Update Comment Schema
export const UpdateCommentSchema = z.object({
    content: z.string().min(1).optional(),
    attachments: z.array(AttachmentSchema).optional()
});

// Get Comments Query Schema
export const GetCommentsQuerySchema = z.object({
    parent_comment_id: z.string().optional(),
    page: z.string().transform(Number).default("1"),
    limit: z.string().transform(Number).default("20")
});

// Poll Vote Schema
export const PollVoteSchema = z.object({
    selected_options: z.array(z.string()).min(1, "At least one option must be selected")
});

// Bookmark Query Schema
export const BookmarkQuerySchema = z.object({
    page: z.string().transform(Number).default("1"),
    limit: z.string().transform(Number).default("20")
});

export type CreateFeedInput = z.infer<typeof CreateFeedSchema>;
export type UpdateFeedInput = z.infer<typeof UpdateFeedSchema>;
export type GetFeedsQuery = z.infer<typeof GetFeedsQuerySchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;
export type GetCommentsQuery = z.infer<typeof GetCommentsQuerySchema>;
export type PollVoteInput = z.infer<typeof PollVoteSchema>;
export type BookmarkQuery = z.infer<typeof BookmarkQuerySchema>;
