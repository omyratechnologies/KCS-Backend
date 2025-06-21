import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { ClassController } from "@/controllers/class.controller";
import {
    assignmentSchema,
    assignmentSubmissionSchema,
    assignStudentsRequestBodySchema,
    assignTeachersRequestBodySchema,
    assignmentResponseSchema,
    classSchema,
    classSubjectSchema,
    createAssignmentRequestBodySchema,
    createAssignmentResponseSchema,
    createAssignmentSubmissionRequestBodySchema,
    createAssignmentSubmissionResponseSchema,
    createClassRequestBodySchema,
    createClassResponseSchema,
    createClassSubjectRequestBodySchema,
    createClassSubjectResponseSchema,
    deleteResponseSchema,
    getAssignmentsResponseSchema,
    getAssignmentSubmissionsResponseSchema,
    getClassesResponseSchema,
    getClassSubjectsResponseSchema,
    updateAssignmentRequestBodySchema,
    updateAssignmentResponseSchema,
    updateClassRequestBodySchema,
    updateClassResponseSchema,
    updateClassSubjectRequestBodySchema,
    updateClassSubjectResponseSchema,
} from "@/schema/class";

const app = new Hono();

// Class routes
app.post(
    "/",
    describeRoute({
        tags: ["Class"],
        operationId: "createClass",
        summary: "Create a new class",
        description: "Creates a new class in the system",
        responses: {
            200: {
                description: "Class created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createClassResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createClassRequestBodySchema),
    ClassController.createClass
);

app.get(
    "/",
    describeRoute({
        tags: ["Class"],
        operationId: "getAllClassByCampusId",
        summary: "Get all classes by campus ID",
        description: "Retrieves all classes for a specific campus",
        responses: {
            200: {
                description: "List of classes",
                content: {
                    "application/json": {
                        schema: resolver(getClassesResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAllClassByCampusId
);

app.get(
    "/:class_id",
    describeRoute({
        tags: ["Class"],
        operationId: "getClassById",
        summary: "Get class by ID",
        description: "Retrieves a specific class by ID",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Class details",
                content: {
                    "application/json": {
                        schema: resolver(classSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getClassById
);

app.put(
    "/:class_id",
    describeRoute({
        tags: ["Class"],
        operationId: "updateClass",
        summary: "Update a class",
        description: "Updates a specific class by ID",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Class updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateClassResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateClassRequestBodySchema),
    ClassController.updateClass
);

app.delete(
    "/:class_id",
    describeRoute({
        tags: ["Class"],
        operationId: "deleteClass",
        summary: "Delete a class",
        description: "Deletes a specific class by ID",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Class deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.deleteClass
);

// Class subjects routes
app.get(
    "/:class_id/subjects",
    describeRoute({
        tags: ["Class"],
        operationId: "getAllSubjectsByClassId",
        summary: "Get all subjects by class ID",
        description: "Retrieves all subjects for a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "List of subjects",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: {
                                type: "object",
                            },
                        },
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAllSubjectsByClassId
);

app.get(
    "/subject/:subject_id/classes",
    describeRoute({
        tags: ["Class"],
        operationId: "getAllClassesBySubjectId",
        summary: "Get all classes by subject ID",
        description: "Retrieves all classes for a specific subject",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID",
            },
        ],
        responses: {
            200: {
                description: "List of classes",
                content: {
                    "application/json": {
                        schema: resolver(getClassesResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAllClassesBySubjectId
);

app.get(
    "/:class_id/class-subjects",
    describeRoute({
        tags: ["Class"],
        operationId: "getAllClassSubjectsByClassId",
        summary: "Get all class subjects by class ID",
        description: "Retrieves all class subjects for a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "List of class subjects",
                content: {
                    "application/json": {
                        schema: resolver(getClassSubjectsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAllClassSubjectsByClassId
);

app.post(
    "/:class_id/class-subjects",
    describeRoute({
        tags: ["Class"],
        operationId: "createClassSubject",
        summary: "Create a class subject",
        description: "Creates a new class subject for a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Class subject created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createClassSubjectResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createClassSubjectRequestBodySchema),
    ClassController.createClassSubject
);

app.put(
    "/class-subjects/:class_subject_id",
    describeRoute({
        tags: ["Class"],
        operationId: "updateClassSubject",
        summary: "Update a class subject",
        description: "Updates a specific class subject by ID",
        parameters: [
            {
                name: "class_subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class Subject ID",
            },
        ],
        responses: {
            200: {
                description: "Class subject updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateClassSubjectResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateClassSubjectRequestBodySchema),
    ClassController.updateClassSubject
);

app.delete(
    "/class-subjects/:class_subject_id",
    describeRoute({
        tags: ["Class"],
        operationId: "deleteClassSubject",
        summary: "Delete a class subject",
        description: "Deletes a specific class subject by ID",
        parameters: [
            {
                name: "class_subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class Subject ID",
            },
        ],
        responses: {
            200: {
                description: "Class subject deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.deleteClassSubject
);

app.get(
    "/class-subjects/:class_subject_id",
    describeRoute({
        tags: ["Class"],
        operationId: "getClassSubjectById",
        summary: "Get class subject by ID",
        description: "Retrieves a specific class subject by ID",
        parameters: [
            {
                name: "class_subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class Subject ID",
            },
        ],
        responses: {
            200: {
                description: "Class subject details",
                content: {
                    "application/json": {
                        schema: resolver(classSubjectSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getClassSubjectById
);

// Assignment routes
app.get(
    "/assignments/all",
    describeRoute({
        tags: ["Class"],
        operationId: "getAllAssignmentsFromAllClasses",
        summary: "Get all assignments from all classes",
        description: "Retrieves all assignments from all classes for the current campus",
        responses: {
            200: {
                description: "List of all assignments from all classes",
                content: {
                    "application/json": {
                        schema: resolver(getAssignmentsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAllAssignmentsFromAllClasses
);

app.get(
    "/:class_id/assignments",
    describeRoute({
        tags: ["Class"],
        operationId: "getAllAssignmentsByClassId",
        summary: "Get all assignments by class ID",
        description: "Retrieves all assignments for a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "List of assignments",
                content: {
                    "application/json": {
                        schema: resolver(getAssignmentsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAllAssignmentsByClassId
);

app.get(
    "/assignment/:assignment_id",
    describeRoute({
        tags: ["Class"],
        operationId: "getAssignmentById",
        summary: "Get assignment by ID",
        description: "Retrieves a specific assignment by ID",
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment details",
                content: {
                    "application/json": {
                        schema: resolver(assignmentSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAssignmentById
);

app.post(
    "/:class_id/assignments",
    describeRoute({
        tags: ["Class"],
        operationId: "createAssignment",
        summary: "Create an assignment",
        description: "Creates a new assignment for a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createAssignmentResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createAssignmentRequestBodySchema),
    ClassController.createAssignment
);

app.put(
    "/assignment/:assignment_id",
    describeRoute({
        tags: ["Class"],
        operationId: "updateAssignment",
        summary: "Update an assignment",
        description: "Updates a specific assignment by ID",
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateAssignmentResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateAssignmentRequestBodySchema),
    ClassController.updateAssignment
);

app.delete(
    "/assignment/:assignment_id",
    describeRoute({
        tags: ["Class"],
        operationId: "deleteAssignment",
        summary: "Delete an assignment",
        description: "Deletes a specific assignment by ID",
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.deleteAssignment
);

app.get(
    "/assignment-submission/:submission_id",
    describeRoute({
        tags: ["Class"],
        operationId: "getAssignmentSubmissionById",
        summary: "Get assignment submission by ID",
        description: "Retrieves a specific assignment submission by ID",
        parameters: [
            {
                name: "submission_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Submission ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment submission details",
                content: {
                    "application/json": {
                        schema: resolver(assignmentSubmissionSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAssignmentSubmissionById
);

app.post(
    "/assignment-submission/:assignment_id",
    describeRoute({
        tags: ["Class"],
        operationId: "createAssignmentSubmission",
        summary: "Create an assignment submission",
        description: "Creates a new submission for a specific assignment",
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment submission created successfully",
                content: {
                    "application/json": {
                        schema: resolver(
                            createAssignmentSubmissionResponseSchema
                        ),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createAssignmentSubmissionRequestBodySchema),
    ClassController.createAssignmentSubmission
);

app.get(
    "/assignment-submission/:assignment_id/submissions",
    describeRoute({
        tags: ["Class"],
        operationId: "getAssignmentSubmissionByAssignmentId",
        summary: "Get assignment submissions by assignment ID",
        description: "Retrieves all submissions for a specific assignment",
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "List of assignment submissions",
                content: {
                    "application/json": {
                        schema: resolver(
                            getAssignmentSubmissionsResponseSchema
                        ),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAssignmentSubmissionByAssignmentId
);

app.delete(
    "/assignment-submission/:submission_id",
    describeRoute({
        tags: ["Class"],
        operationId: "deleteAssignmentSubmission",
        summary: "Delete an assignment submission",
        description: "Deletes a specific assignment submission by ID",
        parameters: [
            {
                name: "submission_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Submission ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment submission deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.deleteAssignmentSubmission
);

app.get(
    "/assignment-submission/user/:user_id",
    describeRoute({
        tags: ["Class"],
        operationId: "getAssignmentSubmissionsByUserId",
        summary: "Get assignment submissions by user ID",
        description: "Retrieves all submissions made by a specific user",
        parameters: [
            {
                name: "user_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
            },
        ],
        responses: {
            200: {
                description: "List of assignment submissions",
                content: {
                    "application/json": {
                        schema: resolver(
                            getAssignmentSubmissionsResponseSchema
                        ),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAssignmentSubmissionsByUserId
);

app.get(
    "/assignment-submission/class/:class_id",
    describeRoute({
        tags: ["Class"],
        operationId: "getAssignmentSubmissionsByClassId",
        summary: "Get assignment submissions by class ID",
        description: "Retrieves all submissions for a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "List of assignment submissions",
                content: {
                    "application/json": {
                        schema: resolver(
                            getAssignmentSubmissionsResponseSchema
                        ),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getAssignmentSubmissionsByClassId
);

app.get(
    "/student/:studentId",
    describeRoute({
        tags: ["Class"],
        operationId: "getClassesByStudentId",
        summary: "Get classes by student ID",
        description: "Retrieves all classes that a student is enrolled in",
        parameters: [
            {
                name: "studentId",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
        ],
        responses: {
            200: {
                description: "List of classes for the student",
                content: {
                    "application/json": {
                        schema: resolver(getClassesResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    ClassController.getClassesByStudentUserId
);

// Student assignment routes
app.post(
    "/:class_id/students/assign",
    describeRoute({
        tags: ["Class"],
        operationId: "assignStudentsToClass",
        summary: "Assign students to a class",
        description: "Assigns one or more students to a specific class with duplicate prevention",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Students assigned successfully",
                content: {
                    "application/json": {
                        schema: resolver(assignmentResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - validation error or duplicates",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", assignStudentsRequestBodySchema),
    ClassController.assignStudentsToClass
);

app.delete(
    "/:class_id/students/remove",
    describeRoute({
        tags: ["Class"],
        operationId: "removeStudentsFromClass",
        summary: "Remove students from a class",
        description: "Removes one or more students from a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Students removed successfully",
                content: {
                    "application/json": {
                        schema: resolver(assignmentResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - validation error or students not in class",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", assignStudentsRequestBodySchema),
    ClassController.removeStudentsFromClass
);

// Teacher assignment routes
app.post(
    "/:class_id/teachers/assign",
    describeRoute({
        tags: ["Class"],
        operationId: "assignTeachersToClass",
        summary: "Assign teachers to a class",
        description: "Assigns one or more teachers to a specific class with duplicate prevention",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Teachers assigned successfully",
                content: {
                    "application/json": {
                        schema: resolver(assignmentResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - validation error or duplicates",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", assignTeachersRequestBodySchema),
    ClassController.assignTeachersToClass
);

app.delete(
    "/:class_id/teachers/remove",
    describeRoute({
        tags: ["Class"],
        operationId: "removeTeachersFromClass",
        summary: "Remove teachers from a class",
        description: "Removes one or more teachers from a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Teachers removed successfully",
                content: {
                    "application/json": {
                        schema: resolver(assignmentResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - validation error or teachers not in class",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", assignTeachersRequestBodySchema),
    ClassController.removeTeachersFromClass
);

export default app;
