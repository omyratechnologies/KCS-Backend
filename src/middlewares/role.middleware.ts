import { Context, MiddlewareHandler, Next } from "hono";

import { actionMap, ActionType } from "@/store/role.store";

export const roleMiddleware = (actionName: ActionType): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");

        if (!user_type) {
            return ctx.json({ error: "Unauthorized" }, 401);
        }

        const actions = actionMap[user_type as keyof typeof actionMap];
        if (!actions) {
            return ctx.json({ error: "Unauthorized" }, 401);
        }

        if (actions.includes(actionName)) {
            ctx.set("action", actionName);
        } else {
            return ctx.json({ error: "Unauthorized" }, 401);
        }

        await next();
    };
};

export const checkUserType = (requiredUserTypes: string[]): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");

        if (!user_type) {
            return ctx.json({ error: "Unauthorized" }, 401);
        }

        const normalizedUserType = user_type.toLowerCase();
        const normalizedRequiredTypes = requiredUserTypes.map(type => type.toLowerCase());

        if (normalizedRequiredTypes.includes(normalizedUserType)) {
            await next();
        } else {
            return ctx.json({ error: "Forbidden: Insufficient permissions" }, 403);
        }
    };
};
