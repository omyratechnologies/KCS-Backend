import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IMeetingData {
    id: string;
    campus_id: string;
    creator_id: string;
    participants: string[];
    meeting_name: string;
    meeting_description: string;
    meeting_start_time: Date;
    meeting_end_time: Date;
    meeting_location: string;
    meeting_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const MeetingSchema = new Schema({
    campus_id: { type: String, required: true },
    creator_id: { type: String, required: true },
    participants: { type: [String], required: true },
    meeting_name: { type: String, required: true },
    meeting_description: { type: String, required: true },
    meeting_start_time: { type: Date, required: true },
    meeting_end_time: { type: Date, required: true },
    meeting_location: { type: String, required: true },
    meeting_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

MeetingSchema.index.findByCampusId = { by: "campus_id" };
MeetingSchema.index.findByCreatorId = { by: "creator_id" };

const Meeting = ottoman.model<IMeetingData>("meeting", MeetingSchema);

export { type IMeetingData, Meeting };
