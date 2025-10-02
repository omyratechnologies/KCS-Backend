import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export interface IFeedComment {
    id: string;
    feed_id: string;
    content: string;
    author_id: string;
    author_type: "Student" | "Teacher" | "Admin" | "Super Admin";
    parent_comment_id?: string; // For nested comments/replies
    attachments?: {
        url: string;
        filename: string;
        file_type: string;
        file_size: number;
    }[];
    likes_count: number;
    replies_count: number;
    is_deleted: boolean;
    deleted_by?: string;
    deleted_at?: Date;
    created_at: Date;
    updated_at: Date;
}

const FeedCommentSchema = new Schema({
    feed_id: { type: String, required: true },
    content: { type: String, required: true },
    author_id: { type: String, required: true },
    author_type: { 
        type: String, 
        required: true,
        enum: ["Student", "Teacher", "Admin", "Super Admin"]
    },
    parent_comment_id: { type: String, required: false },
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
    likes_count: { type: Number, required: true, default: 0 },
    replies_count: { type: Number, required: true, default: 0 },
    is_deleted: { type: Boolean, required: true, default: false },
    deleted_by: { type: String, required: false },
    deleted_at: { type: Date, required: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for better query performance
FeedCommentSchema.index.findByFeed = { by: "feed_id" };
FeedCommentSchema.index.findByAuthor = { by: "author_id" };
FeedCommentSchema.index.findByParent = { by: "parent_comment_id" };
FeedCommentSchema.index.findNotDeleted = { by: "is_deleted" };
FeedCommentSchema.index.findByCreatedAt = { by: "created_at" };

export const FeedComment = ottoman.model("FeedComment", FeedCommentSchema);
