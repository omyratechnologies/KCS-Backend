import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export type FeedType = 
    | "Announcement" 
    | "Assignment" 
    | "Event" 
    | "Discussion" 
    | "Achievement" 
    | "Resource" 
    | "Poll";

export type FeedVisibility = "public" | "class" | "campus" | "private";

export interface IFeed {
    id: string;
    title?: string;
    content: string;
    type: FeedType;
    author_id: string;
    author_type: "Student" | "Teacher" | "Admin" | "Super Admin";
    campus_id: string;
    class_id?: string;
    subject_id?: string;
    visibility: FeedVisibility;
    tags?: string[];
    attachments?: {
        url: string;
        filename: string;
        file_type: string;
        file_size: number;
    }[];
    metadata?: {
        assignment_due_date?: Date;
        event_date?: Date;
        event_location?: string;
        poll_options?: string[];
        poll_multiple_choice?: boolean;
        poll_expires_at?: Date;
        resource_url?: string;
        [key: string]: unknown;
    };
    likes_count: number;
    comments_count: number;
    shares_count: number;
    bookmarks_count: number;
    is_pinned: boolean;
    is_deleted: boolean;
    deleted_by?: string;
    deleted_at?: Date;
    created_at: Date;
    updated_at: Date;
}

const FeedSchema = new Schema({
    title: { type: String, required: false },
    content: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ["Announcement", "Assignment", "Event", "Discussion", "Achievement", "Resource", "Poll"]
    },
    author_id: { type: String, required: true },
    author_type: { 
        type: String, 
        required: true,
        enum: ["Student", "Teacher", "Admin", "Super Admin"]
    },
    campus_id: { type: String, required: true },
    class_id: { type: String, required: false },
    subject_id: { type: String, required: false },
    visibility: { 
        type: String, 
        required: true, 
        default: "public",
        enum: ["public", "class", "campus", "private"]
    },
    tags: { type: [String], required: false, default: [] },
    attachments: { 
        type: [Object], 
        required: false, 
        default: [],
        schema: {
            url: { type: String, required: true },
            filename: { type: String, required: true },
            file_type: { type: String, required: true },
            file_size: { type: Number, required: true }
        }
    },
    metadata: { type: Object, required: false, default: {} },
    likes_count: { type: Number, required: true, default: 0 },
    comments_count: { type: Number, required: true, default: 0 },
    shares_count: { type: Number, required: true, default: 0 },
    bookmarks_count: { type: Number, required: true, default: 0 },
    is_pinned: { type: Boolean, required: true, default: false },
    is_deleted: { type: Boolean, required: true, default: false },
    deleted_by: { type: String, required: false },
    deleted_at: { type: Date, required: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for better query performance
FeedSchema.index.findByCampus = { by: "campus_id" };
FeedSchema.index.findByClass = { by: "class_id" };
FeedSchema.index.findByAuthor = { by: "author_id" };
FeedSchema.index.findByType = { by: "type" };
FeedSchema.index.findByVisibility = { by: "visibility" };
FeedSchema.index.findNotDeleted = { by: "is_deleted" };
FeedSchema.index.findByCreatedAt = { by: "created_at" };

export const Feed = ottoman.model("Feed", FeedSchema);
