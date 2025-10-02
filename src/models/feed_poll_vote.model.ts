import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export interface IFeedPollVote {
    id: string;
    feed_id: string;
    user_id: string;
    user_type: "Student" | "Teacher" | "Admin" | "Super Admin";
    selected_options: string[]; // Array to support multiple choice polls
    created_at: Date;
    updated_at: Date;
}

const FeedPollVoteSchema = new Schema({
    feed_id: { type: String, required: true },
    user_id: { type: String, required: true },
    user_type: { 
        type: String, 
        required: true,
        enum: ["Student", "Teacher", "Admin", "Super Admin"]
    },
    selected_options: { type: [String], required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for better query performance
FeedPollVoteSchema.index.findByFeed = { by: "feed_id" };
FeedPollVoteSchema.index.findByUser = { by: "user_id" };
FeedPollVoteSchema.index.findByUserAndFeed = { by: ["user_id", "feed_id"] };

export const FeedPollVote = ottoman.model("FeedPollVote", FeedPollVoteSchema);
