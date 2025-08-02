import z from "zod";
import "zod-openapi/extend";

// ==================== COURSE SCHEMAS ====================

export const createCourseRequestBodySchema = z.object({
    title: z.string().min(1).max(200).openapi({ example: "Technical Analysis Mastery" }),
    description: z.string().min(10).max(5000).openapi({ 
        example: "Complete course on technical analysis covering candlestick patterns, chart analysis, and trading strategies" 
    }),
    short_description: z.string().max(500).optional().openapi({ 
        example: "Master technical analysis with live chart examples" 
    }),
    class_id: z.string().openapi({ example: "class_123" }),
    instructor_ids: z.array(z.string()).default([]).openapi({ 
        example: ["user_123", "user_456"] 
    }),
    thumbnail: z.string().url().optional().openapi({ 
        example: "https://example.com/thumbnail.jpg" 
    }),
    preview_video: z.string().url().optional().openapi({ 
        example: "https://example.com/preview.mp4" 
    }),
    category: z.string().openapi({ example: "Finance" }),
    sub_category: z.string().optional().openapi({ example: "Trading" }),
    difficulty_level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
    language: z.string().default("English"),
    estimated_duration_hours: z.number().positive().optional(),
    price: z.number().min(0).default(0),
    discount_price: z.number().min(0).optional(),
    currency: z.string().default("USD"),
    requirements: z.array(z.string()).default([]),
    learning_objectives: z.array(z.string()).default([]),
    target_audience: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    is_featured: z.boolean().default(false),
    is_certificate_enabled: z.boolean().default(true),
    max_enrollments: z.number().positive().optional(),
    enrollment_start_date: z.string().trim().transform(val => val === "" ? undefined : val).pipe(z.string().datetime()).optional(),
    enrollment_end_date: z.string().trim().transform(val => val === "" ? undefined : val).pipe(z.string().datetime()).optional(),
    course_start_date: z.string().trim().transform(val => val === "" ? undefined : val).pipe(z.string().datetime()).optional(),
    course_end_date: z.string().trim().transform(val => val === "" ? undefined : val).pipe(z.string().datetime()).optional(),
    meta_data: z.object({
        seo_keywords: z.array(z.string()).optional(),
        seo_description: z.string().optional(),
        promotional_video: z.string().url().optional(),
        course_outcomes: z.array(z.string()).optional(),
        course_features: z.array(z.string()).optional(),
        instructor_bio: z.string().optional(),
        settings: z.object({
            allow_downloads: z.boolean().default(true),
            allow_discussions: z.boolean().default(true),
            auto_enroll: z.boolean().default(false),
            send_notifications: z.boolean().default(true),
            drip_content: z.boolean().default(false),
            content_protection: z.boolean().default(true),
        }).optional(),
    }).default({}),
}).openapi({ ref: "createCourseRequestBody" });

export const updateCourseRequestBodySchema = createCourseRequestBodySchema.partial().extend({
    status: z.enum(["draft", "published", "archived", "suspended"]).optional(),
}).openapi({ ref: "updateCourseRequestBody" });

export const courseResponseSchema = z.object({
    id: z.string(),
    campus_id: z.string(),
    title: z.string(),
    description: z.string(),
    short_description: z.string().optional(),
    class_id: z.string(),
    created_by: z.string(),
    instructor_ids: z.array(z.string()),
    thumbnail: z.string().optional(),
    preview_video: z.string().optional(),
    status: z.enum(["draft", "published", "archived", "suspended"]),
    category: z.string(),
    sub_category: z.string().optional(),
    difficulty_level: z.enum(["beginner", "intermediate", "advanced"]),
    language: z.string(),
    estimated_duration_hours: z.number().optional(),
    price: z.number(),
    discount_price: z.number().optional(),
    currency: z.string(),
    requirements: z.array(z.string()),
    learning_objectives: z.array(z.string()),
    target_audience: z.array(z.string()),
    tags: z.array(z.string()),
    rating: z.number(),
    rating_count: z.number(),
    enrollment_count: z.number(),
    completion_count: z.number(),
    is_featured: z.boolean(),
    is_certificate_enabled: z.boolean(),
    certificate_template_id: z.string().optional(),
    max_enrollments: z.number().optional(),
    enrollment_start_date: z.string().datetime().optional(),
    enrollment_end_date: z.string().datetime().optional(),
    course_start_date: z.string().datetime().optional(),
    course_end_date: z.string().datetime().optional(),
    last_updated_by: z.string(),
    version: z.number(),
    meta_data: z.object({}),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
}).openapi({ ref: "courseResponse" });

