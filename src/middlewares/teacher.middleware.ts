import { Context, MiddlewareHandler, Next } from "hono";
import { Teacher } from "@/models/teacher.model";
import log, { LogTypes } from "@/libs/logger";


/**
 * Middleware to verify that the authenticated user is a teacher
 * This should be used after authMiddleware
 */
export const teacherMiddleware = (): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");
        const user_id = ctx.get("user_id");
        const campus_id = ctx.get("campus_id");

        // First check if user_type is Teacher
        if (user_type !== "Teacher") {
            return ctx.json({
                success: false,
                error: "Access denied. Only teachers can access this resource."
            }, 403);
        }

        // Then verify that a teacher record exists for this user
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
            log(`Teacher middleware error: ${error}`, LogTypes.ERROR, "TEACHER_MIDDLEWARE");
            return ctx.json({
                success: false,
                error: "Internal server error while verifying teacher profile."
            }, 500);
        }
    };
};

/**
 * Optional middleware to check teacher role but don't fail if not a teacher
 * Useful for endpoints that can be accessed by multiple user types
 */
// export const optionalTeacherMiddleware = (): MiddlewareHandler => {
//     return async (ctx: Context, next: Next) => {
//         const user_type = ctx.get("user_type");
//         const user_id = ctx.get("user_id");
//         const campus_id = ctx.get("campus_id");

//         // Only check for teacher if user_type is Teacher
//         if (user_type === "Teacher") {
//             try {
//                 const teacher = await Teacher.findOne({
//                     user_id,
//                     campus_id,
//                 });

//                 if (teacher) {
//                     // Add teacher information to context
//                     ctx.set("teacher_id", teacher.id);
//                     ctx.set("teacher_data", teacher);
//                 }
//             } catch (error) {
//                 log(`Optional teacher middleware error: ${error}`, LogTypes.ERROR, "TEACHER_MIDDLEWARE");
//                 // Don't fail the request, just log the error
//             }
//         }

//         await next();
//     };
// };
