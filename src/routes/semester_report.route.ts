import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { SemesterReportController } from "@/controllers/semester_report.controller";
import {
    errorResponseSchema,
    parentSemesterReportRequestSchema,
    semesterReportRequestSchema,
    semesterReportResponseSchema,
    studentSemesterReportRequestSchema,
} from "@/schema/semester_report";

const app = new Hono();

/**
 * Admin Route: Generate semester report for any student
 * POST /api/semester-report/admin
 */
app.post(
    "/admin",
    describeRoute({
        operationId: "getStudentSemesterReportAdmin",
        summary: "Generate semester report for a student (Admin)",
        description:
            "Generates a comprehensive semester report for any student including attendance, exams, quizzes, assignments, and courses. Admin access required.",
        tags: ["Semester Report"],
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            student_id: { type: "string" },
                            class_id: { type: "string" },
                            semester: { type: "string", enum: ["sem1", "sem2"] },
                            academic_year: { type: "string" },
                        },
                        required: ["student_id", "class_id", "semester"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Semester report generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(semesterReportResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - Invalid input parameters",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", semesterReportRequestSchema),
    SemesterReportController.getStudentSemesterReport
);

/**
 * Student Route: Get own semester report
 * POST /api/semester-report/student
 */
app.post(
    "/student",
    describeRoute({
        operationId: "getOwnSemesterReport",
        summary: "Get own semester report (Student)",
        description:
            "Students can generate their own comprehensive semester report including attendance, exams, quizzes, assignments, and courses. Student authentication required.",
        tags: ["Semester Report"],
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            class_id: { type: "string" },
                            semester: { type: "string", enum: ["sem1", "sem2"] },
                            academic_year: { type: "string" },
                        },
                        required: ["class_id", "semester"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Semester report generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(semesterReportResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - Invalid input parameters",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", studentSemesterReportRequestSchema),
    SemesterReportController.getOwnSemesterReport
);

/**
 * Parent Route: Get semester report for their student
 * POST /api/semester-report/parent
 */
app.post(
    "/parent",
    describeRoute({
        operationId: "getStudentSemesterReportParent",
        summary: "Get student semester report (Parent)",
        description:
            "Parents can generate semester reports for their linked students including attendance, exams, quizzes, assignments, and courses. Parent authentication required and parent-student relationship is verified.",
        tags: ["Semester Report"],
        requestBody: {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            student_id: { type: "string" },
                            class_id: { type: "string" },
                            semester: { type: "string", enum: ["sem1", "sem2"] },
                            academic_year: { type: "string" },
                        },
                        required: ["student_id", "class_id", "semester"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Semester report generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(semesterReportResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - Invalid input parameters",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Forbidden - Parent does not have access to this student's data",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", parentSemesterReportRequestSchema),
    SemesterReportController.getStudentSemesterReportByParent
);

export default app;
