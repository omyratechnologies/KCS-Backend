import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IAttendanceData {
    id: string;
    user_id: string;
    campus_id: string;
    class_id?: string; // Optional class association
    date: Date;
    status: string;
    user_type?: "Student" | "Teacher";
    created_at: Date;
    updated_at: Date;
    is_deleted?: boolean; // For soft deletes
    remarks?: string; // Optional remarks for attendance
    modifiedCount?: number; // Optional field to track modified count
}

const AttendanceSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    class_id: { type: String, required: false }, // Optional class association
    date: { type: Date, required: true },
    status: {
        type: String,
        required: true,
        enum: ["present", "absent", "late", "leave"],
    },
    user_type: {
        type: String,
        required: false,
        enum: ["Student", "Teacher"],
        default: "Student",
    },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

AttendanceSchema.index.findByCampusId = { by: "campus_id" };
AttendanceSchema.index.findByUserId = { by: "user_id" };
AttendanceSchema.index.findByDate = { by: "date" };
AttendanceSchema.index.findByClassId = { by: "class_id" };

const Attendance = ottoman.model<IAttendanceData>("attendances", AttendanceSchema);

export { Attendance, type IAttendanceData };
