import { Context } from "hono";

import { StudentRecordService } from "@/services/student_record.service";

export class StudentRecordController {
    public static readonly createStudentRecord = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { record_data, student_id } = await ctx.req.json();

            const studentRecord =
                await StudentRecordService.createStudentRecord(
                    campus_id,
                    student_id,
                    record_data
                );

            return ctx.json(studentRecord);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly getStudentRecordByStudentId = async (
        ctx: Context
    ) => {
        try {
            const student_id = ctx.req.param("student_id");

            const studentRecords =
                await StudentRecordService.getStudentRecordByStudentId(
                    student_id
                );

            return ctx.json(studentRecords);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly getStudentRecordByCampusId = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const studentRecords =
                await StudentRecordService.getStudentRecordByCampusId(
                    campus_id
                );

            return ctx.json(studentRecords);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly getStudentRecordById = async (ctx: Context) => {
        try {
            const student_record_id = ctx.req.param("student_record_id");

            const studentRecord =
                await StudentRecordService.getStudentRecordById(
                    student_record_id
                );

            return ctx.json(studentRecord);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly updateStudentRecordById = async (ctx: Context) => {
        try {
            const student_record_id = ctx.req.param("student_record_id");

            const { record_data } = await ctx.req.json();

            const studentRecord =
                await StudentRecordService.updateStudentRecordById(
                    student_record_id,
                    {
                        record_data,
                    }
                );

            return ctx.json(studentRecord);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };

    public static readonly deleteStudentRecordById = async (ctx: Context) => {
        try {
            const student_record_id = ctx.req.param("student_record_id");

            const studentRecord =
                await StudentRecordService.deleteStudentRecordById(
                    student_record_id
                );

            return ctx.json(studentRecord);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    message: error.message,
                });
            }
        }
    };
}
