import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ITeacherRemark {
    subject_id: string;
    subject_name: string;
    teacher_name: string;
    remarks: string;
    strengths: string[];
    areas_for_improvement: string[];
}

interface ICoCurricularActivity {
    activity_name: string;
    participation_level: string;
    remarks?: string;
}

interface IReportCardData {
    id: string;
    campus_id: string;
    student_id: string;
    class_id: string;
    academic_year: string;
    month: string; // Format: YYYY-MM
    month_name: string;
    semester?: string;
    
    // Stored data (computed at generation time)
    report_data: {
        attendance: object;
        subjects_performance: object[];
        activity_summary: object;
        overall_performance: object;
        behavioral_metrics: object;
    };
    
    // Editable fields by teachers/admins
    teacher_remarks?: ITeacherRemark[];
    achievements?: string[];
    co_curricular_activities?: ICoCurricularActivity[];
    
    generated_at: Date;
    generated_by: string; // user_id who generated
    updated_at: Date;
    updated_by?: string; // user_id who last updated
    
    is_published: boolean; // Whether visible to student/parent
    is_final: boolean; // Whether report is finalized (no more edits)
}

const ReportCardSchema = new Schema({
    campus_id: { type: String, required: true },
    student_id: { type: String, required: true },
    class_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    month: { type: String, required: true },
    month_name: { type: String, required: true },
    semester: { type: String, required: false },
    
    report_data: Schema.Types.Mixed,
    
    teacher_remarks: [Schema.Types.Mixed],
    achievements: [String],
    co_curricular_activities: [Schema.Types.Mixed],
    
    generated_at: { type: Date, default: () => new Date() },
    generated_by: { type: String, required: true },
    updated_at: { type: Date, default: () => new Date() },
    updated_by: { type: String, required: false },
    
    is_published: { type: Boolean, default: false },
    is_final: { type: Boolean, default: false },
});

ReportCardSchema.index.findByCampusId = { by: "campus_id" };
ReportCardSchema.index.findByStudentId = { by: "student_id" };
ReportCardSchema.index.findByMonth = { by: "month" };
ReportCardSchema.index.findByClassId = { by: "class_id" };
ReportCardSchema.index.findByAcademicYear = { by: "academic_year" };

const ReportCard = ottoman.model<IReportCardData>("report_cards", ReportCardSchema);

export { ReportCard, type IReportCardData, type ITeacherRemark, type ICoCurricularActivity };
