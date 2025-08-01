import { Schema } from "ottoman";import { ottoman } from "../libs/db";interface ICourseDiscussionData {    id: string;    campus_id: string;    course_id: string;    content_id?: string; // optional - can be course-wide discussion    user_id: string;        // Discussion content    discussion_title?: string;    discussion_content: string;    discussion_type: "question" | "general" | "announcement" | "feedback" | "bug_report";        // Thread hierarchy    parent_discussion_id?: string; // for replies    thread_level: number; // 0 for main post, 1+ for replies        // Content context (if related to specific lecture)    content_context?: {        section_title: string;        lecture_title: string;        timestamp?: number; // for video discussions        content_type: string;    };        // Engagement metrics    engagement: {        upvotes_count: number;        downvotes_count: number;        replies_count: number;        views_count: number;        shares_count: number;        bookmarks_count: number;    };        // User interactions    user_interactions: {        upvoted_by: string[]; // user IDs        downvoted_by: string[]; // user IDs        bookmarked_by: string[]; // user IDs        reported_by: string[]; // user IDs    };        // Discussion status    status: {        is_answered: boolean;        is_featured: boolean;        is_pinned: boolean;        is_locked: boolean;        is_instructor_reply: boolean;        answer_discussion_id?: string; // ID of the accepted answer    };        // Moderation    moderation: {        is_flagged: boolean;        is_approved: boolean;        flagged_reasons: string[];        moderated_by?: string;        moderated_at?: Date;        moderation_notes?: string;    };        // Tags and categorization    tags: string[];        // Rich content    rich_content: {        has_attachments: boolean;        attachments: {            file_name: string;            file_url: string;            file_type: string;            file_size: number;        }[];        has_code_blocks: boolean;        has_links: boolean;        formatting_type: "plain" | "markdown" | "rich_text";    };        // Notification settings    notifications: {        notify_on_reply: boolean;        notify_on_upvote: boolean;        subscribed_users: string[]; // users following this discussion    };        // Metadata    meta_data: {        ip_address?: string;        user_agent?: string;        device_type: "mobile" | "desktop" | "tablet";        posted_from: "web" | "mobile_app";        edit_history: {            edited_at: Date;            edited_by: string;            changes_summary?: string;        }[];        last_activity_at: Date;    };        is_active: boolean;    is_deleted: boolean;    created_at: Date;    updated_at: Date;
}

const CourseDiscussionSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    content_id: { type: String, required: false },
    user_id: { type: String, required: true },
    discussion_title: { type: String, required: false },
    discussion_content: { type: String, required: true },
    discussion_type: { type: String, required: true, enum: ["question", "general", "announcement", "feedback", "bug_report"] },
    parent_discussion_id: { type: String, required: false },
    thread_level: { type: Number, required: true, default: 0 },
    content_context: { type: Object, required: false },
    engagement: {
        type: Object,
        required: true,
        default: {
            upvotes_count: 0,
            downvotes_count: 0,
            replies_count: 0,
            views_count: 0,
            shares_count: 0,
            bookmarks_count: 0
        }
    },
    user_interactions: {
        type: Object,
        required: true,
        default: {
            upvoted_by: [],
            downvoted_by: [],
            bookmarked_by: [],
            reported_by: []
        }
    },
    status: {
        type: Object,
        required: true,
        default: {
            is_answered: false,
            is_featured: false,
            is_pinned: false,
            is_locked: false,
            is_instructor_reply: false
        }
    },
    moderation: {
        type: Object,
        required: true,
        default: {
            is_flagged: false,
            is_approved: true,
            flagged_reasons: []
        }
    },
    tags: { type: Array, required: true, default: [] },
    rich_content: {
        type: Object,
        required: true,
        default: {
            has_attachments: false,
            attachments: [],
            has_code_blocks: false,
            has_links: false,
            formatting_type: "plain"
        }
    },
    notifications: {
        type: Object,
        required: true,
        default: {
            notify_on_reply: true,
            notify_on_upvote: false,
            subscribed_users: []
        }
    },
    meta_data: {
        type: Object,
        required: true,
        default: {
            device_type: "desktop",
            posted_from: "web",
            edit_history: [],
            last_activity_at: new Date()
        }
    },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient querying
CourseDiscussionSchema.index.findByCampusId = { by: "campus_id" };
CourseDiscussionSchema.index.findByCourseId = { by: "course_id" };
CourseDiscussionSchema.index.findByContentId = { by: "content_id" };
CourseDiscussionSchema.index.findByUserId = { by: "user_id" };
CourseDiscussionSchema.index.findByParentId = { by: "parent_discussion_id" };
CourseDiscussionSchema.index.findByDiscussionType = { by: "discussion_type" };
CourseDiscussionSchema.index.findByThreadLevel = { by: "thread_level" };

const CourseDiscussion = ottoman.model<ICourseDiscussionData>("course_discussion", CourseDiscussionSchema);

export { CourseDiscussion, type ICourseDiscussionData };
