import { Context } from "hono";

import { IAssignmentData } from "@/models/assignment.model";
import { IAssignmentSubmission } from "@/models/assignment_submission.model";
import { IClassData } from "@/models/class.model";
import { IClassSubjectData } from "@/models/class_subject.model";
import { ClassService } from "@/services/class.service";

const classService = new ClassService();

export class ClassController {
    public static readonly getClassById = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();

            const classData = await classService.getClassById(class_id);

            return ctx.json(classData);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAllClassByCampusId = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const classes = await classService.getAllClassByCampusId(campus_id);

            return ctx.json(classes);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly createClass = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                classData,
            }: {
                classData: {
                    name: string;
                    class_teacher_id: string;
                    student_ids: string[];
                    student_count: number;
                    academic_year: string;
                    class_in_charge: string[];
                };
            } = await ctx.req.json();

            const result = await classService.createClass(campus_id, classData);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly updateClass = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();

            const {
                classData,
            }: {
                classData: Partial<IClassData>;
            } = await ctx.req.json();

            const result = await classService.updateClass(class_id, classData);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly deleteClass = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();

            const result = await classService.deleteClass(class_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAllSubjectsByClassId = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();

            const result = await classService.getAllSubjectsByClassId(class_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAllClassesBySubjectId = async (ctx: Context) => {
        try {
            const { subject_id } = ctx.req.param();

            const result =
                await classService.getAllClassesBySubjectId(subject_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAllClassSubjectsByClassId = async (
        ctx: Context
    ) => {
        try {
            const { class_id } = ctx.req.param();

            const result =
                await classService.getAllClassSubjectsByClassId(class_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly createClassSubject = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { class_id } = ctx.req.param();

            const {
                classSubjectData,
            }: {
                classSubjectData: {
                    subject_id: string;
                    teacher_id: string;
                };
            } = await ctx.req.json();

            const result = await classService.createClassSubject(
                campus_id,
                class_id,
                classSubjectData
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly updateClassSubject = async (ctx: Context) => {
        try {
            const { class_subject_id } = ctx.req.param();

            const {
                classSubjectData,
            }: {
                classSubjectData: Partial<IClassSubjectData>;
            } = await ctx.req.json();

            const result = await classService.updateClassSubject(
                class_subject_id,
                classSubjectData
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly deleteClassSubject = async (ctx: Context) => {
        try {
            const { class_subject_id } = ctx.req.param();

            const result =
                await classService.deleteClassSubject(class_subject_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getClassSubjectById = async (ctx: Context) => {
        try {
            const { class_subject_id } = ctx.req.param();

            const result =
                await classService.getClassSubjectById(class_subject_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    public static readonly getAllAssignmentsByClassId = async (
        ctx: Context
    ) => {
        try {
            const { class_id } = ctx.req.param();

            const result =
                await classService.getAllAssignmentsByClassId(class_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    public static readonly getAssignmentById = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const result = await classService.getAssignmentById(assignment_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly createAssignment = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { class_id } = ctx.req.param();

            const data: Partial<IAssignmentData> = await ctx.req.json();

            // Add required fields with default values
            const assignmentData = {
                ...data,
                user_id, // Get user_id from auth context
                is_graded: data.is_graded ?? false, // Default to false if not provided
                meta_data: data.meta_data ?? {}, // Default to empty object if not provided
            };

            const result = await classService.createAssignment(
                campus_id,
                class_id,
                assignmentData
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly updateAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const data: Partial<IAssignmentData> = await ctx.req.json();

            const result = await classService.updateAssignment(
                assignment_id,
                data
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly deleteAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const result = await classService.deleteAssignment(assignment_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAssignmentSubmissionById = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const result =
                await classService.getAssignmentSubmissionById(submission_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly createAssignmentSubmission = async (
        ctx: Context
    ) => {
        try {
            const { assignment_id } = ctx.req.param();

            const data: Partial<IAssignmentSubmission> = await ctx.req.json();

            const result = await classService.createAssignmentSubmission(
                assignment_id,
                data
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAssignmentSubmissionByAssignmentId = async (
        ctx: Context
    ) => {
        try {
            const { assignment_id } = ctx.req.param();

            const result =
                await classService.getAssignmentSubmissionByAssignmentId(
                    assignment_id
                );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly deleteAssignmentSubmission = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const result =
                await classService.deleteAssignmentSubmission(submission_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAssignmentSubmissionsByUserId = async (
        ctx: Context
    ) => {
        try {
            const { user_id } = ctx.req.param();

            const result =
                await classService.getAssignmentSubmissionsByUserId(user_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getAssignmentSubmissionsByClassId = async (
        ctx: Context
    ) => {
        try {
            const { class_id } = ctx.req.param();

            const result =
                await classService.getAssignmentSubmissionsByClassId(class_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
    public static readonly getClassesByStudentUserId = async (ctx: Context) => {
        try {
            const { studentId } = ctx.req.param();

            const classes = await classService.getClassesByStudentId(studentId);

            return ctx.json(classes);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
}
