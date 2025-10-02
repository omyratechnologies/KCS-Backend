import { Context, MiddlewareHandler, Next } from "hono";
import { ParentFeedControlService } from "@/services/parent_feed_control.service";

export const studentFeedAccessMiddleware = (): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");
        const user_id = ctx.get("user_id");
        
        // Only apply this middleware to students
        if (user_type !== "Student") {
            await next();
            return;
        }

        try {
            // Check if student has feed access
            const hasAccess = await ParentFeedControlService.checkStudentFeedAccess(user_id);

            if (!hasAccess) {
                return ctx.json({
                    success: false,
                    error: "Feed access has been disabled by your parent/guardian."
                }, 403);
            }
        } catch {
            // Log the error for debugging and allow access (fail-open approach)
            // In production, you might want to log this properly
            // For now, continue to allow access to prevent system breaking
        }
        
        await next();
    };
};