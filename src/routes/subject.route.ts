import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { SubjectController } from "@/controllers/subject.controller";
import { SubjectMaterialsController } from "@/controllers/subject_materials.controller";
import {
    createSubjectRequestBodySchema,
    createSubjectResponseSchema,
    deleteSubjectResponseSchema,
    getClassesForSubjectResponseSchema,
    getSubjectsResponseSchema,
    getTeachersForSubjectResponseSchema,
    subjectSchema,
    updateSubjectRequestBodySchema,
    updateSubjectResponseSchema,
} from "@/schema/subject";
import {
    assignTeacherSchema,
    createMaterialSchema,
    updateMaterialSchema,
    materialsListResponseSchema,
    materialResponseSchema,
    subjectDetailsResponseSchema,
    downloadResponseSchema,
    teacherAssignmentResponseSchema,
    errorResponseSchema
} from "@/schema/subject_materials";

const app = new Hono();

app.get(
    "/assignments",
    describeRoute({
        tags: ["Subject"],
        operationId: "getAllSubjectAssignments",
        summary: "Get all subject assignments",
        description: "Retrieves all subject assignments with class, teacher, and academic year details",
        parameters: [
            {
                name: "search",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Search by subject name, code, class name, teacher name, or academic year",
            },
            {
                name: "academic_year",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by academic year",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
            {
                name: "subject_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by subject ID",
            },
            {
                name: "teacher_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by teacher ID",
            },
        ],
        responses: {
            200: {
                description: "List of subject assignments",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: { type: "string" },
                                            subject: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                    code: { type: "string" },
                                                },
                                            },
                                            class: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                },
                                            },
                                            teacher: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    name: { type: "string" },
                                                    email: { type: "string" },
                                                },
                                            },
                                            academic_year: { type: "string" },
                                            created_at: { type: "string", format: "date-time" },
                                            updated_at: { type: "string", format: "date-time" },
                                        },
                                    },
                                },
                                total: { type: "number" },
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
                                success: { type: "boolean" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    SubjectController.getAllSubjectAssignments
);

