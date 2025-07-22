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
                    teacher_ids: string[];
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

    public static readonly getAllAssignmentbyUserId = async (
        ctx: Context
    ) => {
        try {
            const user_id = ctx.get("user_id");
            const result = await classService.getAllAssignmentByUserId(user_id);
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

            // Get the assignment to extract campus_id
            const assignment = await classService.getAssignmentById(assignment_id);
            if (!assignment) {
                return ctx.json({ error: "Assignment not found" }, 404);
            }

            // Add campus_id from assignment to the submission data
            const submissionData = {
                ...data,
                campus_id: assignment.campus_id,
            };

            const result = await classService.createAssignmentSubmission(
                assignment_id,
                submissionData
            );

            if (!result) {
                return ctx.json({ error: "Failed to create assignment submission" }, 500);
            }

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

    // Assign students to class
    public static readonly assignStudentsToClass = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();
            const { student_ids }: { student_ids: string[] } = await ctx.req.json();

            if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
                return ctx.json({ error: "student_ids array is required and cannot be empty" }, 400);
            }

            const result = await classService.assignStudentsToClass(class_id, student_ids);

            return ctx.json({
                success: true,
                message: "Students assigned to class successfully",
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 400);
            }
            return ctx.json({ error: "An unexpected error occurred" }, 500);
        }
    };

    // Remove students from class
    public static readonly removeStudentsFromClass = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();
            const { student_ids }: { student_ids: string[] } = await ctx.req.json();

            if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
                return ctx.json({ error: "student_ids array is required and cannot be empty" }, 400);
            }

            const result = await classService.removeStudentsFromClass(class_id, student_ids);

            return ctx.json({
                success: true,
                message: "Students removed from class successfully",
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 400);
            }
            return ctx.json({ error: "An unexpected error occurred" }, 500);
        }
    };

    // Assign teachers to class
    public static readonly assignTeachersToClass = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();
            const { teacher_ids }: { teacher_ids: string[] } = await ctx.req.json();

            if (!teacher_ids || !Array.isArray(teacher_ids) || teacher_ids.length === 0) {
                return ctx.json({ error: "teacher_ids array is required and cannot be empty" }, 400);
            }

            const result = await classService.assignTeachersToClass(class_id, teacher_ids);

            return ctx.json({
                success: true,
                message: "Teachers assigned to class successfully",
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 400);
            }
            return ctx.json({ error: "An unexpected error occurred" }, 500);
        }
    };

    // Remove teachers from class
    public static readonly removeTeachersFromClass = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();
            const { teacher_ids }: { teacher_ids: string[] } = await ctx.req.json();

            if (!teacher_ids || !Array.isArray(teacher_ids) || teacher_ids.length === 0) {
                return ctx.json({ error: "teacher_ids array is required and cannot be empty" }, 400);
            }

            const result = await classService.removeTeachersFromClass(class_id, teacher_ids);

            return ctx.json({
                success: true,
                message: "Teachers removed from class successfully",
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 400);
            }
            return ctx.json({ error: "An unexpected error occurred" }, 500);
        }
    };

    public static readonly getAllAssignmentsFromAllClasses = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const result = await classService.getAllAssignmentsFromAllClasses(campus_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    // Get students by academic year and optional class_id filter
    public static readonly getStudentsByYearAndClass = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { academic_year, class_id } = ctx.req.query();

            if (!academic_year) {
                return ctx.json({ error: "academic_year query parameter is required" }, 400);
            }

            const result = await classService.getStudentsByYearAndClassId(
                campus_id,
                academic_year,
                class_id
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };

    // Get students grouped by class for a specific academic year
    public static readonly getStudentsGroupedByClassForYear = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { academic_year } = ctx.req.query();

            if (!academic_year) {
                return ctx.json({ error: "academic_year query parameter is required" }, 400);
            }

            const result = await classService.getStudentsGroupedByClassForYear(
                campus_id,
                academic_year
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };

    // Get all available academic years for the campus
    public static readonly getAcademicYears = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const academicYears = await classService.getAcademicYearsByCampus(campus_id);

            return ctx.json({ academic_years: academicYears });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };

    public static readonly getStudentsByClassId = async (ctx: Context) => {
        try {
            const { class_id } = ctx.req.param();

            const students = await classService.getStudentsByClassId(class_id);

            return ctx.json({
                class_id,
                students,
                total_students: students.length
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };

    public static readonly gradeAssignmentSubmission = async (ctx: Context) => {
        try {
            const { submission_id } = ctx.req.param();
            const { grade, feedback } = await ctx.req.json();

            const result = await classService.gradeAssignmentSubmission(
                submission_id,
                grade,
                feedback
            );

            return ctx.json({
                success: true,
                message: "Assignment submission graded successfully",
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };

    public static readonly getStudentAssignmentsWithSubmissions = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");

            const assignments = await classService.getStudentAssignmentsWithSubmissions(
                student_id,
                campus_id
            );

            return ctx.json({ assignments });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };

    public static readonly updateAssignmentSubmission = async (ctx: Context) => {
        try {
            const { submission_id } = ctx.req.param();
            const data = await ctx.req.json();

            const result = await classService.updateAssignmentSubmission(
                submission_id,
                data
            );

            return ctx.json({
                success: true,
                message: "Assignment submission updated successfully",
                data: result
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };

    public static readonly getAssignmentsDueSoon = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const { days } = ctx.req.query();
            const campus_id = ctx.get("campus_id");

            const daysAhead = days ? Number.parseInt(days as string) : 7;

            const assignments = await classService.getAssignmentsDueSoon(
                student_id,
                campus_id,
                daysAhead
            );

            return ctx.json({
                assignments,
                total_count: assignments.length
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
            return ctx.json({ error: "Internal server error" }, 500);
        }
    };
}
