import { Context, MiddlewareHandler, Next } from "hono";
import { decode, verify } from "hono/jwt";

import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/users.service";
import { config } from "@/utils/env";

export const authMiddleware = (): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        let token =
            ctx.req.header("Authorization") ?? ctx.req.query("access_token");

        if (!token) return ctx.json({ error: "No token provided" }, 401);

        token = token.replace("Bearer ", "");

        const token_data = await verify(token, config.JWT_SECRET, "HS512");

        if (token_data instanceof Error) {
            return ctx.json({ error: token_data.message }, 401);
        }

        const { payload } = decode(token);
        const { user_id, user_type, session_id } = payload as {
            user_id: string;
            user_type: string;
            session_id: string;
        };

        if (user_type !== "Super Admin") {
            const user = await UserService.getUser(user_id);

            if (!user) {
                return ctx.json({ error: "User not found" }, 401);
            }

            ctx.set("campus_id", user.campus_id);
        }
        else if(ctx.req.query("campus_id")) {
            ctx.set("campus_id", ctx.req.query("campus_id"));
        }

        ctx.set("token", token);
        ctx.set("user_id", user_id);
        ctx.set("user_type", user_type);

        await AuthService.checkIfSessionIsValid({
            user_id,
            session_id,
        });

        await next();
    };
};
