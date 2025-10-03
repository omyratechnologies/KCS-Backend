import { Context } from "hono";

import { ReportCardService } from "@/services/report_card.service";

export class ReportCardController {
    /**
     * Student: Get their own monthly report card
     */
    public static readonly getMyReportCard = async (ctx: Context) => {
        try {
            const student_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const { month } = ctx.req.query();

            if (!month) {
                return ctx.json(
                    {
                        success: false,
                        error: "Month parameter is required (format: YYYY-MM)",
                    },
                    400
                );
            }

            const reportCard = await ReportCardService.getMonthlyReportCard(student_id, campus_id, month);

            return ctx.json({
                success: true,
                data: reportCard,
                message: "Report card retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching student report card:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch report card",
                },
                error instanceof Error && error.message.includes("not found") ? 404 : 500
            );
        }
    };

    /**
     * Student: Generate/Download their own monthly report card
     */
    public static readonly generateMyReportCard = async (ctx: Context) => {
        try {
            const student_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const { month, academic_year } = ctx.req.query();

            if (!month) {
                return ctx.json(
                    {
                        success: false,
                        error: "Month parameter is required (format: YYYY-MM)",
                    },
                    400
                );
            }

            // Validate month format
            const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
            if (!monthRegex.test(month)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Invalid month format. Use YYYY-MM (e.g., 2024-03)",
                    },
                    400
                );
            }

            // Validate that month is not in the future
            const currentDate = new Date();
            const requestedMonth = new Date(`${month}-01`);
            if (requestedMonth > currentDate) {
                return ctx.json(
                    {
                        success: false,
                        error: "Cannot generate report card for future months",
                    },
                    400
                );
            }

            const reportCard = await ReportCardService.generateMonthlyReportCard(
                student_id,
                campus_id,
                month,
                student_id, // Student generates their own report
                academic_year
            );

            return ctx.json({
                success: true,
                data: reportCard,
                message: "Report card generated successfully",
            });
        } catch (error) {
            console.error("Error generating student report card:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to generate report card",
                },
                500
            );
        }
    };

    /**
     * Student: Get available months with report cards
     */
    public static readonly getMyAvailableMonths = async (ctx: Context) => {
        try {
            const student_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const availableMonths = await ReportCardService.getAvailableMonths(student_id, campus_id, false);

            return ctx.json({
                success: true,
                data: availableMonths,
                count: availableMonths.length,
                message: "Available months retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching available months:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch available months",
                },
                500
            );
        }
    };

    /**
     * Teacher/Admin: Get report card for any student
     */
    public static readonly getStudentReportCard = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const { month } = ctx.req.query();

            if (!month) {
                return ctx.json(
                    {
                        success: false,
                        error: "Month parameter is required (format: YYYY-MM)",
                    },
                    400
                );
            }

            const reportCard = await ReportCardService.getMonthlyReportCard(student_id, campus_id, month);

            return ctx.json({
                success: true,
                data: reportCard,
                message: "Report card retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching student report card:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch report card",
                },
                error instanceof Error && error.message.includes("not found") ? 404 : 500
            );
        }
    };

    /**
     * Teacher/Admin: Get all report cards for a student
     */
    public static readonly getAllStudentReportCards = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const { academic_year } = ctx.req.query();

            const reportCards = await ReportCardService.getAllReportCards(student_id, campus_id, academic_year);

            return ctx.json({
                success: true,
                data: reportCards,
                count: reportCards.length,
                message: "Report cards retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching student report cards:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch report cards",
                },
                500
            );
        }
    };

    /**
     * Teacher/Admin: Get available months for a student
     */
    public static readonly getStudentAvailableMonths = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const { include_unpublished } = ctx.req.query();

            const includeUnpublished = include_unpublished === "true";
            const availableMonths = await ReportCardService.getAvailableMonths(
                student_id,
                campus_id,
                includeUnpublished
            );

            return ctx.json({
                success: true,
                data: availableMonths,
                count: availableMonths.length,
                message: "Available months retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching student available months:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch available months",
                },
                500
            );
        }
    };

    /**
     * Teacher/Admin: Generate monthly report card for a student
     */
    public static readonly generateReportCard = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const generated_by = ctx.get("user_id");
            const { month, academic_year } = ctx.req.query();

            if (!month) {
                return ctx.json(
                    {
                        success: false,
                        error: "Month parameter is required (format: YYYY-MM)",
                    },
                    400
                );
            }

            // Validate month format
            const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
            if (!monthRegex.test(month)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Invalid month format. Use YYYY-MM (e.g., 2024-03)",
                    },
                    400
                );
            }

            const reportCard = await ReportCardService.generateMonthlyReportCard(
                student_id,
                campus_id,
                month,
                generated_by,
                academic_year
            );

            return ctx.json({
                success: true,
                data: reportCard,
                message: "Report card generated successfully",
            });
        } catch (error) {
            console.error("Error generating report card:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to generate report card",
                },
                500
            );
        }
    };

    /**
     * Teacher/Admin: Update teacher remarks and achievements
     */
    public static readonly updateReportCardRemarks = async (ctx: Context) => {
        try {
            const { report_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const updated_by = ctx.get("user_id");
            const body = await ctx.req.json();

            const reportCard = await ReportCardService.updateTeacherRemarks(report_id, campus_id, updated_by, body);

            return ctx.json({
                success: true,
                data: reportCard,
                message: "Report card updated successfully",
            });
        } catch (error) {
            console.error("Error updating report card:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update report card",
                },
                error instanceof Error && error.message.includes("not found") ? 404 : 500
            );
        }
    };

    /**
     * Teacher/Admin: Publish report card (make visible to student/parent)
     */
    public static readonly publishReportCard = async (ctx: Context) => {
        try {
            const { report_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");

            await ReportCardService.publishReportCard(report_id, campus_id);

            return ctx.json({
                success: true,
                message: "Report card published successfully",
            });
        } catch (error) {
            console.error("Error publishing report card:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to publish report card",
                },
                error instanceof Error && error.message.includes("not found") ? 404 : 500
            );
        }
    };

    /**
     * Teacher/Admin: Finalize report card (no more edits)
     */
    public static readonly finalizeReportCard = async (ctx: Context) => {
        try {
            const { report_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");

            await ReportCardService.finalizeReportCard(report_id, campus_id);

            return ctx.json({
                success: true,
                message: "Report card finalized successfully",
            });
        } catch (error) {
            console.error("Error finalizing report card:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to finalize report card",
                },
                error instanceof Error && error.message.includes("not found") ? 404 : 500
            );
        }
    };
}
