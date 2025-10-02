import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

interface IParentFeedControl {
    id: string;
    parent_id: string;
    student_id: string;
    campus_id: string;
    feed_access_enabled: boolean; // Simple boolean: true = allowed, false = blocked
    updated_at: Date;
}

const ParentFeedControlSchema = new Schema({
    parent_id: { type: String, required: true },
    student_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    feed_access_enabled: { type: Boolean, required: true, default: true },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient querying
ParentFeedControlSchema.index.findByParentId = { by: "parent_id" };
ParentFeedControlSchema.index.findByStudentId = { by: "student_id" };
ParentFeedControlSchema.index.findByCampusId = { by: "campus_id" };
ParentFeedControlSchema.index.findByParentAndStudent = { by: ["parent_id", "student_id"] };

const ParentFeedControl = ottoman.model<IParentFeedControl>("parent_feed_controls", ParentFeedControlSchema);

export { type IParentFeedControl, ParentFeedControl };