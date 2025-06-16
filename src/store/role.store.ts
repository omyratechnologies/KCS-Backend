import { z } from "zod";

export const actionMap: {
    [key: string]: string[];
} = {
    Student: [
        "get_user",
        "get_class",
        "get_all_courses",
        "get_course",
        "get_subject",
        "get_exam",
    ],
    Parent: ["get_user"],
    Teacher: ["get_user", "get_users"],
    Staff: [
        "get_user",
        "get_users",
        "create_users",
        "update_users",
        "delete_users",
    ],
    Principal: [
        "get_user",
        "get_users",
        "create_users",
        "update_users",
        "delete_users",
    ],
    Admin: [
        "get_user",
        "get_users",
        "create_users",
        "update_users",
        "delete_users",
        "create_campus",
        "get_all_campus",
        "get_campus",
        "update_campus",
        "delete_campus",
        "create_class",
        "get_all_class",
        "get_class",
        "update_class",
        "delete_class",
        "create_subject",
        "get_all_subject",
        "get_subject",
        "update_subject",
        "delete_subject",
    ],
    "Super Admin": [
        "create_campus",
        "get_all_campus",
        "get_campus",
        "update_campus",
        "delete_campus",
        "create_users",
    ],
    Public: [],
};

// use zod to create a union type for action names
const actionNameSchema = z.union([
    z.literal("get_user"),
    z.literal("get_users"),
    z.literal("create_users"),
    z.literal("update_users"),
    z.literal("delete_users"),
    z.literal("create_campus"),
    z.literal("get_all_campus"),
    z.literal("get_campus"),
    z.literal("update_campus"),
    z.literal("delete_campus"),
    z.literal("create_class"),
    z.literal("get_all_class"),
    z.literal("get_class"),
    z.literal("update_class"),
    z.literal("delete_class"),
    z.literal("create_subject"),
    z.literal("get_all_subject"),
    z.literal("get_subject"),
    z.literal("update_subject"),
    z.literal("delete_subject"),
]);

export type ActionType = z.infer<typeof actionNameSchema>;
