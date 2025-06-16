import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IAttendanceData {
    id: string;
    user_id: string;
    campus_id: string;
    date: Date;
    status: "present" | "absent" | "late" | "leave";
    created_at: Date;
    updated_at: Date;
}

const AttendanceSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
        type: String,
        required: true,
        enum: ["present", "absent", "late", "leave"],
    },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

AttendanceSchema.index.findByCampusId = { by: "campus_id" };
AttendanceSchema.index.findByUserId = { by: "user_id" };
AttendanceSchema.index.findByDate = { by: "date" };

const Attendance = ottoman.model<IAttendanceData>(
    "attendances",
    AttendanceSchema
);

export { Attendance, type IAttendanceData };
