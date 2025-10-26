import { z } from "zod";

// ==================== Chat Room Schemas ====================

export const createPersonalChatSchema = z.object({
    recipient_id: z.string().min(1, "Recipient ID is required"),
});

export const createGroupChatSchema = z.object({
    room_type: z.enum(["class_group", "subject_group", "custom_group"]),
    name: z.string().min(1, "Group name is required").max(100, "Group name too long"),
    description: z.string().max(500, "Description too long").optional(),
    members: z.array(z.string()).min(1, "At least one member is required"),
    class_id: z.string().optional(),
    subject_id: z.string().optional(),
});

// ==================== Message Schemas ====================

export const sendMessageSchema = z.object({
    content: z.string().min(1, "Message content is required").max(10000, "Message too long"),
    message_type: z.enum(["text", "image", "file", "audio", "system"]).default("text"),
    file_url: z.string().url("Invalid file URL").optional(),
    file_name: z.string().max(255).optional(),
    file_size: z.number().positive().optional(),
    reply_to: z.string().optional(),
});

export const editMessageSchema = z.object({
    content: z.string().min(1, "Message content is required").max(10000, "Message too long"),
});

export const reactionEmojiSchema = z.string().min(1).max(10, "Invalid emoji");

// ==================== Query Parameter Schemas ====================

export const getMessagesQuerySchema = z.object({
    room_id: z.string().optional(),
    recipient_id: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).default("50"),
});

export const searchMessagesQuerySchema = z.object({
    q: z.string().optional(), // search query
    room_id: z.string().optional(),
    sender_id: z.string().optional(),
    message_type: z.enum(["text", "image", "file", "audio", "system"]).optional(),
    from_date: z.string().datetime().optional(),
    to_date: z.string().datetime().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).default("50"),
});

export const getUnreadCountQuerySchema = z.object({
    room_id: z.string().optional(),
});

// ==================== Validation Schemas ====================

export const validatePersonalMessageSchema = z.object({
    recipient_id: z.string().min(1, "Recipient ID is required"),
});

export const validateGroupCreationSchema = z.object({
    room_type: z.enum(["class_group", "subject_group", "custom_group"]),
    class_id: z.string().optional(),
    subject_id: z.string().optional(),
    members: z.array(z.string()).min(1, "At least one member is required"),
});

// ==================== Type Exports ====================

export type CreatePersonalChatInput = z.infer<typeof createPersonalChatSchema>;
export type CreateGroupChatInput = z.infer<typeof createGroupChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type SearchMessagesQuery = z.infer<typeof searchMessagesQuerySchema>;
export type GetUnreadCountQuery = z.infer<typeof getUnreadCountQuerySchema>;
export type ValidatePersonalMessageInput = z.infer<typeof validatePersonalMessageSchema>;
export type ValidateGroupCreationInput = z.infer<typeof validateGroupCreationSchema>;

