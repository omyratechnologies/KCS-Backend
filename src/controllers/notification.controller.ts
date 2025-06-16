import { Context } from "hono";

import { ICampusWideNotificationData } from "@/models/campus_wide_notification.model";
import { IClassNotificationData } from "@/models/class_notification.model";
import { IParentNotificationData } from "@/models/parent_notification.model";
import { IStudentNotificationData } from "@/models/student_notification.model";
import { ITeacherNotificationData } from "@/models/teacher_notification.model";
import { NotificationService } from "@/services/notification.service";

export class NotificationController {
    // create campus wide notification
    public static readonly createCampusWideNotification = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                title,
                message,
                meta_data,
            }: {
                title: string;
                message: string;
                meta_data: object;
            } = await ctx.req.json();

            const notification =
                await NotificationService.createCampusWideNotification(
                    campus_id,
                    {
                        title,
                        message,
                        meta_data,
                    }
                );

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get campus wide notifications
    public static readonly getCampusWideNotifications = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const notifications =
                await NotificationService.getCampusWideNotifications(campus_id);

            return ctx.json(notifications);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get campus wide notification by id
    public static readonly getCampusWideNotificationById = async (
        ctx: Context
    ) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.getCampusWideNotificationById(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // update campus wide notification
    public static readonly updateCampusWideNotification = async (
        ctx: Context
    ) => {
        try {
            const id = ctx.req.param("id");

            const data: Partial<ICampusWideNotificationData> =
                await ctx.req.json();

            const notification =
                await NotificationService.updateCampusWideNotification(
                    id,
                    data
                );

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // delete campus wide notification
    public static readonly deleteCampusWideNotification = async (
        ctx: Context
    ) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.deleteCampusWideNotification(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get teacher notifications
    public static readonly getTeacherNotifications = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");

            const notifications =
                await NotificationService.getTeacherNotifications(user_id);

            return ctx.json(notifications);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // create teacher notification
    public static readonly createTeacherNotification = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const data: ITeacherNotificationData = await ctx.req.json();

            const notification =
                await NotificationService.createTeacherNotification(
                    user_id,
                    data
                );

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // updateTeacherNotification
    public static readonly updateTeacherNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const data: ITeacherNotificationData = await ctx.req.json();

            const notification =
                await NotificationService.updateTeacherNotification(id, data);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get teacher notification by id
    public static readonly getTeacherNotificationById = async (
        ctx: Context
    ) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.getTeacherNotificationById(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // delete teacher notification
    public static readonly deleteTeacherNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.deleteTeacherNotification(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get student notifications
    public static readonly getStudentNotifications = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");

            const notifications =
                await NotificationService.getStudentNotifications(user_id);

            return ctx.json(notifications);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // create student notification
    public static readonly createStudentNotification = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const data: IStudentNotificationData = await ctx.req.json();

            const notification =
                await NotificationService.createStudentNotification(
                    user_id,
                    data
                );

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get student notification by id
    public static readonly getStudentNotificationById = async (
        ctx: Context
    ) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.getStudentNotificationById(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // update student notification
    public static readonly updateStudentNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const data: Partial<IStudentNotificationData> =
                await ctx.req.json();

            const notification =
                await NotificationService.updateStudentNotification(id, data);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // delete student notification
    public static readonly deleteStudentNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.deleteStudentNotification(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // create parent notification
    public static readonly createParentNotification = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const data: IParentNotificationData = await ctx.req.json();

            const notification =
                await NotificationService.createParentNotification(
                    user_id,
                    data
                );

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get parent notification by id
    public static readonly getParentNotificationById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.getParentNotificationById(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // update parent notification
    public static readonly updateParentNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const data: Partial<IParentNotificationData> = await ctx.req.json();

            const notification =
                await NotificationService.updateParentNotification(id, data);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // delete parent notification
    public static readonly deleteParentNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.deleteParentNotification(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get parent notifications
    public static readonly getParentNotifications = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");

            const notifications =
                await NotificationService.getParentNotifications(user_id);

            return ctx.json(notifications);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get class notifications
    public static readonly getClassNotifications = async (ctx: Context) => {
        try {
            const class_id = ctx.req.param("class_id");

            const notifications =
                await NotificationService.getClassNotifications(class_id);

            return ctx.json(notifications);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // create class notification
    public static readonly createClassNotification = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const data: IClassNotificationData = await ctx.req.json();

            const notification =
                await NotificationService.createClassNotification(
                    campus_id,
                    data
                );

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // get class notification by id
    public static readonly getClassNotificationById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.getClassNotificationById(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // update class notification
    public static readonly updateClassNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const data: Partial<IClassNotificationData> = await ctx.req.json();

            const notification =
                await NotificationService.updateClassNotification(id, data);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // delete class notification
    public static readonly deleteClassNotification = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const notification =
                await NotificationService.deleteClassNotification(id);

            return ctx.json(notification);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
}
