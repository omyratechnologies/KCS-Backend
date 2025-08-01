import { z } from "zod";

// ==================== COURSE SCHEMAS ====================

export const createCourseRequestBodySchema = z.object({
    course_title: z.string().min(1, "Course title is required"),
    course_description: z.string().min(1, "Course description is required"),
    course_thumbnail: z.string().optional(),
    instructor_name: z.string().min(1, "Instructor name is required"),
    course_category: z.string().min(1, "Course category is required"),
    course_subcategory: z.string().optional(),
    pricing: z.object({
        type: z.enum(["free", "paid", "subscription"]),
        price: z.number().optional(),
        currency: z.string().optional(),
        discount_percentage: z.number().optional(),
    }).optional(),
    course_settings: z.object({
        language: z.string().optional(),
        skill_level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
        estimated_duration: z.number().optional(),
        has_certificate: z.boolean().optional(),
        allow_preview: z.boolean().optional(),
    }).optional(),
    meta_data: z.object({
        tags: z.array(z.string()).optional(),
        course_objectives: z.array(z.string()).optional(),
        requirements: z.array(z.string()).optional(),
        target_audience: z.array(z.string()).optional(),
    }).optional(),
});

export const updateCourseRequestBodySchema = z.object({
    course_title: z.string().optional(),
    course_description: z.string().optional(),
    course_thumbnail: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    is_featured: z.boolean().optional(),
    pricing: z.object({
        type: z.enum(["free", "paid", "subscription"]),
        price: z.number().optional(),
        currency: z.string().optional(),
        discount_percentage: z.number().optional(),
    }).optional(),
    course_settings: z.object({
        language: z.string().optional(),
        skill_level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
        estimated_duration: z.number().optional(),
        has_certificate: z.boolean().optional(),
        allow_preview: z.boolean().optional(),
    }).optional(),
});

// ==================== COURSE CONTENT SCHEMAS ====================

export const createCourseContentRequestBodySchema = z.object({
    section_id: z.string().optional(),
    section_title: z.string().min(1, "Section title is required"),
    section_description: z.string().optional(),
    section_order: z.number().min(1),
    lecture_title: z.string().min(1, "Lecture title is required"),
    lecture_description: z.string().min(1, "Lecture description is required"),
    lecture_order: z.number().min(1),
    content_type: z.enum(["video", "text", "quiz", "assignment", "resource", "live_session", "download"]),
    content_format: z.enum(["video", "text", "audio", "document", "pdf", "link", "interactive"]),
    content_data: z.object({
        video_url: z.string().optional(),
        video_duration: z.number().optional(),
        text_content: z.string().optional(),
        file_url: z.string().optional(),
        preview_available: z.boolean(),
    }),
    resources: z.array(z.object({
        file_name: z.string(),
        file_url: z.string(),
        file_type: z.string(),
        file_size: z.number(),
        is_downloadable: z.boolean(),
    })).optional(),
});

export const updateCourseContentRequestBodySchema = z.object({
    section_title: z.string().optional(),
    section_description: z.string().optional(),
    lecture_title: z.string().optional(),
    lecture_description: z.string().optional(),
    content_data: z.object({
        video_url: z.string().optional(),
        video_duration: z.number().optional(),
        text_content: z.string().optional(),
        file_url: z.string().optional(),
        preview_available: z.boolean().optional(),
    }).optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
});

// ==================== ENROLLMENT SCHEMAS ====================

export const enrollInCourseRequestBodySchema = z.object({
    enrollment_type: z.enum(["free", "paid", "scholarship"]).optional(),
    payment_info: z.object({
        transaction_id: z.string().optional(),
        payment_method: z.string().optional(),
        amount_paid: z.number().optional(),
        currency: z.string().optional(),
    }).optional(),
    access_settings: z.object({
        can_download: z.boolean().optional(),
        can_certificate: z.boolean().optional(),
    }).optional(),
});

// ==================== PROGRESS SCHEMAS ====================

export const updateProgressRequestBodySchema = z.object({
    watch_time: z.number().min(0),
    completion_percentage: z.number().min(0).max(100),
    is_completed: z.boolean().optional(),
    section_id: z.string().optional(),
});

// ==================== NOTES SCHEMAS ====================

export const createNoteRequestBodySchema = z.object({
    note_title: z.string().optional(),
    note_content: z.string().min(1, "Note content is required"),
    note_type: z.enum(["text", "highlight", "bookmark", "question", "reminder"]).optional(),
    timestamp: z.number().optional(),
    context_data: z.object({
        section_title: z.string().optional(),
        lecture_title: z.string().optional(),
        content_type: z.string().optional(),
    }).optional(),
});

// ==================== DISCUSSION SCHEMAS ====================

export const createDiscussionRequestBodySchema = z.object({
    discussion_title: z.string().optional(),
    discussion_content: z.string().min(1, "Discussion content is required"),
    discussion_type: z.enum(["question", "general", "announcement", "feedback"]).optional(),
    content_id: z.string().optional(),
    parent_discussion_id: z.string().optional(),
});

// ==================== RESPONSE SCHEMAS ====================

export const successResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    message: z.string(),
});

export const errorResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    error: z.string().optional(),
});
