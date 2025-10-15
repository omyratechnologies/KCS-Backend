import { Context, MiddlewareHandler, Next } from "hono";
import { Teacher } from "@/models/teacher.model";
import log, { LogTypes } from "@/libs/logger";


/**
 * Middleware to verify that the authenticated user is a teacher or admin
 * This should be used after authMiddleware
 * Admins can create groups without teacher profile validation
 */
export const teacherOrAdminMiddleware = (): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");
        const user_id = ctx.get("user_id");
        const campus_id = ctx.get("campus_id");

        // Check if user is Admin or Super Admin
        if (["Admin", "Super Admin"].includes(user_type)) {
            // Admins can create groups without teacher profile
            await next();
            return;
        }

        // If not admin, check if user is a Teacher
        if (user_type !== "Teacher") {
            return ctx.json({
                success: false,
                error: "Access denied. Only teachers and admins can access this resource."
            }, 403);
        }

        // Verify that a teacher record exists for this user
        try {
            const teacher = await Teacher.findOne({
                user_id,
                campus_id,
            });

            if (!teacher) {
                return ctx.json({
                    success: false,
                    error: "Teacher profile not found. Please contact support."
                }, 404);
            }

            // Add teacher information to context for use in controllers
            ctx.set("teacher_id", teacher.id);
            ctx.set("teacher_data", teacher);

            await next();
        } catch (error) {
            log(`Teacher or Admin middleware error: ${error}`, LogTypes.ERROR, "TEACHER_OR_ADMIN_MIDDLEWARE");
            return ctx.json({
                success: false,
                error: "Internal server error while verifying teacher profile."
            }, 500);
        }
    };
};
