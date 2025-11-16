import { Context } from "hono";

import { LabelService } from "@/services/label.service";

export class LabelController {
    public static readonly createLabel = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Authorization: Only Teacher or Admin can create labels
            if (user_type !== "Teacher" && user_type !== "Admin") {
                return ctx.json(
                    {
                        message: "Unauthorized. Only Teachers and Admins can create labels.",
                    },
                    403
                );
            }

            const body = await ctx.req.json();

            const bodyKeys = Object.keys(body);
            const allowedKeys = ["name", "color"];
            const extraKeys = bodyKeys.filter((key) => !allowedKeys.includes(key));

            if (extraKeys.length > 0) {
                return ctx.json(
                    {
                        message: `Invalid fields in request body: ${extraKeys.join(", ")}`,
                    },
                    400
                );
            }

            const {
                name,
                color,
            }: {
                name: string;
                color: string;
            } = body;

          

            const label = await LabelService.createLabel({
                campus_id,
                name,
                color,
                created_by: user_id,
            });

            return ctx.json(label, 201);
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

    public static readonly getLabelById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const label = await LabelService.getLabelById(id);

            return ctx.json(label);
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

    public static readonly getLabelsByCampusId = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const labels = await LabelService.getLabelsByCampusId(campus_id);

            return ctx.json(labels);
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

    public static readonly updateLabelById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Authorization: Only Teacher or Admin can update labels
            if (user_type !== "Teacher" && user_type !== "Admin") {
                return ctx.json(
                    {
                        message: "Unauthorized. Only Teachers and Admins can update labels.",
                    },
                    403
                );
            }

            const body = await ctx.req.json();

            const bodyKeys = Object.keys(body);
            const allowedKeys = ["name", "color"];
            const extraKeys = bodyKeys.filter((key) => !allowedKeys.includes(key));

            if (extraKeys.length > 0) {
                return ctx.json(
                    {
                        message: `Invalid fields in request body: ${extraKeys.join(", ")}`,
                    },
                    400
                );
            }

            const {
                name,
                color,
            }: {
                name?: string;
                color?: string;
            } = body;

            const label = await LabelService.updateLabelById(id, user_id, {
                name,
                color,
            });

            return ctx.json(label);
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

    public static readonly deleteLabelById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const user_type = ctx.get("user_type");

            // Authorization: Only Admin can delete labels
            if (user_type !== "Admin") {
                return ctx.json(
                    {
                        message: "Unauthorized. Only Admins can delete labels.",
                    },
                    403
                );
            }

            const result = await LabelService.deleteLabelById(id);

            return ctx.json(result);
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
