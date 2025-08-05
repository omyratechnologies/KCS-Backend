import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface ICourseCertificateData {
    id: string;
    course_id: string;
    user_id: string;
    enrollment_id: string;
    campus_id: string;
    certificate_number: string; // Unique certificate number
    certificate_type:
        | "completion"
        | "achievement"
        | "participation"
        | "excellence";
    status: "pending" | "generated" | "issued" | "revoked";
    issue_date: Date;
    expiry_date?: Date;
    grade?: number; // Final course grade
    completion_time_hours: number;
    skills_acquired: string[];
    certificate_data: {
        template_id: string;
        template_version: string;
        pdf_url?: string;
        pdf_file_size_mb?: number;
        blockchain_hash?: string; // For blockchain verification
        verification_url?: string;
        qr_code_url?: string;
        digital_signature?: string;
        watermark_id?: string;
    };
    verification_details: {
        verification_code: string; // Unique verification code
        is_verifiable: boolean;
        verification_link: string;
        issuer_details: {
            institution_name: string;
            instructor_name: string;
            instructor_credentials: string;
        };
    };
    recipient_details: {
        full_name: string;
        email: string;
        student_id: string;
        graduation_date?: Date;
    };
    course_details: {
        course_title: string;
        course_duration_hours: number;
        completion_percentage: number;
        skills_covered: string[];
        learning_outcomes_achieved: string[];
    };
    delivery_status: {
        email_sent: boolean;
        email_sent_at?: Date;
        download_count: number;
        first_downloaded_at?: Date;
        last_downloaded_at?: Date;
        shared_count: number;
    };
    meta_data: {
        generation_time_ms?: number;
        custom_fields?: Record<string, any>;
        revocation_reason?: string;
        revoked_at?: Date;
        revoked_by?: string;
        regeneration_count?: number;
        compliance_data?: {
            accreditation_body?: string;
            compliance_standards?: string[];
            audit_trail?: Array<{
                action: string;
                timestamp: Date;
                user_id: string;
            }>;
        };
    };
    created_at: Date;
    updated_at: Date;
}

const CourseCertificateSchema = new Schema({
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    enrollment_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    certificate_number: { type: String, required: true, unique: true },
    certificate_type: {
        type: String,
        enum: ["completion", "achievement", "participation", "excellence"],
        default: "completion",
    },
    status: {
        type: String,
        enum: ["pending", "generated", "issued", "revoked"],
        default: "pending",
    },
    issue_date: { type: Date, required: true },
    expiry_date: { type: Date },
    grade: { type: Number },
    completion_time_hours: { type: Number, required: true },
    skills_acquired: { type: [String], default: [] },
    certificate_data: { type: Object, required: true },
    verification_details: { type: Object, required: true },
    recipient_details: { type: Object, required: true },
    course_details: { type: Object, required: true },
    delivery_status: {
        type: Object,
        default: {
            email_sent: false,
            download_count: 0,
            shared_count: 0,
        },
    },
    meta_data: { type: Object, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseCertificateSchema.index.findByCourseId = { by: "course_id" };
CourseCertificateSchema.index.findByUserId = { by: "user_id" };
CourseCertificateSchema.index.findByEnrollmentId = { by: "enrollment_id" };
CourseCertificateSchema.index.findByCampusId = { by: "campus_id" };
CourseCertificateSchema.index.findByCertificateNumber = {
    by: "certificate_number",
};
CourseCertificateSchema.index.findByStatus = { by: "status" };
CourseCertificateSchema.index.findByVerificationCode = {
    by: "verification_details.verification_code",
};

const CourseCertificate = ottoman.model<ICourseCertificateData>(
    "course_certificates",
    CourseCertificateSchema
);

export { CourseCertificate };
