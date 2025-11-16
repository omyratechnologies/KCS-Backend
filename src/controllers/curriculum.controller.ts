import { Context } from "hono";

import { CurriculumService } from "@/services/curriculum.service";
import { SubjectService } from "@/services/subject.service";
import { createCurriculumRequestBodySchema, updateCurriculumRequestBodySchema } from "@/schema/curriculum";

export class CurriculumController {
    public static readonly createCurriculum = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Authorization: Only Teacher or Admin can create curriculum
            if (user_type !== "Teacher" && user_type !== "Admin") {
                return ctx.json(
                    {
                        message: "Unauthorized. Only Teachers and Admins can create curriculum.",
                    },
                    403
                );
            }

            const body = await ctx.req.json();

            const bodyKeys = Object.keys(body);
            const allowedKeys = ["units, subject_id"];
            const extraKeys = bodyKeys.filter(key => !allowedKeys.includes(key));
            
            if (extraKeys.length > 0) {
                return ctx.json(
                    {
                        message: `Invalid fields in request body: ${extraKeys.join(", ")}. Only 'units' is allowed.`,
                    },
                    400
                );
            }

            // Validate request body using Zod schema
            const validationResult = createCurriculumRequestBodySchema.safeParse(body);
            
            if (!validationResult.success) {
                return ctx.json(
                    {
                        message: "Invalid request body",
                        errors: validationResult.error.errors,
                    },
                    400
                );
            }

            const { subject_id, units } = validationResult.data;

            // Validate if subject exists
            try {
                await SubjectService.getSubjectById(subject_id);
            } catch {
                return ctx.json(
                    {
                        message: "Invalid subject_id. Subject does not exist.",
                    },
                    400
                );
            }

            const curriculum = await CurriculumService.createCurriculum({
                campus_id,
                subject_id,
                created_by: user_id,
                units,
            });

            return ctx.json(curriculum, 201);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes("already exists")) {
                    return ctx.json(
                        {
                            message: error.message,
                        },
                            409
                    );
                }
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
                    404
                );
            }
        }
    };

    public static readonly getCurriculumBySubjectId = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const subject_id = ctx.req.param("subject_id");

            const curriculum = await CurriculumService.getCurriculumBySubjectId(campus_id, subject_id);

            return ctx.json(curriculum);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    404
                );
            }
        }
    };

    public static readonly getCurriculumsByCampusId = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const label_ids = ctx.req.query("label_ids")?.split(",").filter(Boolean);

            const curriculums = await CurriculumService.getCurriculumsByCampusId(campus_id, label_ids);

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
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Authorization: Only Teacher or Admin can update curriculum
            if (user_type !== "Teacher" && user_type !== "Admin") {
                return ctx.json(
                    {
                        message: "Unauthorized. Only Teachers and Admins can update curriculum.",
                    },
                    403
                );
            }

            // Validate curriculum ID
            if (!id || typeof id !== "string" || id.trim() === "") {
                return ctx.json(
                    {
                        message: "Invalid curriculum ID.",
                    },
                    400
                );
            }

            // Validate curriculum exists before proceeding
            try {
                await CurriculumService.getCurriculumById(id);
            } catch {
                return ctx.json(
                    {
                        message: "Curriculum not found.",
                    },
                    404
                );
            }

            const body = await ctx.req.json();

            // Validate that only 'units' key exists in the request body
            const bodyKeys = Object.keys(body);
            const allowedKeys = ["units"];
            const extraKeys = bodyKeys.filter(key => !allowedKeys.includes(key));
            
            if (extraKeys.length > 0) {
                return ctx.json(
                    {
                        message: `Invalid fields in request body: ${extraKeys.join(", ")}. Only 'units' is allowed.`,
                    },
                    400
                );
            }

            // Validate request body using Zod schema
            const validationResult = updateCurriculumRequestBodySchema.safeParse(body);
            
            if (!validationResult.success) {
                return ctx.json(
                    {
                        message: "Invalid request body",
                        errors: validationResult.error.errors,
                    },
                    400
                );
            }

            const { units } = validationResult.data;

            // Validate that units field is provided
            if (units === undefined) {
                return ctx.json(
                    {
                        message: "No fields to update. Provide units in the request body.",
                    },
                    400
                );
            }

            const curriculum = await CurriculumService.updateCurriculumById(id, user_id, {
                units,
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
}
