import { Context } from "hono";

import { CurriculumService } from "@/services/curriculum.service";

export class CurriculumController {
    public static readonly createCurriculum = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                name,
                description,
                meta_data,
            }: {
                name: string;
                description: string;
                meta_data: object;
            } = await ctx.req.json();

            const curriculum = await CurriculumService.createCurriculum({
                campus_id,
                name,
                description,
                meta_data,
            });

            return ctx.json(curriculum);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getCurriculumById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const curriculum = await CurriculumService.getCurriculumById(id);

            return ctx.json(curriculum);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly getCurriculumsByCampusId = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const curriculums = await CurriculumService.getCurriculumsByCampusId(campus_id);

            return ctx.json(curriculums);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly updateCurriculumById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const {
                name,
                description,
                meta_data,
            }: {
                name: string;
                description: string;
                meta_data: object;
            } = await ctx.req.json();

            const curriculum = await CurriculumService.updateCurriculumById(id, {
                name,
                description,
                meta_data,
            });

            return ctx.json(curriculum);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
    public static readonly deleteCurriculumById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const curriculum = await CurriculumService.deleteCurriculumById(id);

            return ctx.json(curriculum);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
}
