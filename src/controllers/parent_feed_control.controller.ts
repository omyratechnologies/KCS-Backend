import { Context } from "hono";
import { ParentFeedControlService } from "@/services/parent_feed_control.service";

export class ParentFeedControlController {

    // Get current feed access status for a student
    public static readonly getStudentFeedStatus = async (ctx: Context) => {
        try {
            const parent_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { student_id } = ctx.req.param();

            if (user_type !== "Parent") {
                return ctx.json({
                    success: false,
                    error: "Only parents can check feed access status"
                }, 403);
            }

            // Get the current control setting and access status
            const control = await ParentFeedControlService.getFeedControl(parent_id, student_id);
            const accessStatus = await ParentFeedControlService.checkStudentFeedAccess(student_id);

            return ctx.json({
                success: true,
                data: {
                    student_id,
                    feed_access_enabled: control?.feed_access_enabled ?? true, // Default true if no control exists
                    current_access: accessStatus
                }
            });
        } catch (error) {
            return ctx.json({
                success: false,
                error: `Failed to get feed status: ${error}`
            }, 500);
        }
    };

    // Toggle feed access for a student (enable/disable with boolean)
    public static readonly toggleStudentFeedAccess = async (ctx: Context) => {
        try {
            const parent_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const campus_id = ctx.get("campus_id");
            const { student_id } = ctx.req.param();
            const data = await ctx.req.json();

            if (user_type !== "Parent") {
                return ctx.json({
                    success: false,
                    error: "Only parents can control feed access"
                }, 403);
            }

            if (typeof data.feed_access_enabled !== "boolean") {
                return ctx.json({
                    success: false,
                    error: "feed_access_enabled must be a boolean value"
                }, 400);
            }

            const control = await ParentFeedControlService.setFeedAccess(
                parent_id, 
                student_id, 
                campus_id,
                data.feed_access_enabled
            );

            return ctx.json({
                success: true,
                message: `Feed access ${data.feed_access_enabled ? 'enabled' : 'disabled'} successfully`,
                data: {
                    student_id,
                    feed_access_enabled: control.feed_access_enabled,
                    updated_at: control.updated_at
                }
            });
        } catch (error) {
            return ctx.json({
                success: false,
                error: `Failed to update feed access: ${error}`
            }, 500);
        }
    };
}