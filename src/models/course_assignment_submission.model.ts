import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseAssignmentSubmissionData {
    id: string;
    campus_id: string;
    course_id: string;
    assignment_id: string;
    user_id: string;
    submission_date: Date;
    grade: number;
    feedback: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseAssignmentSubmissionSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    class_teacher_id: { type: String, required: true },
    student_ids: { type: [String], required: true },
    student_count: { type: Number, required: true },
    academic_year: { type: String, required: true },
    teacher_ids: { type: [String], required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseAssignmentSubmissionSchema.index.findByCampusId = { by: "campus_id" };
CourseAssignmentSubmissionSchema.index.findByClassId = { by: "class_id" };
CourseAssignmentSubmissionSchema.index.findByAcademicYear = {
    by: "academic_year",
};
CourseAssignmentSubmissionSchema.index.findByClassTeacherId = {
    by: "class_teacher_id",
};

const CourseAssignmentSubmission =
    ottoman.model<ICourseAssignmentSubmissionData>(
        "course_assignment_submission",
        CourseAssignmentSubmissionSchema
    );

export { CourseAssignmentSubmission, type ICourseAssignmentSubmissionData };
