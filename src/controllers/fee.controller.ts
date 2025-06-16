import { Context } from "hono";

import { FeeService } from "@/services/fee.service";

export class FeeController {
    // getFeeByUserId
    public static readonly getFeeByUserId = async (ctx: Context) => {
        try {
            const { user_id } = ctx.req.param();

            const fee = await FeeService.getFeeByUserId(user_id);

            return ctx.json(fee);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // update fee
    public static readonly updateFee = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const data = await ctx.req.json();

            const fee = await FeeService.updateFee(id, data);

            return ctx.json(fee);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
}
