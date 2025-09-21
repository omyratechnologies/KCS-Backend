import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export interface IFeedLike {
    id: string;
    feed_id?: string;
    comment_id?: string;
    user_id: string;
    user_type: "Student" | "Teacher" | "Admin" | "Super Admin";
    created_at: Date;
}

const FeedLikeSchema = new Schema({
    feed_id: { type: String, required: false },
    comment_id: { type: String, required: false },
    user_id: { type: String, required: true },
    user_type: { 
        type: String, 
        required: true,
        enum: ["Student", "Teacher", "Admin", "Super Admin"]
    },
    created_at: { type: Date, default: () => new Date() },
});

// Indexes for better query performance
FeedLikeSchema.index.findByFeed = { by: "feed_id" };
FeedLikeSchema.index.findByComment = { by: "comment_id" };
FeedLikeSchema.index.findByUser = { by: "user_id" };
FeedLikeSchema.index.findByUserAndFeed = { by: ["user_id", "feed_id"] };
FeedLikeSchema.index.findByUserAndComment = { by: ["user_id", "comment_id"] };

export const FeedLike = ottoman.model("FeedLike", FeedLikeSchema);
