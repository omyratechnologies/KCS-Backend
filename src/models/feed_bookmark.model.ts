import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export interface IFeedBookmark {
    id: string;
    feed_id: string;
    user_id: string;
    user_type: "Student" | "Teacher" | "Admin" | "Super Admin";
    created_at: Date;
}

const FeedBookmarkSchema = new Schema({
    feed_id: { type: String, required: true },
    user_id: { type: String, required: true },
    user_type: { 
        type: String, 
        required: true,
        enum: ["Student", "Teacher", "Admin", "Super Admin"]
    },
    created_at: { type: Date, default: () => new Date() },
});

// Indexes for better query performance
FeedBookmarkSchema.index.findByFeed = { by: "feed_id" };
FeedBookmarkSchema.index.findByUser = { by: "user_id" };
FeedBookmarkSchema.index.findByUserAndFeed = { by: ["user_id", "feed_id"] };

export const FeedBookmark = ottoman.model("FeedBookmark", FeedBookmarkSchema);
