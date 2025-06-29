import { Context } from "hono";

import { StudentPerformanceService } from "@/services/student_performance.service";

export class StudentPerformanceController {
    // Get student performance by semester
    public static readonly getStudentPerformanceBySemester = async (
        ctx: Context
    ) => {
        try {
            const student_id = ctx.req.param("student_id");
            const semester = ctx.req.param("semester");
            const academic_year = ctx.req.query("academic_year");

            const performance =
                await StudentPerformanceService.getStudentPerformanceBySemester(
                    student_id,
                    semester,
                    academic_year
                );

            if (!performance) {
                return ctx.json(
                    {
                        message: "Performance data not found for the specified semester",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                data: performance,
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
        }
    };

    // Get student performance by academic year (all semesters)
    public static readonly getStudentPerformanceByAcademicYear = async (
        ctx: Context
    ) => {
        try {
            const student_id = ctx.req.param("student_id");
            const academic_year = ctx.req.param("academic_year");

            const performance =
                await StudentPerformanceService.getStudentPerformanceByAcademicYear(
                    student_id,
                    academic_year
                );

            return ctx.json({
                success: true,
                data: performance,
                count: performance.length,
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
        }
    };

    // Get all student performance records
    public static readonly getAllStudentPerformance = async (ctx: Context) => {
        try {
            const student_id = ctx.req.param("student_id");

            const performance =
                await StudentPerformanceService.getAllStudentPerformance(
                    student_id
                );

            return ctx.json({
                success: true,
                data: performance,
                count: performance.length,
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
        }
    };

    // Get performance summary
    public static readonly getPerformanceSummary = async (ctx: Context) => {
        try {
            const student_id = ctx.req.param("student_id");
            const academic_years = ctx.req.query("academic_years");
            
            let academicYearsArray: string[] | undefined;
            if (academic_years) {
                academicYearsArray = academic_years.split(",");
            }

            const summary =
                await StudentPerformanceService.getPerformanceSummary(
                    student_id,
                    academicYearsArray
                );

            return ctx.json({
                success: true,
                data: summary,
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
        }
    };

    // Create or update student performance
    public static readonly createOrUpdateStudentPerformance = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");
            const {
                student_id,
                academic_year,
                semester,
                class_id,
                performance_data,
                attendance,
                quiz_performance,
                assignment_performance,
            } = await ctx.req.json();

            const performance =
                await StudentPerformanceService.createOrUpdateStudentPerformance(
                    campus_id,
                    student_id,
                    academic_year,
                    semester,
                    class_id,
                    {
                        performance_data,
                        attendance,
                        quiz_performance,
                        assignment_performance,
                    }
                );

            return ctx.json({
                success: true,
                data: performance,
                message: "Student performance data saved successfully",
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
        }
    };

    // Calculate and save performance metrics
    public static readonly calculateAndSavePerformanceMetrics = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { student_id, semester, academic_year, class_id } =
                await ctx.req.json();

            // Calculate performance metrics from raw data
            const calculatedMetrics =
                await StudentPerformanceService.calculatePerformanceMetrics(
                    student_id,
                    semester,
                    academic_year
                );

            // Save the calculated metrics
            const performance =
                await StudentPerformanceService.createOrUpdateStudentPerformance(
                    campus_id,
                    student_id,
                    academic_year,
                    semester,
                    class_id,
                    calculatedMetrics
                );

            return ctx.json({
                success: true,
                data: performance,
                message: "Performance metrics calculated and saved successfully",
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
        }
    };

    // Get current student's performance (authenticated student)
    public static readonly getCurrentStudentPerformance = async (
        ctx: Context
    ) => {
        try {
            const user = ctx.get("user");
            const student_id = user.user_id;
            const semester = ctx.req.query("semester");
            const academic_year = ctx.req.query("academic_year");

            if (semester) {
                // Get specific semester performance
                const performance =
                    await StudentPerformanceService.getStudentPerformanceBySemester(
                        student_id,
                        semester,
                        academic_year
                    );

                if (!performance) {
                    return ctx.json(
                        {
                            success: false,
                            message: "Performance data not found for the specified semester",
                        },
                        404
                    );
                }

                return ctx.json({
                    success: true,
                    data: performance,
                });
            } else {
                // Get all performance records
                const performance =
                    await StudentPerformanceService.getAllStudentPerformance(
                        student_id
                    );

                return ctx.json({
                    success: true,
                    data: performance,
                    count: performance.length,
                });
            }
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
        }
    };

    // Get current student's performance summary (authenticated student)
    public static readonly getCurrentStudentPerformanceSummary = async (
        ctx: Context
    ) => {
        try {
            const user = ctx.get("user");
            const student_id = user.user_id;
            const academic_years = ctx.req.query("academic_years");

            let academicYearsArray: string[] | undefined;
            if (academic_years) {
                academicYearsArray = academic_years.split(",");
            }

            const summary =
                await StudentPerformanceService.getPerformanceSummary(
                    student_id,
                    academicYearsArray
                );

            return ctx.json({
                success: true,
                data: summary,
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
        }
    };
}
