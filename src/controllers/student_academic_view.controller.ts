import { Context } from "hono";

import { StudentAcademicViewService } from "@/services/student_academic_view.service";

export class StudentAcademicViewController {
    /**
     * Get detailed academic view for the authenticated student
     */
    public static readonly getMyAcademicView = async (ctx: Context) => {
        try {
            const user = ctx.get("user");
            const student_id = user.user_id;
            const campus_id = user.campus_id || ctx.get("campus_id");

            if (!campus_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Campus ID not found",
                    },
                    400
                );
            }

            const academicView = await StudentAcademicViewService.getStudentAcademicView(
                student_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: academicView,
            });
        } catch (error) {
            console.error("Error in getMyAcademicView:", error);
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
            return ctx.json(
                {
                    success: false,
                    message: "An unexpected error occurred",
                },
                500
            );
        }
    };

    /**
     * Get detailed academic view for a specific student (admin/teacher route)
     */
    public static readonly getStudentAcademicView = async (ctx: Context) => {
        try {
            const student_id = ctx.req.param("student_id");
            const campus_id = ctx.get("campus_id");

            if (!campus_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Campus ID not found",
                    },
                    400
                );
            }

            if (!student_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Student ID is required",
                    },
                    400
                );
            }

            const academicView = await StudentAcademicViewService.getStudentAcademicView(
                student_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: academicView,
            });
        } catch (error) {
            console.error("Error in getStudentAcademicView:", error);
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
            return ctx.json(
                {
                    success: false,
                    message: "An unexpected error occurred",
                },
                500
            );
        }
    };
}
