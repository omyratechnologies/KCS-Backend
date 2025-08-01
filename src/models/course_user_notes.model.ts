import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

interface ICourseUserNotesData {
    id: string;
    campus_id: string;
    course_id: string;
    user_id: string;
    content_id: string; // lecture/content ID
    
    // Note content
    note_title?: string;
    note_content: string;
    note_type: "text" | "highlight" | "bookmark" | "question" | "reminder";
    
    // Video/Audio timestamp (for video/audio content)
    timestamp?: number; // in seconds
    timestamp_end?: number; // for range selection
    
    // Context information
    context_data: {
        section_title: string;
        lecture_title: string;
        content_type: string;
        surrounding_text?: string; // text around the highlighted area
    };
    
    // Note properties
    properties: {
        is_private: boolean;
        is_starred: boolean;
        is_archived: boolean;
        color_code?: string; // for highlight colors
        font_size?: "small" | "medium" | "large";
    };
    
    // Tags and organization
    tags: string[];
    
    // Sharing and collaboration
    sharing: {
        is_shared: boolean;
        shared_with: string[]; // user IDs
        sharing_permissions: "view" | "comment" | "edit";
    };
    
    // Metadata
    meta_data: {
        device_type: "mobile" | "desktop" | "tablet";
        app_version?: string;
        created_from: "web" | "mobile_app" | "browser_extension";
        last_accessed_at?: Date;
        view_count: number;
    };
    
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseUserNotesSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    content_id: { type: String, required: true },
    note_title: { type: String, required: false },
    note_content: { type: String, required: true },
    note_type: { type: String, required: true, enum: ["text", "highlight", "bookmark", "question", "reminder"] },
    timestamp: { type: Number, required: false },
    timestamp_end: { type: Number, required: false },
    context_data: { type: Object, required: true },
    properties: {
        type: Object,
        required: true,
        default: {
            is_private: true,
            is_starred: false,
            is_archived: false,
            font_size: "medium"
        }
    },
    tags: { type: Array, required: true, default: [] },
    sharing: {
        type: Object,
        required: true,
        default: {
            is_shared: false,
            shared_with: [],
            sharing_permissions: "view"
        }
    },
    meta_data: {
        type: Object,
        required: true,
        default: {
            device_type: "desktop",
            created_from: "web",
            view_count: 0
        }
    },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient querying
CourseUserNotesSchema.index.findByCampusId = { by: "campus_id" };
CourseUserNotesSchema.index.findByCourseId = { by: "course_id" };
CourseUserNotesSchema.index.findByUserId = { by: "user_id" };
CourseUserNotesSchema.index.findByContentId = { by: "content_id" };
CourseUserNotesSchema.index.findByUserAndCourse = { by: ["user_id", "course_id"] };
CourseUserNotesSchema.index.findByNoteType = { by: "note_type" };

const CourseUserNotes = ottoman.model<ICourseUserNotesData>("course_user_notes", CourseUserNotesSchema);

export { CourseUserNotes, type ICourseUserNotesData };
