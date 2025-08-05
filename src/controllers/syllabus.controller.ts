import { Context } from "hono";

import { ISyllabusData } from "@/models/syllabus.model";
import { SyllabusService } from "@/services/syllabus.service";

export class SyllabusController {
    // Create a new syllabus
    public static readonly createSyllabus = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const syllabusData: {
                subject_id: string;
                name: string;
                description: string;
                meta_data: object;
            } = await ctx.req.json();

            const syllabus = await SyllabusService.createSyllabus(campus_id, syllabusData);

            return ctx.json(syllabus);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Get all syllabuses
    public static readonly getAllSyllabuses = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const syllabuses = await SyllabusService.getSyllabusByCampusId(campus_id);
            return ctx.json(syllabuses);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Get syllabus by ID
    public static readonly getSyllabusById = async (ctx: Context) => {
        try {
            const syllabusId = ctx.req.param("id");
            const syllabus = await SyllabusService.getSyllabusById(syllabusId);
            return ctx.json(syllabus);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Update syllabus by ID
    public static readonly updateSyllabusById = async (ctx: Context) => {
        try {
            const syllabusId = ctx.req.param("id");

            const syllabusData: Partial<ISyllabusData> = await ctx.req.json();

            const syllabus = await SyllabusService.updateSyllabusById(syllabusId, syllabusData);
            return ctx.json(syllabus);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Delete syllabus by ID
    public static readonly deleteSyllabusById = async (ctx: Context) => {
        try {
            const syllabusId = ctx.req.param("id");
            const syllabus = await SyllabusService.deleteSyllabusById(syllabusId);
            return ctx.json(syllabus);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
}
