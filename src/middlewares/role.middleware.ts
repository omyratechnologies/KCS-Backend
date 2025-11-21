import { Context, MiddlewareHandler, Next } from "hono";

import { actionMap, ActionType } from "@/store/role.store";
import { User } from "@/models/user.model";

// Role hierarchy levels (higher number = more power)
const roleHierarchy: { [key: string]: number } = {
    "Super Admin": 100,
    Admin: 80,
    Principal: 60,
    Staff: 40,
    Teacher: 30,
    Parent: 20,
    Student: 10,
};

export const roleMiddleware = (actionName: ActionType): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");

        console.log("Role Middleware - User Type:", user_type, "Action:", actionName);

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
        const normalizedRequiredTypes = requiredUserTypes.map((type) => type.toLowerCase());

        if (normalizedRequiredTypes.includes(normalizedUserType)) {
            await next();
        } else {
            return ctx.json({ error: "Forbidden: Insufficient permissions" }, 403);
        }
    };
};

/**
 * Check if the current user can create a user of the target type
 * Super Admin: Can create Admins (with deletable=false), and all other roles
 * Admin: Can create Admins (with deletable=true) in own campus only, and all roles below
 * Principal: Can create Staff, Teacher, Parent, Student in own campus only
 * Staff: Can create Parent, Student in own campus only
 */
export const canCreateUserType = (
    creatorType: string,
    targetType: string,
): boolean => {
    const targetLevel = roleHierarchy[targetType] || 0;

    // Super Admin can create anyone in any campus
    if (creatorType === "Super Admin") {
        return true;
    }

    // Admin can create admins and below, but only in their own campus
    if (creatorType === "Admin") {
        return targetLevel <= roleHierarchy["Admin"];
    }

    // Principal can only create Staff, Teacher, Parent, Student in their own campus
    if (creatorType === "Principal") {
        return targetLevel < roleHierarchy["Principal"] && targetLevel >= roleHierarchy["Student"];
    }

    // Staff can only create Parent, Student and Teacher in their own campus
    if (creatorType === "Staff") {
        return targetType === "Parent" || targetType === "Student" || targetType === "Teacher";
    }

    return false;
};

/**
 * Check if the current user can delete a target user
 * Super Admin: Can delete anyone except other Super Admins
 * Admin: Can delete users in own campus only, cannot delete Super Admin or non-deletable admins
 * Principal: Can delete Staff, Teacher, Parent, Student in own campus only
 * Staff: Can only delete users they created (Parent, Student)
 */
export const canDeleteUser = async (
    deleterId: string,
    deleterType: string,
    deleterCampusId: string | undefined,
    targetUserId: string
): Promise<{ canDelete: boolean; reason?: string }> => {
    try {
        // Fetch target user
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return { canDelete: false, reason: "Target user not found" };
        }

        const targetType = targetUser.user_type;
        const targetCampusId = targetUser.campus_id;
        const targetDeletable = targetUser.deletable;
        const targetCreatedBy = targetUser.created_by;

        // Cannot delete yourself
        if (deleterId === targetUserId) {
            return { canDelete: false, reason: "Cannot delete yourself" };
        }

        // No one can delete Super Admin
        if (targetType === "Super Admin") {
            return { canDelete: false, reason: "Cannot delete Super Admin" };
        }

        // Super Admin can delete anyone except Super Admins
        if (deleterType === "Super Admin") {
            return { canDelete: true };
        }

        // Admin checks
        if (deleterType === "Admin") {
            // Must be same campus
            if (targetCampusId !== deleterCampusId) {
                return { canDelete: false, reason: "Cannot delete users from other campus" };
            }

            // Fetch deleter user to check their deletable status
            const deleterUser = await User.findById(deleterId);
            if (!deleterUser) {
                return { canDelete: false, reason: "Deleter user not found" };
            }

            // If the admin trying to delete is deletable=true (created by another admin),
            // they cannot delete any other admins
            if (deleterUser.deletable && targetType === "Admin") {
                return { canDelete: false, reason: "Deletable admins cannot delete other admins" };
            }

            // If the deleter admin is deletable=false (created by Super Admin),
            // they can delete other admins with deletable=true
            if (!deleterUser.deletable && targetType === "Admin") {
                if (!targetDeletable) {
                    return { canDelete: false, reason: "Cannot delete non-deletable admin" };
                }
                return { canDelete: true };
            }

            // Can delete users below admin level
            const targetLevel = roleHierarchy[targetType] || 0;
            if (targetLevel < roleHierarchy["Admin"]) {
                return { canDelete: true };
            }

            return { canDelete: false, reason: "Cannot delete users above your level" };
        }

        // Principal checks
        if (deleterType === "Principal") {
            // Must be same campus
            if (targetCampusId !== deleterCampusId) {
                return { canDelete: false, reason: "Cannot delete users from other campus" };
            }

            // Can only delete Staff, Teacher, Parent, Student
            const allowedTypes = ["Staff", "Teacher", "Parent", "Student"];
            if (allowedTypes.includes(targetType)) {
                return { canDelete: true };
            }

            return { canDelete: false, reason: "Cant delete users of this type" };
        }

        // Staff checks
        if (deleterType === "Staff") {
            // Must be same campus
            if (targetCampusId !== deleterCampusId) {
                return { canDelete: false, reason: "Cannot delete users from other campus" };
            }

            // Can only delete users they created
            if (targetCreatedBy !== deleterId) {
                return { canDelete: false, reason: "Can only delete users you created" };
            }

            // Can only delete Parent, Student, or Teacher
            if (targetType === "Parent" || targetType === "Student" || targetType === "Teacher") {
                return { canDelete: true };
            }

            return { canDelete: false, reason: "Can only delete users you created" };
        }

        return { canDelete: false, reason: "Insufficient permissions" };
    } catch {
        return { canDelete: false, reason: "Error checking permissions" };
    }
};

