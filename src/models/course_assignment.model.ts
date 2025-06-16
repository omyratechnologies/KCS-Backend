import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseAssignmentData {
    id: string;
    campus_id: string;
    course_id: string;
    assignment_title: string;
    assignment_description: string;
    due_date: Date;
    is_graded: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const CourseAssignmentSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    assignment_title: { type: String, required: true },
    assignment_description: { type: String, required: true },
    due_date: { type: Date, required: true },
    is_graded: { type: Boolean, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseAssignmentSchema.index.findByCampusId = { by: "campus_id" };
CourseAssignmentSchema.index.findByCourseId = { by: "course_id" };

const CourseAssignment = ottoman.model<ICourseAssignmentData>(
    "course_assignment",
    CourseAssignmentSchema
);

export { CourseAssignment, type ICourseAssignmentData };
