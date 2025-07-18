import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";

import { ClassController } from "@/controllers/class.controller";
import {    assignStudentsRequestBodySchema,
    assignTeachersRequestBodySchema,    classSchema,
    classSubjectSchema,    createClassRequestBodySchema,
    createClassResponseSchema,
    createClassSubjectRequestBodySchema,
    createClassSubjectResponseSchema,
    deleteResponseSchema,    getClassesResponseSchema,
    getClassSubjectsResponseSchema,
    getStudentsByClassIdResponseSchema,    updateClassRequestBodySchema,
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

// Students by year and class routes
app.get(
    "/students-by-year",
    describeRoute({
        tags: ["Class"],
        operationId: "getStudentsByYearAndClass",
        summary: "Get students by academic year and optional class filter",
        description: "Retrieves all students for a specific academic year, optionally filtered by class_id",
        parameters: [
            {
                name: "academic_year",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "Academic year (e.g., '2023-2024')",
                example: "2023-2024"
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Optional class ID to filter students by specific class",
                example: "class123"
            }
        ],
        responses: {
            200: {
                description: "Students retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                students: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string" },
                                            first_name: { type: "string" },
                                            last_name: { type: "string" },
                                            email: { type: "string" },
                                            phone: { type: "string" },
                                            user_type: { type: "string" },
                                            campus_id: { type: "string" }
                                        }
                                    }
                                },
                                academic_year: { type: "string" },
                                total_students: { type: "number" },
                                classes_included: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Class" }
                                }
                            }
                        }
                    },
                },
            },
            400: {
                description: "Bad request - missing academic_year parameter",
            },
            500: {
                description: "Internal server error",
            },
        },
    }),
    ClassController.getStudentsByYearAndClass
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

// Get students by class ID
app.get(
    "/:class_id/students",
    describeRoute({
        tags: ["Class"],
        operationId: "getStudentsByClassId",
        summary: "Get all students by class ID",
        description: "Retrieves all students assigned to a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
                example: "class123"
            },
        ],
        responses: {
            200: {
                description: "List of students in the class",
                content: {
                    "application/json": {
                        schema: resolver(getStudentsByClassIdResponseSchema),
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
    ClassController.getStudentsByClassId
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

app.get(
    "/students-grouped-by-class",
    describeRoute({
        tags: ["Class"],
        operationId: "getStudentsGroupedByClassForYear",
        summary: "Get students grouped by class for academic year",
        description: "Retrieves all students grouped by their respective classes for a specific academic year",
        parameters: [
            {
                name: "academic_year",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "Academic year (e.g., '2023-2024')",
                example: "2023-2024"
            }
        ],
        responses: {
            200: {
                description: "Students grouped by class retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                academic_year: { type: "string" },
                                total_students: { type: "number" },
                                total_classes: { type: "number" },
                                classes: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            class_info: { $ref: "#/components/schemas/Class" },
                                            students: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: { type: "string" },
                                                        first_name: { type: "string" },
                                                        last_name: { type: "string" },
                                                        email: { type: "string" },
                                                        phone: { type: "string" },
                                                        user_type: { type: "string" }
                                                    }
                                                }
                                            },
                                            student_count: { type: "number" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                },
            },
            400: {
                description: "Bad request - missing academic_year parameter",
            },
            500: {
                description: "Internal server error",
            },
        },
    }),
    ClassController.getStudentsGroupedByClassForYear
);

app.get(
    "/academic-years",
    describeRoute({
        tags: ["Class"],
        operationId: "getAcademicYears",
        summary: "Get all academic years",
        description: "Retrieves all available academic years for the campus",
        responses: {
            200: {
                description: "Academic years retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                academic_years: {
                                    type: "array",
                                    items: { type: "string" },
                                    example: ["2023-2024", "2022-2023", "2021-2022"]
                                }
                            }
                        }
                    },
                },
            },
            500: {
                description: "Internal server error",
            },
        },
    }),
    ClassController.getAcademicYears
);

app.get(
    "/student/:student_id/assignments/due-soon",
    describeRoute({
        tags: ["Class"],
        operationId: "getAssignmentsDueSoon",
        summary: "Get assignments due soon for a student",
        description: "Retrieves assignments that are due within the next 7 days for a specific student",
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "days",
                in: "query",
                required: false,
                schema: { type: "number", default: 7 },
                description: "Number of days to look ahead (default: 7)",
            },
        ],
        responses: {
            200: {
                description: "Assignments due soon retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                assignments: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            assignment: { $ref: "#/components/schemas/Assignment" },
                                            days_until_due: { type: "number" },
                                            is_submitted: { type: "boolean" },
                                            class_info: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                    academic_year: { type: "string" }
                                                }
                                            }
                                        }
                                    }
                                },
                                total_count: { type: "number" }
                            }
                        }
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
    ClassController.getAssignmentsDueSoon
);

export default app;