/**
 * Check if the current user can update a target user
 * Same permissions as delete
 * Super Admin: Can update anyone except other Super Admins
 * Admin: Can update users in own campus only, cannot update Super Admin or non-deletable admins
 * Principal: Can update Staff, Teacher, Parent, Student in own campus only
 * Staff: Can only update users they created (Parent, Student, Teacher)
 */
export const canUpdateUser = async (
    updaterId: string,
    updaterType: string,
    updaterCampusId: string | undefined,
    targetUserId: string
): Promise<{ canUpdate: boolean; reason?: string }> => {
    try {
        // Fetch target user
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return { canUpdate: false, reason: "Target user not found" };
        }

        const targetType = targetUser.user_type;
        const targetCampusId = targetUser.campus_id;
        const targetDeletable = targetUser.deletable;
        const targetCreatedBy = targetUser.created_by;

        // Cannot update yourself through this endpoint (use profile update)
        if (updaterId === targetUserId) {
            return { canUpdate: false, reason: "Cannot update yourself through this endpoint" };
        }

        // No one can update Super Admin
        if (targetType === "Super Admin") {
            return { canUpdate: false, reason: "Cannot update Super Admin" };
        }

        // Super Admin can update anyone except Super Admins
        if (updaterType === "Super Admin") {
            return { canUpdate: true };
        }

        // Admin checks
        if (updaterType === "Admin") {
            // Must be same campus
            if (targetCampusId !== updaterCampusId) {
                return { canUpdate: false, reason: "Cannot update users from other campus" };
            }

            // Fetch updater user to check their deletable status
            const updaterUser = await User.findById(updaterId);
            if (!updaterUser) {
                return { canUpdate: false, reason: "Updater user not found" };
            }

            // If the admin trying to update is deletable=true (created by another admin),
            // they cannot update any other admins
            if (updaterUser.deletable && targetType === "Admin") {
                return { canUpdate: false, reason: "Deletable admins cannot update other admins" };
            }

            // If the updater admin is deletable=false (created by Super Admin),
            // they can update other admins with deletable=true
            if (!updaterUser.deletable && targetType === "Admin") {
                if (!targetDeletable) {
                    return { canUpdate: false, reason: "Cannot update non-deletable admin" };
                }
                return { canUpdate: true };
            }

            // Can update users below admin level
            const targetLevel = roleHierarchy[targetType] || 0;
            if (targetLevel < roleHierarchy["Admin"]) {
                return { canUpdate: true };
            }

            return { canUpdate: false, reason: "Cannot update users above your level" };
        }

        // Principal checks
        if (updaterType === "Principal") {
            // Must be same campus
            if (targetCampusId !== updaterCampusId) {
                return { canUpdate: false, reason: "Cannot update users from other campus" };
            }

            // Can only update Staff, Teacher, Parent, Student
            const allowedTypes = ["Staff", "Teacher", "Parent", "Student"];
            if (allowedTypes.includes(targetType)) {
                return { canUpdate: true };
            }

            return { canUpdate: false, reason: "Cannot update users of this type" };
        }

        // Staff checks
        if (updaterType === "Staff") {
            // Must be same campus
            if (targetCampusId !== updaterCampusId) {
                return { canUpdate: false, reason: "Cannot update users from other campus" };
            }

            // Can only update users they created
            if (targetCreatedBy !== updaterId) {
                return { canUpdate: false, reason: "Can only update users you created" };
            }

            // Can only update Parent, Student, or Teacher
            if (targetType === "Parent" || targetType === "Student" || targetType === "Teacher") {
                return { canUpdate: true };
            }

            return { canUpdate: false, reason: "Can only update users you created" };
        }

        return { canUpdate: false, reason: "Insufficient permissions" };
    } catch {
        return { canUpdate: false, reason: "Error checking permissions" };
    }
};