export const coursesListResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        courses: z.array(courseResponseSchema),
        pagination: z.object({
            current_page: z.number(),
            per_page: z.number(),
            total_items: z.number(),
            total_pages: z.number(),
            has_next: z.boolean(),
            has_previous: z.boolean(),
        }),
        filters_applied: z.object({
            status: z.string().optional(),
            category: z.string().optional(),
            difficulty_level: z.string().optional(),
            price_range: z.string().optional(),
            search_query: z.string().optional(),
        }),
        summary: z.object({
            total_courses: z.number(),
            published_courses: z.number(),
            draft_courses: z.number(),
            featured_courses: z.number(),
            free_courses: z.number(),
            paid_courses: z.number(),
        }),
    }),
    message: z.string(),
}).openapi({ ref: "coursesListResponse" });

// ==================== COURSE SECTION SCHEMAS ====================

export const createCourseSectionRequestBodySchema = z.object({
    title: z.string().min(1).max(200).openapi({ example: "Course Introduction" }),
    description: z.string().max(1000).optional().openapi({ 
        example: "Welcome to the course and overview of what you'll learn" 
    }),
    section_order: z.number().positive(),
    is_preview: z.boolean().default(false),
    estimated_duration_minutes: z.number().min(0).default(0),
    is_published: z.boolean().default(true),
    meta_data: z.object({
        learning_objectives: z.array(z.string()).optional(),
        section_notes: z.string().optional(),
        required_resources: z.array(z.string()).optional(),
        completion_criteria: z.string().optional(),
    }).default({}),
}).openapi({ ref: "createCourseSectionRequestBody" });

export const updateCourseSectionRequestBodySchema = createCourseSectionRequestBodySchema.partial()
    .openapi({ ref: "updateCourseSectionRequestBody" });

export const courseSectionResponseSchema = z.object({
    id: z.string(),
    course_id: z.string(),
    campus_id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    section_order: z.number(),
    is_preview: z.boolean(),
    estimated_duration_minutes: z.number(),
    is_published: z.boolean(),
    meta_data: z.object({}),
    lecture_count: z.number().optional(),
    total_duration_minutes: z.number().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
}).openapi({ ref: "courseSectionResponse" });

// ==================== COURSE LECTURE SCHEMAS ====================

export const createCourseLectureRequestBodySchema = z.object({
    title: z.string().min(1).max(200).openapi({ example: "What's in this course?" }),
    description: z.string().max(1000).optional().openapi({ 
        example: "Overview of course content and learning outcomes" 
    }),
    lecture_order: z.number().positive(),
    lecture_type: z.enum(["video", "resource", "quiz", "assignment", "text", "live_session"]),
    content_data: z.object({
        // Video content
        video_url: z.string().url().optional(),
        video_duration_seconds: z.number().optional(),
        video_thumbnail: z.string().url().optional(),
        video_quality: z.array(z.object({
            quality: z.string(),
            url: z.string().url(),
            file_size_mb: z.number(),
        })).optional(),
        subtitles: z.array(z.object({
            language: z.string(),
            url: z.string().url(),
        })).optional(),
        
        // Resource content
        resource_files: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.enum(["pdf", "doc", "ppt", "excel", "image", "audio", "other"]),
            url: z.string().url(),
            file_size_mb: z.number(),
            is_downloadable: z.boolean().default(true),
            description: z.string().optional(),
        })).optional(),
        
        // Quiz content
        quiz_id: z.string().optional(),
        quiz_data: z.object({
            passing_score: z.number().min(0).max(100),
            max_attempts: z.number().positive(),
            time_limit_minutes: z.number().positive().optional(),
            show_results_immediately: z.boolean().default(true),
        }).optional(),
        
        // Assignment content
        assignment_id: z.string().optional(),
        assignment_data: z.object({
            due_date: z.string().datetime().optional(),
            max_score: z.number().positive(),
            submission_types: z.array(z.enum(["text", "file", "url"])),
        }).optional(),
        
        // Text content
        text_content: z.string().optional(),
        rich_text_content: z.string().optional(),
        
        // Live session content
        live_session_data: z.object({
            scheduled_start: z.string().datetime(),
            scheduled_end: z.string().datetime(),
            meeting_url: z.string().url().optional(),
            meeting_id: z.string().optional(),
            is_recurring: z.boolean().default(false),
            recording_url: z.string().url().optional(),
        }).optional(),
    }),
    is_preview: z.boolean().default(false),
    is_mandatory: z.boolean().default(true),
    estimated_duration_minutes: z.number().min(0).default(0),
    is_published: z.boolean().default(true),
    completion_criteria: z.object({
        auto_complete_video: z.boolean().default(true),
        manual_mark_complete: z.boolean().default(false),
        quiz_required: z.boolean().default(false),
        assignment_required: z.boolean().default(false),
        minimum_watch_percentage: z.number().min(0).max(100).default(80),
    }).default({}),
    meta_data: z.object({
        learning_notes: z.string().optional(),
        instructor_notes: z.string().optional(),
        external_links: z.array(z.object({
            title: z.string(),
            url: z.string().url(),
            description: z.string().optional(),
        })).optional(),
        downloadable_resources: z.array(z.string()).optional(),
        discussion_enabled: z.boolean().default(true),
        comments_enabled: z.boolean().default(true),
    }).default({}),
}).openapi({ ref: "createCourseLectureRequestBody" });

