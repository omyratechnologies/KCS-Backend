import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { ReportCardController } from "@/controllers/report_card.controller";
import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    availableMonthsResponseSchema,
    getReportCardQuerySchema,
    getStudentReportCardParamsSchema,
    reportCardErrorResponseSchema,
    reportCardListResponseSchema,
    reportCardResponseSchema,
    updateTeacherRemarksBodySchema,
} from "@/schema/report_card";

const app = new Hono();

// ======================= STUDENT ROUTES =======================
// Students can view their own report cards

app.get(
    "/my-available-months",
    describeRoute({
        operationId: "getMyAvailableMonths",
        summary: "Get available months with report cards",
        description: "Get list of months for which published report cards are available for the authenticated student",
        tags: ["Report Cards - Student"],
        responses: {
            200: {
                description: "Available months retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(availableMonthsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("student_view_report_card"),
    ReportCardController.getMyAvailableMonths
);

app.get(
    "/my-report",
    describeRoute({
        operationId: "getMyReportCard",
        summary: "Get my monthly report card",
        description: "Get monthly report card for the authenticated student. Auto-generates if not exists.",
        tags: ["Report Cards - Student"],
        parameters: [
            {
                name: "month",
                in: "query",
                required: true,
                schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
                description: "Month in format YYYY-MM (e.g., 2024-03)",
            },
        ],
        responses: {
            200: {
                description: "Report card retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(reportCardResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - invalid parameters",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
            404: {
                description: "Report card not found",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("query", getReportCardQuerySchema),
    roleMiddleware("student_view_report_card"),
    ReportCardController.getMyReportCard
);

// ======================= TEACHER/ADMIN ROUTES =======================
// Teachers and admins can view, generate, and manage report cards

app.get(
    "/student/:student_id/available-months",
    describeRoute({
        operationId: "getStudentAvailableMonths",
        summary: "Get available months for a student",
        description: "Get list of months for which report cards are available for a specific student (teacher/admin access)",
        tags: ["Report Cards - Teacher/Admin"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "include_unpublished",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["true", "false"] },
                description: "Include unpublished report cards (default: false)",
            },
        ],
        responses: {
            200: {
                description: "Available months retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(availableMonthsResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("param", getStudentReportCardParamsSchema),
    roleMiddleware("teacher_view_report_card"),
    ReportCardController.getStudentAvailableMonths
);

app.get(
    "/student/:student_id",
    describeRoute({
        operationId: "getStudentReportCard",
        summary: "Get student's monthly report card",
        description: "Get monthly report card for a specific student (teacher/admin access)",
        tags: ["Report Cards - Teacher/Admin"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "month",
                in: "query",
                required: true,
                schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
                description: "Month in format YYYY-MM (e.g., 2024-03)",
            },
        ],
        responses: {
            200: {
                description: "Report card retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(reportCardResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - invalid parameters",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
            404: {
                description: "Report card not found",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("param", getStudentReportCardParamsSchema),
    zValidator("query", getReportCardQuerySchema),
    roleMiddleware("teacher_view_report_card"),
    ReportCardController.getStudentReportCard
);

app.get(
    "/student/:student_id/all",
    describeRoute({
        operationId: "getAllStudentReportCards",
        summary: "Get all report cards for a student",
        description: "Get all monthly report cards for a specific student (teacher/admin access)",
        tags: ["Report Cards - Teacher/Admin"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "academic_year",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Academic year filter (e.g., 2023-2024)",
            },
        ],
        responses: {
            200: {
                description: "Report cards retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(reportCardListResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("param", getStudentReportCardParamsSchema),
    roleMiddleware("teacher_view_report_card"),
    ReportCardController.getAllStudentReportCards
);

app.post(
    "/generate/:student_id",
    describeRoute({
        operationId: "generateReportCard",
        summary: "Generate monthly report card",
        description: "Generate monthly report card for a student (teacher/admin access)",
        tags: ["Report Cards - Teacher/Admin"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "month",
                in: "query",
                required: true,
                schema: { type: "string", pattern: "^\\d{4}-(0[1-9]|1[0-2])$" },
                description: "Month in format YYYY-MM (e.g., 2024-03)",
            },
            {
                name: "academic_year",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Academic year (e.g., 2023-2024)",
            },
        ],
        responses: {
            200: {
                description: "Report card generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(reportCardResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - invalid parameters",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("param", getStudentReportCardParamsSchema),
    roleMiddleware("teacher_generate_report_card"),
    ReportCardController.generateReportCard
);

app.patch(
    "/:report_id/remarks",
    describeRoute({
        operationId: "updateReportCardRemarks",
        summary: "Update report card remarks",
        description: "Update teacher remarks, achievements, and co-curricular activities (teacher/admin access)",
        tags: ["Report Cards - Teacher/Admin"],
        parameters: [
            {
                name: "report_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Report card ID",
            },
        ],
        responses: {
            200: {
                description: "Report card updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(reportCardResponseSchema),
                    },
                },
            },
            404: {
                description: "Report card not found",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateTeacherRemarksBodySchema),
    roleMiddleware("teacher_update_report_card"),
    ReportCardController.updateReportCardRemarks
);

app.post(
    "/:report_id/publish",
    describeRoute({
        operationId: "publishReportCard",
        summary: "Publish report card",
        description: "Publish report card to make it visible to student/parent (teacher/admin access)",
        tags: ["Report Cards - Teacher/Admin"],
        parameters: [
            {
                name: "report_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Report card ID",
            },
        ],
        responses: {
            200: {
                description: "Report card published successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            404: {
                description: "Report card not found",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("teacher_publish_report_card"),
    ReportCardController.publishReportCard
);

app.post(
    "/:report_id/finalize",
    describeRoute({
        operationId: "finalizeReportCard",
        summary: "Finalize report card",
        description: "Finalize report card (no more edits allowed) (admin access only)",
        tags: ["Report Cards - Teacher/Admin"],
        parameters: [
            {
                name: "report_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Report card ID",
            },
        ],
        responses: {
            200: {
                description: "Report card finalized successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            404: {
                description: "Report card not found",
                content: {
                    "application/json": {
                        schema: resolver(reportCardErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("admin_finalize_report_card"),
    ReportCardController.finalizeReportCard
);

export default app;
