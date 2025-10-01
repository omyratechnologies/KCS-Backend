import { CampusWideNotification, ICampusWideNotificationData } from "@/models/campus_wide_notification.model";
import { ClassNotification, IClassNotificationData } from "@/models/class_notification.model";
import { IParentNotificationData, ParentNotification } from "@/models/parent_notification.model";
import { IStudentNotificationData, StudentNotification } from "@/models/student_notification.model";
import { ITeacherNotificationData, TeacherNotification } from "@/models/teacher_notification.model";
import { PushNotificationService } from "./push_notification.service";

export class NotificationService {
    // create campus wide notification
    public static readonly createCampusWideNotification = async (
        campus_id: string,
        data: {
            title: string;
            message: string;
            meta_data: object;
        }
    ) => {
        // Create the notification in database
        const notification = await CampusWideNotification.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Send push notification to all users in the campus
        try {
            await PushNotificationService.sendCampusWideNotification({
                title: data.title,
                message: data.message,
                notification_type: "campus_wide",
                campus_id: campus_id,
                data: {
                    notification_id: notification.id,
                    type: "announcement",
                    priority: "high",
                },
            });
        } catch {
            // Log error but don't fail the notification creation
            // This ensures the notification is still created even if push notification fails
        }

        return notification;
    };

    // get all campus wide notifications by campus id
    public static readonly getCampusWideNotifications = async (campus_id: string) => {
        const data: {
            rows: ICampusWideNotificationData[];
        } = await CampusWideNotification.find(
            { campus_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("Campus wide notifications not found");
        }

        return data.rows;
    };

    // get campus wide notification by id
    public static readonly getCampusWideNotificationById = async (id: string) => {
        const notification = await CampusWideNotification.findById(id);

        if (!notification) {
            throw new Error("Campus wide notification not found");
        }

        return notification;
    };

    // update campus wide notification
    public static readonly updateCampusWideNotification = async (
        id: string,
        data: Partial<ICampusWideNotificationData>
    ) => {
        const notification = await CampusWideNotification.findById(id);

        if (!notification) {
            throw new Error("Campus wide notification not found");
        }

        return await CampusWideNotification.updateById(id, data);
    };

    // delete campus wide notification
    public static readonly deleteCampusWideNotification = async (id: string) => {
        const notification = await CampusWideNotification.findById(id);

        if (!notification) {
            throw new Error("Campus wide notification not found");
        }

        return await CampusWideNotification.updateById(id, {
            is_deleted: true,
        });
    };

    // create class notification
    public static readonly createClassNotification = async (
        campus_id: string,
        data: {
            class_id: string;
            title: string;
            message: string;
            meta_data: object;
        }
    ) => {
        return await ClassNotification.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get all class notifications by campus id
    public static readonly getClassNotifications = async (class_id: string) => {
        const data: {
            rows: IClassNotificationData[];
        } = await ClassNotification.find(
            { class_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("Class notifications not found");
        }

        return data.rows;
    };

    // get class notification by id
    public static readonly getClassNotificationById = async (id: string) => {
        const notification = await ClassNotification.findById(id);

        if (!notification) {
            throw new Error("Class notification not found");
        }

        return notification;
    };

    // update class notification
    public static readonly updateClassNotification = async (id: string, data: Partial<IClassNotificationData>) => {
        const notification = await ClassNotification.findById(id);

        if (!notification) {
            throw new Error("Class notification not found");
        }

        return await ClassNotification.updateById(id, data);
    };

    // delete class notification
    public static readonly deleteClassNotification = async (id: string) => {
        const notification = await ClassNotification.findById(id);

        if (!notification) {
            throw new Error("Class notification not found");
        }

        return await ClassNotification.updateById(id, { is_deleted: true });
    };

    // create parent notification
    public static readonly createParentNotification = async (
        campus_id: string,
        data: {
            user_id: string;
            title: string;
            message: string;
            meta_data: object;
        }
    ) => {
        return await ParentNotification.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get all parent notifications by campus id
    public static readonly getParentNotifications = async (user_id: string) => {
        const data: {
            rows: IParentNotificationData[];
        } = await ParentNotification.find(
            { user_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("Parent notifications not found");
        }

        return data.rows;
    };

    // get parent notification by id
    public static readonly getParentNotificationById = async (id: string) => {
        const notification = await ParentNotification.findById(id);

        if (!notification) {
            throw new Error("Parent notification not found");
        }

        return notification;
    };

    // update parent notification
    public static readonly updateParentNotification = async (id: string, data: Partial<IParentNotificationData>) => {
        const notification = await ParentNotification.findById(id);

        if (!notification) {
            throw new Error("Parent notification not found");
        }

        return await ParentNotification.updateById(id, data);
    };

    // delete parent notification
    public static readonly deleteParentNotification = async (id: string) => {
        const notification = await ParentNotification.findById(id);

        if (!notification) {
            throw new Error("Parent notification not found");
        }

        return await ParentNotification.updateById(id, { is_deleted: true });
    };

    // create student notification
    public static readonly createStudentNotification = async (
        campus_id: string,
        data: {
            user_id: string;
            title: string;
            message: string;
            meta_data: object;
        }
    ) => {
        return await StudentNotification.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            is_seen: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get all student notifications by campus id
    public static readonly getStudentNotifications = async (user_id: string) => {
        const data: {
            rows: IStudentNotificationData[];
        } = await StudentNotification.find(
            { user_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("Student notifications not found");
        }

        return data.rows;
    };

    // get student notification by id
    public static readonly getStudentNotificationById = async (id: string) => {
        const notification = await StudentNotification.findById(id);

        if (!notification) {
            throw new Error("Student notification not found");
        }

        return notification;
    };

    // update student notification
    public static readonly updateStudentNotification = async (id: string, data: Partial<IStudentNotificationData>) => {
        const notification = await StudentNotification.findById(id);

        if (!notification) {
            throw new Error("Student notification not found");
        }

        return await StudentNotification.updateById(id, data);
    };

    // delete student notification
    public static readonly deleteStudentNotification = async (id: string) => {
        const notification = await StudentNotification.findById(id);

        if (!notification) {
            throw new Error("Student notification not found");
        }

        return await StudentNotification.updateById(id, { is_deleted: true });
    };

    // create teacher notification
    public static readonly createTeacherNotification = async (
        campus_id: string,
        data: {
            user_id: string;
            title: string;
            message: string;
            meta_data: object;
        }
    ) => {
        return await TeacherNotification.create({
            campus_id,
            ...data,
            is_active: true,
            is_deleted: false,
            is_seen: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    };

    // get all teacher notifications by campus id
    public static readonly getTeacherNotifications = async (user_id: string) => {
        const data: {
            rows: ITeacherNotificationData[];
        } = await TeacherNotification.find(
            { user_id, is_deleted: false },
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (data.rows.length === 0) {
            throw new Error("Teacher notifications not found");
        }

        return data.rows;
    };

    // get teacher notification by id
    public static readonly getTeacherNotificationById = async (id: string) => {
        const notification = await TeacherNotification.findById(id);

        if (!notification) {
            throw new Error("Teacher notification not found");
        }

        return notification;
    };

    // update teacher notification
    public static readonly updateTeacherNotification = async (id: string, data: Partial<ITeacherNotificationData>) => {
        const notification = await TeacherNotification.findById(id);

        if (!notification) {
            throw new Error("Teacher notification not found");
        }

        return await TeacherNotification.updateById(id, data);
    };

    // delete teacher notification
    public static readonly deleteTeacherNotification = async (id: string) => {
        const notification = await TeacherNotification.findById(id);

        if (!notification) {
            throw new Error("Teacher notification not found");
        }

        return await TeacherNotification.updateById(id, { is_deleted: true });
    };
}