export const updateCourseLectureRequestBodySchema = createCourseLectureRequestBodySchema.partial()
    .openapi({ ref: "updateCourseLectureRequestBody" });

export const courseLectureResponseSchema = z.object({
    id: z.string(),
    course_id: z.string(),
    section_id: z.string(),
    campus_id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    lecture_order: z.number(),
    lecture_type: z.enum(["video", "resource", "quiz", "assignment", "text", "live_session"]),
    content_data: z.object({}),
    is_preview: z.boolean(),
    is_mandatory: z.boolean(),
    estimated_duration_minutes: z.number(),
    is_published: z.boolean(),
    completion_criteria: z.object({}),
    meta_data: z.object({}),
    user_progress: z.object({
        progress_status: z.enum(["not_started", "in_progress", "completed", "skipped"]).optional(),
        completion_percentage: z.number().optional(),
        last_accessed_at: z.string().datetime().optional(),
        resume_position_seconds: z.number().optional(),
    }).optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
}).openapi({ ref: "courseLectureResponse" });

// ==================== COURSE ENROLLMENT SCHEMAS ====================

export const enrollInCourseRequestBodySchema = z.object({
    enrollment_type: z.enum(["free", "paid", "admin_assigned", "bulk_enrollment"]).default("free"),
    payment_reference: z.string().optional(),
    referral_code: z.string().optional(),
    enrollment_source: z.enum(["web", "mobile", "admin", "api", "bulk_import"]).default("web"),
    meta_data: z.object({
        enrollment_reason: z.string().optional(),
        learning_path_id: z.string().optional(),
        cohort_id: z.string().optional(),
        custom_fields: z.record(z.any()).optional(),
    }).default({}),
}).openapi({ ref: "enrollInCourseRequestBody" });

export const courseEnrollmentResponseSchema = z.object({
    id: z.string(),
    course_id: z.string(),
    user_id: z.string(),
    campus_id: z.string(),
    enrollment_type: z.enum(["free", "paid", "admin_assigned", "bulk_enrollment"]),
    enrollment_status: z.enum(["active", "completed", "dropped", "suspended", "expired"]),
    progress_percentage: z.number(),
    enrollment_date: z.string().datetime(),
    completion_date: z.string().datetime().optional(),
    expiry_date: z.string().datetime().optional(),
    last_accessed_at: z.string().datetime().optional(),
    certificate_issued: z.boolean(),
    certificate_id: z.string().optional(),
    grade: z.number().optional(),
    completion_time_hours: z.number().optional(),
    access_details: z.object({
        total_lectures: z.number(),
        completed_lectures: z.number(),
        completed_lecture_ids: z.array(z.string()),
        current_lecture_id: z.string().optional(),
        current_section_id: z.string().optional(),
        bookmarked_lectures: z.array(z.string()),
        notes_count: z.number(),
        quiz_attempts: z.number(),
        assignment_submissions: z.number(),
    }),
    course_details: z.object({
        title: z.string(),
        thumbnail: z.string().optional(),
        instructor_name: z.string().optional(),
        total_duration_hours: z.number().optional(),
    }).optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
}).openapi({ ref: "courseEnrollmentResponse" });

// ==================== COURSE PROGRESS SCHEMAS ====================

