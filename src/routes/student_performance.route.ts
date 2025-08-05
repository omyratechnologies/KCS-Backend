import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { StudentPerformanceController } from "@/controllers/student_performance.controller";
import {
    academicYearParamSchema,
    calculatePerformanceRequestBodySchema,
    createStudentPerformanceRequestBodySchema,
    errorResponseSchema,
    performanceQuerySchema,
    performanceSummaryResponseSchema,
    semesterParamSchema,
    studentIdParamSchema,
    studentPerformanceListResponseSchema,
    studentPerformanceResponseSchema,
} from "@/schema/student-performance";

const app = new Hono();

// Get current student's performance (authenticated student)
app.get(
    "/my-performance",
    describeRoute({
        operationId: "getCurrentStudentPerformance",
        summary: "Get current student's performance",
        description: "Get performance data for the authenticated student",
        tags: ["Student Performance"],
        parameters: [
            {
                name: "semester",
                in: "query",
                description: "Specific semester to get performance for",
                required: false,
                schema: { type: "string" },
            },
            {
                name: "academic_year",
                in: "query",
                description: "Academic year for the semester",
                required: false,
                schema: { type: "string" },
            },
        ],
        responses: {
            200: {
                description: "Student performance data retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentPerformanceListResponseSchema),
                    },
                },
            },
            404: {
                description: "Performance data not found",
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
    zValidator("query", performanceQuerySchema),
    StudentPerformanceController.getCurrentStudentPerformance
);

// Get current student's performance summary (authenticated student)
app.get(
    "/my-performance/summary",
    describeRoute({
        operationId: "getCurrentStudentPerformanceSummary",
        summary: "Get current student's performance summary",
        description: "Get performance summary for the authenticated student",
        tags: ["Student Performance"],
        parameters: [
            {
                name: "academic_years",
                in: "query",
                description: "Comma-separated list of academic years",
                required: false,
                schema: { type: "string" },
            },
        ],
        responses: {
            200: {
                description:
                    "Student performance summary retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(performanceSummaryResponseSchema),
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
    zValidator("query", performanceQuerySchema),
    StudentPerformanceController.getCurrentStudentPerformanceSummary
);

// Create or update student performance (admin/teacher route)
app.post(
    "/",
    describeRoute({
        operationId: "createStudentPerformance",
        summary: "Create or update student performance",
        description: "Create or update performance data for a student",
        tags: ["Student Performance"],
        responses: {
            200: {
                description: "Student performance created/updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentPerformanceResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
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
    zValidator("json", createStudentPerformanceRequestBodySchema),
    StudentPerformanceController.createOrUpdateStudentPerformance
);

// Calculate and save performance metrics (admin/teacher route)
app.post(
    "/calculate",
    describeRoute({
        operationId: "calculateStudentPerformance",
        summary: "Calculate and save student performance metrics",
        description:
            "Calculate performance metrics from raw data and save them",
        tags: ["Student Performance"],
        responses: {
            200: {
                description:
                    "Performance metrics calculated and saved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentPerformanceResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
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
    zValidator("json", calculatePerformanceRequestBodySchema),
    StudentPerformanceController.calculateAndSavePerformanceMetrics
);

// Get student performance by semester (admin/teacher route)
app.get(
    "/:student_id/semester/:semester",
    describeRoute({
        operationId: "getStudentPerformanceBySemester",
        summary: "Get student performance by semester",
        description: "Get performance data for a specific student and semester",
        tags: ["Student Performance"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                description: "Student ID",
                required: true,
                schema: { type: "string" },
            },
            {
                name: "semester",
                in: "path",
                description: "Semester",
                required: true,
                schema: { type: "string" },
            },
            {
                name: "academic_year",
                in: "query",
                description: "Academic year",
                required: false,
                schema: { type: "string" },
            },
        ],
        responses: {
            200: {
                description: "Student performance retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentPerformanceResponseSchema),
                    },
                },
            },
            404: {
                description: "Performance data not found",
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
    zValidator("param", studentIdParamSchema.merge(semesterParamSchema)),
    zValidator("query", performanceQuerySchema),
    StudentPerformanceController.getStudentPerformanceBySemester
);

// Get student performance by academic year (admin/teacher route)
app.get(
    "/:student_id/academic-year/:academic_year",
    describeRoute({
        operationId: "getStudentPerformanceByAcademicYear",
        summary: "Get student performance by academic year",
        description:
            "Get all semester performance data for a specific student and academic year",
        tags: ["Student Performance"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                description: "Student ID",
                required: true,
                schema: { type: "string" },
            },
            {
                name: "academic_year",
                in: "path",
                description: "Academic year",
                required: true,
                schema: { type: "string" },
            },
        ],
        responses: {
            200: {
                description: "Student performance retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentPerformanceListResponseSchema),
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
    zValidator("param", studentIdParamSchema.merge(academicYearParamSchema)),
    StudentPerformanceController.getStudentPerformanceByAcademicYear
);

// Get all student performance records (admin/teacher route)
app.get(
    "/:student_id",
    describeRoute({
        operationId: "getAllStudentPerformance",
        summary: "Get all student performance records",
        description: "Get all performance data for a specific student",
        tags: ["Student Performance"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                description: "Student ID",
                required: true,
                schema: { type: "string" },
            },
        ],
        responses: {
            200: {
                description: "Student performance retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentPerformanceListResponseSchema),
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
    zValidator("param", studentIdParamSchema),
    StudentPerformanceController.getAllStudentPerformance
);

// Get student performance summary (admin/teacher route)
app.get(
    "/:student_id/summary",
    describeRoute({
        operationId: "getStudentPerformanceSummary",
        summary: "Get student performance summary",
        description: "Get performance summary for a specific student",
        tags: ["Student Performance"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                description: "Student ID",
                required: true,
                schema: { type: "string" },
            },
            {
                name: "academic_years",
                in: "query",
                description: "Comma-separated list of academic years",
                required: false,
                schema: { type: "string" },
            },
        ],
        responses: {
            200: {
                description:
                    "Student performance summary retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(performanceSummaryResponseSchema),
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
    zValidator("param", studentIdParamSchema),
    zValidator("query", performanceQuerySchema),
    StudentPerformanceController.getPerformanceSummary
);

export default app;
