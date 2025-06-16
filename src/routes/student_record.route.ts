import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { StudentRecordController } from "@/controllers/student_record.controller";
import {
    createStudentRecordRequestBodySchema,
    createStudentRecordResponseSchema,
    errorResponseSchema,
    getStudentRecordsResponseSchema,
    studentRecordSchema,
    updateStudentRecordRequestBodySchema,
    updateStudentRecordResponseSchema,
} from "@/schema/student-record";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        operationId: "createStudentRecord",
        summary: "Create student record",
        description: "Creates a new academic record for a student",
        tags: ["Student Record"],
        responses: {
            200: {
                description: "Student record created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createStudentRecordResponseSchema),
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
        },
    }),
    zValidator("json", createStudentRecordRequestBodySchema),
    StudentRecordController.createStudentRecord
);

app.get(
    "/",
    describeRoute({
        operationId: "getStudentRecordByCampusId",
        summary: "Get student records by campus",
        description: "Retrieves all student records for the current campus",
        tags: ["Student Record"],
        responses: {
            200: {
                description: "List of student records",
                content: {
                    "application/json": {
                        schema: resolver(getStudentRecordsResponseSchema),
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
        },
    }),
    StudentRecordController.getStudentRecordByCampusId
);

app.get(
    "/i/:student_record_id",
    describeRoute({
        operationId: "getStudentRecordById",
        summary: "Get student record by ID",
        description: "Retrieves a specific student record by ID",
        tags: ["Student Record"],
        parameters: [
            {
                name: "student_record_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student Record ID",
            },
        ],
        responses: {
            200: {
                description: "Student record details",
                content: {
                    "application/json": {
                        schema: resolver(studentRecordSchema),
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
        },
    }),
    StudentRecordController.getStudentRecordById
);

app.get(
    "/student/:student_id",
    describeRoute({
        operationId: "getStudentRecordByStudentId",
        summary: "Get student records by student ID",
        description: "Retrieves all academic records for a specific student",
        tags: ["Student Record"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
        ],
        responses: {
            200: {
                description: "List of student records",
                content: {
                    "application/json": {
                        schema: resolver(getStudentRecordsResponseSchema),
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
        },
    }),
    StudentRecordController.getStudentRecordByStudentId
);

app.put(
    "/:student_record_id",
    describeRoute({
        operationId: "updateStudentRecordById",
        summary: "Update student record",
        description: "Updates a specific student record by ID",
        tags: ["Student Record"],
        parameters: [
            {
                name: "student_record_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student Record ID",
            },
        ],
        responses: {
            200: {
                description: "Student record updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateStudentRecordResponseSchema),
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
        },
    }),
    zValidator("json", updateStudentRecordRequestBodySchema),
    StudentRecordController.updateStudentRecordById
);

app.delete(
    "/:student_record_id",
    describeRoute({
        operationId: "deleteStudentRecordById",
        summary: "Delete student record",
        description: "Deletes a specific student record by ID",
        tags: ["Student Record"],
        parameters: [
            {
                name: "student_record_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student Record ID",
            },
        ],
        responses: {
            200: {
                description: "Student record deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentRecordSchema),
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
        },
    }),
    StudentRecordController.deleteStudentRecordById
);

export default app;