export const updateProgressRequestBodySchema = z.object({
    progress_status: z.enum(["not_started", "in_progress", "completed", "skipped"]).optional(),
    watch_time_seconds: z.number().min(0).optional(),
    completion_percentage: z.number().min(0).max(100).optional(),
    resume_position_seconds: z.number().min(0).optional(),
    interaction_data: z.object({
        play_count: z.number().optional(),
        pause_count: z.number().optional(),
        seek_count: z.number().optional(),
        speed_changes: z.number().optional(),
        quality_changes: z.number().optional(),
        fullscreen_toggles: z.number().optional(),
        bookmarked: z.boolean().optional(),
        liked: z.boolean().optional(),
        difficulty_rating: z.number().min(1).max(5).optional(),
    }).optional(),
    device_info: z.object({
        device_type: z.enum(["web", "mobile", "tablet"]),
        browser: z.string().optional(),
        os: z.string().optional(),
        app_version: z.string().optional(),
    }).optional(),
    notes: z.array(z.object({
        timestamp_seconds: z.number().min(0),
        note_text: z.string().min(1),
        is_public: z.boolean().default(false),
    })).optional(),
}).openapi({ ref: "updateProgressRequestBody" });

export const courseProgressResponseSchema = z.object({
    id: z.string(),
    course_id: z.string(),
    user_id: z.string(),
    lecture_id: z.string(),
    campus_id: z.string(),
    progress_status: z.enum(["not_started", "in_progress", "completed", "skipped"]),
    watch_time_seconds: z.number(),
    total_duration_seconds: z.number(),
    completion_percentage: z.number(),
    first_accessed_at: z.string().datetime(),
    last_accessed_at: z.string().datetime(),
    completed_at: z.string().datetime().optional(),
    resume_position_seconds: z.number().optional(),
    interaction_data: z.object({}),
    notes: z.array(z.object({
        id: z.string(),
        timestamp_seconds: z.number(),
        note_text: z.string(),
        is_public: z.boolean(),
        created_at: z.string().datetime(),
        updated_at: z.string().datetime(),
    })),
    device_info: z.object({}),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
}).openapi({ ref: "courseProgressResponse" });

// ==================== GENERIC RESPONSE SCHEMAS ====================

export const successResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    message: z.string(),
}).openapi({ ref: "successResponse" });

export const errorResponseSchema = z.object({
    success: z.boolean().default(false),
    error: z.string(),
    details: z.any().optional(),
}).openapi({ ref: "errorResponse" });

export const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort_by: z.string().optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
}).openapi({ ref: "paginationQuery" });

// ==================== ANALYTICS SCHEMAS ====================

export const courseAnalyticsResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        course_overview: z.object({
            total_enrollments: z.number(),
            active_enrollments: z.number(),
            completed_enrollments: z.number(),
            completion_rate: z.number(),
            average_completion_time_hours: z.number(),
            average_rating: z.number(),
            total_revenue: z.number(),
        }),
        engagement_metrics: z.object({
            total_watch_time_hours: z.number(),
            average_session_duration_minutes: z.number(),
            video_completion_rate: z.number(),
            quiz_attempt_rate: z.number(),
            assignment_submission_rate: z.number(),
            discussion_participation_rate: z.number(),
        }),
        content_performance: z.array(z.object({
            lecture_id: z.string(),
            lecture_title: z.string(),
            lecture_type: z.string(),
            view_count: z.number(),
            completion_rate: z.number(),
            average_watch_time_percentage: z.number(),
            dropout_rate: z.number(),
            engagement_score: z.number(),
        })),
        student_progress: z.array(z.object({
            user_id: z.string(),
            student_name: z.string(),
            enrollment_date: z.string().datetime(),
            progress_percentage: z.number(),
            last_accessed: z.string().datetime(),
            completion_status: z.string(),
            grade: z.number().optional(),
        })),
        time_series_data: z.object({
            daily_enrollments: z.array(z.object({
                date: z.string(),
                count: z.number(),
            })),
            weekly_engagement: z.array(z.object({
                week: z.string(),
                total_hours: z.number(),
                unique_learners: z.number(),
            })),
        }),
    }),
    message: z.string(),
}).openapi({ ref: "courseAnalyticsResponse" });

// ==================== ORDERING SCHEMAS ====================

export const updateSectionOrderRequestBodySchema = z.object({
    section_orders: z.array(z.object({
        id: z.string(),
        section_order: z.number(),
    })),
}).openapi({ ref: "updateSectionOrderRequest" });

export const updateLectureOrderRequestBodySchema = z.object({
    lecture_orders: z.array(z.object({
        id: z.string(),
        lecture_order: z.number(),
    })),
}).openapi({ ref: "updateLectureOrderRequest" });

export const bulkEnrollStudentsRequestBodySchema = z.object({
    student_ids: z.array(z.string()),
    enrollment_type: z.enum(["free", "paid", "admin_assigned", "bulk_enrollment"]).default("admin_assigned"),
}).openapi({ ref: "bulkEnrollStudentsRequest" });
