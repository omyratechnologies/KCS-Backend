import { Context } from "hono";

import { SemesterReportService } from "@/services/semester_report.service";

export class SemesterReportController {
    /**
     * Admin endpoint: Generate semester report for any student
     * Requires admin authentication
     */
    public static readonly getStudentSemesterReport = async (ctx: Context) => {
        try {
            const { student_id, class_id, semester, academic_year } = await ctx.req.json();

            // Validate semester
            if (semester !== "sem1" && semester !== "sem2") {
                return ctx.json(
                    {
                        success: false,
                        message: "Invalid semester. Must be 'sem1' or 'sem2'",
                    },
                    400
                );
            }

            // Validate required fields
            if (!student_id || !class_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "student_id and class_id are required",
                    },
                    400
                );
            }

            const report = await SemesterReportService.generateSemesterReport(
                student_id,
                class_id,
                semester,
                academic_year
            );

            return ctx.json({
                success: true,
                data: report,
            });
        } catch (error) {
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
                    message: "Internal server error",
                },
                500
            );
        }
    };

    /**
     * Student endpoint: Get own semester report
     * Requires student authentication
     */
    public static readonly getOwnSemesterReport = async (ctx: Context) => {
        try {
            const student_id = ctx.get("user_id");
            
            if (!student_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "User not authenticated",
                    },
                    401
                );
            }

            const { class_id, semester, academic_year } = await ctx.req.json();

            // Validate semester
            if (semester !== "sem1" && semester !== "sem2") {
                return ctx.json(
                    {
                        success: false,
                        message: "Invalid semester. Must be 'sem1' or 'sem2'",
                    },
                    400
                );
            }

            // Validate required fields
            if (!class_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "class_id is required",
                    },
                    400
                );
            }

            const report = await SemesterReportService.generateSemesterReport(
                student_id,
                class_id,
                semester,
                academic_year
            );

            return ctx.json({
                success: true,
                data: report,
            });
        } catch (error) {
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
                    message: "Internal server error",
                },
                500
            );
        }
    };

    /**
     * Parent endpoint: Get semester report for their student
     * Requires parent authentication and validates parent-student relationship
     */
    public static readonly getStudentSemesterReportByParent = async (ctx: Context) => {
        try {
            const parent_id = ctx.get("user_id");
            
            if (!parent_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "User not authenticated",
                    },
                    401
                );
            }

            const { student_id, class_id, semester, academic_year } = await ctx.req.json();

            // Validate semester
            if (semester !== "sem1" && semester !== "sem2") {
                return ctx.json(
                    {
                        success: false,
                        message: "Invalid semester. Must be 'sem1' or 'sem2'",
                    },
                    400
                );
            }

            // Validate required fields
            if (!student_id || !class_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "student_id and class_id are required",
                    },
                    400
                );
            }

            // Verify parent has access to this student's data
            const hasAccess = await SemesterReportService.verifyParentAccess(parent_id, student_id);
            if (!hasAccess) {
                return ctx.json(
                    {
                        success: false,
                        message: "You do not have access to this student's data",
                    },
                    403
                );
            }

            const report = await SemesterReportService.generateSemesterReport(
                student_id,
                class_id,
                semester,
                academic_year
            );

            return ctx.json({
                success: true,
                data: report,
            });
        } catch (error) {
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
                    message: "Internal server error",
                },
                500
            );
        }
    };
}
