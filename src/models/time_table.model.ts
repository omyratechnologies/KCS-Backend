import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ITimetable {
    id: string;
    campus_id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    day: string;
    start_time: string;
    end_time: string;
    meta_data: object;
    is_suspended: boolean;
    is_adjourned: boolean;
    is_cancelled: boolean;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const TimetableSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    teacher_id: { type: String, required: true },
    day: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    is_suspended: { type: Boolean, required: true },
    is_adjourned: { type: Boolean, required: true },
    is_cancelled: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

TimetableSchema.index.findByCampusId = { by: "campus_id" };
TimetableSchema.index.findByClassId = { by: "class_id" };
TimetableSchema.index.findBySubjectId = { by: "subject_id" };
TimetableSchema.index.findByTeacherId = { by: "teacher_id" };
TimetableSchema.index.findByDay = { by: "day" };
TimetableSchema.index.findByStartTime = { by: "start_time" };
TimetableSchema.index.findByEndTime = { by: "end_time" };
TimetableSchema.index.findByCampusIdAndClassId = {
    by: ["campus_id", "class_id"],
};
TimetableSchema.index.findByCampusIdAndSubjectId = {
    by: ["campus_id", "subject_id"],
};
TimetableSchema.index.findByCampusIdAndTeacherId = {
    by: ["campus_id", "teacher_id"],
};
TimetableSchema.index.findByCampusIdAndDay = { by: ["campus_id", "day"] };
TimetableSchema.index.findByCampusIdAndStartTime = {
    by: ["campus_id", "start_time"],
};
TimetableSchema.index.findByCampusIdAndEndTime = {
    by: ["campus_id", "end_time"],
};

const Timetable = ottoman.model<ITimetable>("time_table", TimetableSchema);

export { type ITimetable, Timetable };