app.post(
    "/",
    describeRoute({
        tags: ["Subject"],
        operationId: "createSubject",
        summary: "Create a new subject",
        description: "Creates a new subject in the system",
        responses: {
            200: {
                description: "Subject created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createSubjectResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createSubjectRequestBodySchema),
    SubjectController.createSubject
);

app.get(
    "/",
    describeRoute({
        tags: ["Subject"],
        operationId: "getAllSubjects",
        summary: "Get all subjects",
        description: "Retrieves all subjects for a campus",
        responses: {
            200: {
                description: "List of subjects",
                content: {
                    "application/json": {
                        schema: resolver(getSubjectsResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    SubjectController.getAllSubjects
);

app.get(
    "/:subject_id",
    describeRoute({
        tags: ["Subject"],
        operationId: "getSubjectById",
        summary: "Get subject by ID",
        description: "Retrieves a specific subject by ID",
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
                description: "Subject details",
                content: {
                    "application/json": {
                        schema: resolver(subjectSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    SubjectController.getSubjectById
);

app.put(
    "/:subject_id",
    describeRoute({
        tags: ["Subject"],
        operationId: "updateSubject",
        summary: "Update a subject",
        description: "Updates a specific subject by ID",
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
                description: "Subject updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateSubjectResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateSubjectRequestBodySchema),
    SubjectController.updateSubject
);

app.delete(
    "/:subject_id",
    describeRoute({
        tags: ["Subject"],
        operationId: "deleteSubject",
        summary: "Delete a subject",
        description: "Deletes a specific subject by ID",
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
                description: "Subject deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteSubjectResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    SubjectController.deleteSubject
);

app.get(
    "/:subject_id/teachers",
    describeRoute({
        tags: ["Subject"],
        operationId: "getAllTeacherForASubjectById",
        summary: "Get all teachers for a subject",
        description: "Retrieves all teachers assigned to a specific subject",
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
                description: "List of teachers",
                content: {
                    "application/json": {
                        schema: resolver(getTeachersForSubjectResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    SubjectController.getAllTeacherForASubjectById
);

app.get(
    "/:subject_id/classes",
    describeRoute({
        tags: ["Subject"],
        operationId: "getAllClassesForASubjectById",
        summary: "Get all classes for a subject",
        description: "Retrieves all classes that include a specific subject",
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
                        schema: resolver(getClassesForSubjectResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    SubjectController.getAllClassesForASubjectById
);

// Subject Materials Routes

// Get subject with detailed breakdown
app.get(
    "/:subject_id/details",
    describeRoute({
        tags: ["Subject Materials"],
        operationId: "getSubjectDetails",
        summary: "Get subject with detailed breakdown",
        description: "Retrieves a subject with material counts and teacher information",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            }
        ],
        responses: {
            200: {
                description: "Subject details retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(subjectDetailsResponseSchema)
                    }
                }
            },
            400: {
                description: "Subject not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema)
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.getSubjectDetails
);

// Get materials by type
app.get(
    "/:subject_id/materials/:material_type",
    describeRoute({
        tags: ["Subject Materials"],
        operationId: "getMaterialsByType",
        summary: "Get materials by type",
        description: "Retrieves all materials of a specific type for a subject",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            },
            {
                name: "material_type",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["pdfs", "videos", "worksheets", "presentations"] },
                description: "Type of materials to retrieve"
            }
        ],
        responses: {
            200: {
                description: "Materials retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(materialsListResponseSchema)
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.getMaterialsByType
);

// Add material
app.post(
    "/:subject_id/materials/:material_type",
    describeRoute({
        tags: ["Subject Materials"],
        operationId: "addMaterial",
        summary: "Add material to subject",
        description: "Adds a new material to a subject",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            },
            {
                name: "material_type",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["pdfs", "videos", "worksheets", "presentations"] },
                description: "Type of material to add"
            }
        ],
        responses: {
            200: {
                description: "Material added successfully",
                content: {
                    "application/json": {
                        schema: resolver(teacherAssignmentResponseSchema)
                    }
                }
            }
        }
    }),
    zValidator("json", createMaterialSchema),
    SubjectMaterialsController.addMaterial
);

// Get single material
app.get(
    "/:subject_id/materials/:material_type/:material_id",
    describeRoute({
        tags: ["Subject Materials"],
        operationId: "getMaterial",
        summary: "Get single material",
        description: "Retrieves a specific material by ID",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            },
            {
                name: "material_type",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["pdfs", "videos", "worksheets", "presentations"] },
                description: "Type of material"
            },
            {
                name: "material_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Material ID"
            }
        ],
        responses: {
            200: {
                description: "Material retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(materialResponseSchema)
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.getMaterial
);

// Update material
app.put(
    "/:subject_id/materials/:material_type/:material_id",
    describeRoute({
        tags: ["Subject Materials"],
        operationId: "updateMaterial",
        summary: "Update material",
        description: "Updates a specific material",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            },
            {
                name: "material_type",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["pdfs", "videos", "worksheets", "presentations"] },
                description: "Type of material"
            },
            {
                name: "material_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Material ID"
            }
        ],
        responses: {
            200: {
                description: "Material updated successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" }
                            }
                        }
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.updateMaterial
);

// Delete material
app.delete(
    "/:subject_id/materials/:material_type/:material_id",
    describeRoute({
        tags: ["Subject Materials"],
        operationId: "deleteMaterial",
        summary: "Delete material",
        description: "Deletes a specific material",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            },
            {
                name: "material_type",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["pdfs", "videos", "worksheets", "presentations"] },
                description: "Type of material"
            },
            {
                name: "material_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Material ID"
            }
        ],
        responses: {
            200: {
                description: "Material deleted successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" }
                            }
                        }
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.deleteMaterial
);

// Download material
app.post(
    "/:subject_id/materials/:material_type/:material_id/download",
    describeRoute({
        tags: ["Subject Materials"],
        operationId: "downloadMaterial",
        summary: "Download material",
        description: "Initiates material download and increments download count",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            },
            {
                name: "material_type",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["pdfs", "videos", "worksheets", "presentations"] },
                description: "Type of material"
            },
            {
                name: "material_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Material ID"
            }
        ],
        responses: {
            200: {
                description: "Download initiated successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        download_url: { type: "string" },
                                        title: { type: "string" },
                                        size: { type: "string" }
                                    }
                                },
                                message: { type: "string" }
                            }
                        }
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.downloadMaterial
);

// Teacher Management Routes

// Assign teacher to subject
app.post(
    "/:subject_id/teachers",
    describeRoute({
        tags: ["Subject Teachers"],
        operationId: "assignTeacher",
        summary: "Assign teacher to subject",
        description: "Assigns a teacher to a subject with role and schedule",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            }
        ],
        responses: {
            200: {
                description: "Teacher assigned successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" }
                            }
                        }
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.assignTeacher
);

// Remove teacher from subject
app.delete(
    "/:subject_id/teachers/:teacher_id",
    describeRoute({
        tags: ["Subject Teachers"],
        operationId: "removeTeacher",
        summary: "Remove teacher from subject",
        description: "Removes a teacher assignment from a subject",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID"
            },
            {
                name: "teacher_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Teacher ID"
            }
        ],
        responses: {
            200: {
                description: "Teacher removed successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" }
                            }
                        }
                    }
                }
            }
        }
    }),
    SubjectMaterialsController.removeTeacher
);

export default app;
