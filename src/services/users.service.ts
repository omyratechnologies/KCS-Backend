/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";

import { FindOptions } from "ottoman";

import infoLogs, { LogTypes } from "@/libs/logger";
import { sendWelcomeEmail } from "@/libs/mailer";
import { Class } from "@/models/class.model";
import { IUser, User } from "@/models/user.model";
import { canCreateUserType } from "@/middlewares/role.middleware";

import { CampusService } from "./campuses.service";

export class UserService {
    // Create
    public static readonly createUsers = async ({
        user_id,
        email,
        password,
        first_name,
        last_name,
        phone,
        address,
        meta_data,
        user_type,
        campus_id,
        academic_year,
        class_id,
        creator_id,
        creator_type,
    }: {
        user_id: string;
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        phone: string;
        address: string;
        meta_data: string;
        user_type: string;
        campus_id?: string;
        academic_year?: string;
        class_id?: string;
        creator_id?: string;
        creator_type?: string;
    }) => {
        // if its type is student and its academic year or class id not there then give error
        if (user_type === "Student" && (!academic_year || !class_id)) {
            throw new Error("Academic year and class ID are required for students");
        }

        // Validate that user_type is provided either directly or auto-set
        if (!user_type) {
            throw new Error("User type is required");
        }

        // Validate campus exists if campus_id is provided
        if (campus_id && campus_id.trim() !== "" && user_type !== "Super Admin") {
            try {
                const campus = await CampusService.getCampus(campus_id);
                if (!campus || campus.is_deleted) {
                    throw new Error("Campus not found or is deleted");
                }
                if (!campus.is_active) {
                    throw new Error("Campus is not active");
                }
            } catch (error) {
                if (error instanceof Error) {
                    if (error.name === "DocumentNotFoundError" || error.message.includes("DocumentNotFoundError")) {
                        throw new Error("Campus not found. Please provide a valid campus ID");
                    }
                    // Re-throw our custom error messages
                    if (error.message === "Campus not found or is deleted" || error.message === "Campus is not active") {
                        throw error;
                    }
                }
                throw new Error("Invalid campus ID. Please provide a valid campus ID");
            }
        }

        // Validate class exists if user_type is Student
        if (user_type === "Student" && class_id && academic_year && campus_id) {
            try {
                const classData = await Class.findOne({
                    id: class_id,
                    campus_id: campus_id,
                    academic_year: academic_year,
                    is_active: true,
                    is_deleted: false,
                });

                if (!classData) {
                    throw new Error(`Class not found. Please provide a valid class ID for campus ${campus_id} and academic year ${academic_year}`);
                }
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message.includes("Class not found")) {
                        throw error;
                    }
                }
                throw new Error("Invalid class ID. Please provide a valid class ID");
            }
        }

        // Determine deletable status based on creator and target user type
        let deletable = true;
        if (user_type === "Admin") {
            // If created by Super Admin, set deletable to false
            // If created by another Admin, set deletable to true
            if (creator_type === "Super Admin") {
                deletable = false;
            } else {
                deletable = true;
            }
        }

        // Check if email already exists
        try {
            const existingUser = await User.find({ email: email });
            if (existingUser.rows.length > 0) {
                throw new Error("Email already exists");
            }
        } catch (error) {
            if (error instanceof Error && error.message === "Email already exists") {
                throw error;
            }
            // If error is not about existing user, continue with creation
        }

        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

        const newUser = await User.create({
            user_id: user_id,
            email: email,
            hash: hash,
            salt: salt,
            first_name: first_name,
            last_name: last_name,
            phone: phone,
            address: address,
            meta_data: meta_data,
            is_active: true,
            is_deleted: false,
            deletable: deletable,
            created_by: creator_id,
            user_type: user_type,
            campus_id: campus_id ?? " ",
            academic_year: academic_year ?? undefined,
            class_id: class_id ?? undefined,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // If student, add to class's student_ids array
        if (user_type === "Student" && class_id && academic_year && campus_id) {
            try {
                const classData = await Class.findOne({
                    id: class_id,
                    campus_id: campus_id,
                    academic_year: academic_year,
                    is_active: true,
                    is_deleted: false,
                });

                if (classData) {
                    const currentStudentIds = classData.student_ids || [];
                    if (!currentStudentIds.includes(newUser.id)) {
                        await Class.updateById(classData.id, {
                            student_ids: [...currentStudentIds, newUser.id],
                            student_count: (classData.student_count || 0) + 1,
                            updated_at: new Date(),
                        });
                        infoLogs(
                            `Student ${newUser.id} added to class ${class_id}`,
                            LogTypes.LOGS,
                            "USER:CREATE:CLASS_ASSIGNMENT"
                        );
                    }
                } else {
                    infoLogs(
                        `Class not found for class_id: ${class_id}, academic_year: ${academic_year}`,
                        LogTypes.ERROR,
                        "USER:CREATE:CLASS_NOT_FOUND"
                    );
                }
            } catch (error) {
                infoLogs(
                    `Failed to add student to class: ${error}`,
                    LogTypes.ERROR,
                    "USER:CREATE:CLASS_ASSIGNMENT_FAILED"
                );
            }
        }

        // Send welcome email after successful user creation
        try {
            // Get campus name if campus_id is provided
            let campusName: string | undefined;
            if (campus_id && campus_id.trim() !== "") {
                try {
                    const campus = await CampusService.getCampus(campus_id);
                    campusName = campus?.name;
                } catch {
                    // If campus fetch fails, continue without campus name
                    infoLogs(
                        `Could not fetch campus info for campus_id: ${campus_id}`,
                        LogTypes.ERROR,
                        "USER:CREATE:CAMPUS_FETCH_FAILED"
                    );
                }
            }

            await sendWelcomeEmail(email, {
                first_name,
                last_name,
                email,
                user_type: user_type,
                user_id,
                campus_name: campusName,
            });
            infoLogs(`Welcome email sent to new user: ${email}`, LogTypes.LOGS, "USER:CREATE:WELCOME_EMAIL");
        } catch (emailError) {
            // Log the error but don't fail user creation
            infoLogs(
                `Failed to send welcome email to ${email}: ${emailError}`,
                LogTypes.ERROR,
                "USER:CREATE:WELCOME_EMAIL_FAILED"
            );
        }

        return newUser;
    };

    // Bulk Create Users
    public static readonly bulkCreateUsers = async (
        users: Array<{
            user_id: string;
            email: string;
            password: string;
            first_name: string;
            last_name: string;
            phone: string;
            address: string;
            meta_data?: string;
            user_type: string;
            campus_id?: string;
            academic_year?: string;
            class_id?: string;
        }>,
        creatorInfo: {
            creator_id?: string;
            creator_type?: string;
            creator_campus_id?: string;
        }
    ) => {
        const results = {
            successful: [] as any[],
            failed: [] as any[],
            total: users.length,
            success_count: 0,
            failed_count: 0,
        };

        // Allowed user types for bulk creation
        const allowedBulkTypes = ["Student", "Parent", "Teacher"];

        for (let i = 0; i < users.length; i++) {
            const userData = users[i];
            try {
                // Validate that only Student, Parent, Teacher can be created in bulk
                if (!allowedBulkTypes.includes(userData.user_type)) {
                    throw new Error(`Bulk creation is only allowed for Student, Parent, and Teacher. Cannot create ${userData.user_type} in bulk`);
                }

                // Validate role hierarchy
                if (!canCreateUserType(creatorInfo.creator_type || "", userData.user_type)) {
                    throw new Error(`${creatorInfo.creator_type} cannot create ${userData.user_type} users`);
                }

                // Campus validation for non-Super Admin creators
                let campus_id = userData.campus_id;
                if (creatorInfo.creator_type !== "Super Admin") {
                    if (!creatorInfo.creator_campus_id) {
                        throw new Error("Creator must be assigned to a campus");
                    }

                    // Force campus_id to be the creator's campus
                    if (campus_id && campus_id !== creatorInfo.creator_campus_id) {
                        throw new Error("Can only create users in your own campus");
                    }
                    campus_id = creatorInfo.creator_campus_id;
                } else {
                    // Super Admin must provide campus_id for non-super-admin users
                    if (!campus_id && userData.user_type !== "Super Admin") {
                        throw new Error("Campus ID is required");
                    }
                }

                const newUser = await UserService.createUsers({
                    user_id: userData.user_id,
                    email: userData.email,
                    password: userData.password,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    phone: userData.phone,
                    address: userData.address,
                    meta_data: userData.meta_data || "{}",
                    user_type: userData.user_type,
                    campus_id: campus_id,
                    academic_year: userData.academic_year,
                    class_id: userData.class_id,
                    creator_id: creatorInfo.creator_id,
                    creator_type: creatorInfo.creator_type,
                });

                results.successful.push({
                    index: i,
                    user_id: userData.user_id,
                    email: userData.email,
                    id: newUser.id,
                    message: "User created successfully",
                });
                results.success_count++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                results.failed.push({
                    index: i,
                    user_id: userData.user_id,
                    email: userData.email,
                    error: errorMessage,
                });
                results.failed_count++;

                infoLogs(
                    `Bulk create failed for user ${userData.email}: ${errorMessage}`,
                    LogTypes.ERROR,
                    "USER:BULK_CREATE:FAILED"
                );
            }
        }

        infoLogs(
            `Bulk user creation completed. Success: ${results.success_count}, Failed: ${results.failed_count}`,
            LogTypes.LOGS,
            "USER:BULK_CREATE:COMPLETED"
        );

        return results;
    };

    // Get All
    // Get One
    public static readonly getUser = async (id: string): Promise<IUser & { class_name?: string }> => {
        const user = await User.findById(id, {
            select: [
                "id",
                "user_id",
                "email",
                "first_name",
                "last_name",
                "phone",
                "address",
                "last_login",
                "meta_data",
                "is_active",
                "is_deleted",
                "user_type",
                "campus_id",
                "academic_year",
                "class_id",
                "created_at",
                "updated_at",
            ],
        });

        // Populate class name if class_id exists (only for students)
        const userWithClass: IUser & { class_name?: string } = { ...user };
        if (user.class_id && user.user_type?.toLowerCase() === "student") {
            try {
                const classData = await Class.findById(user.class_id);
                if (classData) {
                    userWithClass.class_name = classData.name;
                }
            } catch {
                infoLogs(
                    `Failed to fetch class name for class_id: ${user.class_id}`,
                    LogTypes.ERROR,
                    "USER:GET:CLASS_FETCH_FAILED"
                );
            }
        }

        return userWithClass;
    };

    // Update
    public static readonly updateUsers = async (
        id: string,
        data: {
            user_id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            phone?: string;
            address?: string;
            meta_data?: string;
            is_active?: boolean;
            is_deleted?: boolean;
            user_type?: string;
            campus_id?: string;
            academic_year?: string;
            class_id?: string;
        },
        updaterId?: string,
        updaterType?: string,
        updaterCampusId?: string
    ): Promise<void> => {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("User not found");
        }

        // Validate update permissions if updater info is provided
        if (updaterId && updaterType) {
            const { canUpdateUser } = await import("@/middlewares/role.middleware");
            const updateCheck = await canUpdateUser(updaterId, updaterType, updaterCampusId, id);

            if (!updateCheck.canUpdate) {
                throw new Error(updateCheck.reason || "You don't have permission to update this user");
            }
        }

        // Check if email is being updated and if it already exists
        if (data.email && data.email !== user.email) {
            try {
                const existingUser = await User.find({ email: data.email });
                if (existingUser.rows.length > 0) {
                    throw new Error("Email already exists");
                }
            } catch (error) {
                if (error instanceof Error && error.message === "Email already exists") {
                    throw error;
                }
                // If error is not about existing user, continue with update
            }
        }

        await User.updateById(id, {
            ...data,
            updated_at: new Date(),
        });
    };

    // Delete
    public static readonly deleteUsers = async (
        id: string,
        deleterId: string,
        deleterType: string,
        deleterCampusId?: string
    ): Promise<void> => {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("User not found");
        }

        // Validate deletion permissions
        const { canDeleteUser } = await import("@/middlewares/role.middleware");
        const deleteCheck = await canDeleteUser(deleterId, deleterType, deleterCampusId, id);

        if (!deleteCheck.canDelete) {
            throw new Error(deleteCheck.reason || "You don't have permission to delete this user");
        }

        await User.removeById(id);
    };

    // Update Password
    public static readonly updatePassword = async (
        id: string,
        {
            password,
        }: {
            password: string;
        }
    ): Promise<void> => {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("User not found");
        }

        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

        await User.updateById(id, {
            hash: hash,
            salt: salt,
            updated_at: new Date(),
        });
    };

    // getParentForStudent
    public static readonly getParentForStudent = async (student_id: string): Promise<IUser[]> => {
        // First, get the student to extract parent IDs from their meta_data
        const studentData: {
            rows: IUser[];
        } = await User.find({
            id: student_id,
            user_type: "Student",
            is_active: true,
            is_deleted: false,
        });

        if (studentData.rows.length === 0) {
            throw new Error("Student not found");
        }

        const student = studentData.rows[0];

        // Extract parent IDs from student's meta_data
        // Parse meta_data if it's a string
        const metaData = typeof student.meta_data === 'string' 
            ? JSON.parse(student.meta_data) 
            : student.meta_data;
        
        const parentIds = metaData?.parent_id;

        if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
            throw new Error("No parents found for the student");
        }

        // Query parents by the IDs found in student's meta_data
        const data: {
            rows: IUser[];
        } = await User.find({
            id: { $in: parentIds },
            user_type: "Parent",
            is_active: true,
            is_deleted: false,
        });

        if (data.rows.length === 0) {
            throw new Error("No parents found for the student");
        }

        return data.rows;
    };

    // getStudentForParent
    public static readonly getStudentForParent = async (parent_id: string): Promise<IUser[]> => {
        // First, get the parent to extract student IDs from their meta_data
        const parentData: {
            rows: IUser[];
        } = await User.find({
            id: parent_id,
            user_type: "Parent",
            is_active: true,
            is_deleted: false,
        });

        if (parentData.rows.length === 0) {
            throw new Error("Parent not found");
        }

        const parent = parentData.rows[0];

        // Extract student IDs from parent's meta_data
        const studentIds = (parent.meta_data as any)?.student_id;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            throw new Error("No students found for the parent");
        }

        // Query students by the IDs found in parent's meta_data
        const data: {
            rows: IUser[];
        } = await User.find({
            id: { $in: studentIds },
            user_type: "Student",
            is_active: true,
            is_deleted: false,
        });

        if (data.rows.length === 0) {
            throw new Error("No students found for the parent");
        }

        return data.rows;
    };

    // Get Users with pagination and filtering
    public static readonly getUsersWithFilters = async (
        campus_id: string,
        filters: {
            page?: number;
            limit?: number;
            user_type?: string;
            search?: string;
            user_id?: string;
            email?: string;
            name?: string;
            phone?: string;
            is_active?: boolean;
            is_deleted?: boolean;
            from?: Date;
            to?: Date;
            sort_by?: string;
            sort_order?: "asc" | "desc";
            academic_year?: string;
            class_id?: string;
        } = {}
    ) => {
        const {
            page = 1,
            limit = 20,
            user_type,
            search,
            user_id,
            email,
            name,
            phone,
            is_active,
            is_deleted = false,
            from,
            to,
            sort_by = "created_at",
            sort_order = "desc",
            academic_year,
            class_id,
        } = filters;

        // Build filter object
        const filter: any = { campus_id };

        // Prevent Super Admin from being retrieved through this endpoint
        if (user_type === "Super Admin") {
            // Return empty result if explicitly trying to get Super Admin
            return {
                users: [],
                pagination: {
                    current_page: page,
                    per_page: limit,
                    total_items: 0,
                    total_pages: 0,
                    has_next: false,
                    has_previous: false,
                },
            };
        }

        if (user_type) {
            filter.user_type = user_type;
        }
        // Note: Super Admin will be filtered out from results below

        if (is_deleted !== undefined) {
            filter.is_deleted = is_deleted;
        }

        const options: FindOptions = {
            sort: {
                [sort_by]: sort_order === "asc" ? "ASC" : "DESC",
            },
            select: [
                "id",
                "user_id",
                "email",
                "first_name",
                "last_name",
                "phone",
                "address",
                "last_login",
                "meta_data",
                "is_active",
                "is_deleted",
                "user_type",
                "campus_id",
                "academic_year",
                "class_id",
                "created_at",
                "updated_at",
            ],
        };

        const data: {
            rows: IUser[];
        } = await User.find(filter, options);

        let users = data.rows;

        // SECURITY: Always exclude Super Admin users from results
        users = users.filter((u) => u.user_type !== "Super Admin");

        // Apply additional filters
        if (user_id) {
            users = users.filter((u) => u.user_id?.toLowerCase().includes(user_id.toLowerCase()));
        }

        if (email) {
            users = users.filter((u) => u.email?.toLowerCase().includes(email.toLowerCase()));
        }

        if (name) {
            const nameLower = name.toLowerCase();
            users = users.filter((u) => {
                const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
                return (
                    fullName.includes(nameLower) ||
                    u.first_name?.toLowerCase().includes(nameLower) ||
                    u.last_name?.toLowerCase().includes(nameLower)
                );
            });
        }

        if (phone) {
            users = users.filter((u) => u.phone?.includes(phone));
        }

        if (is_active !== undefined) {
            users = users.filter((u) => u.is_active === is_active);
        }

        // Date range filtering
        if (from) {
            users = users.filter((u) => {
                const createdAt = new Date(u.created_at);
                return createdAt >= from;
            });
        }

        if (to) {
            users = users.filter((u) => {
                const createdAt = new Date(u.created_at);
                // Include the entire day by setting time to end of day
                const endOfDay = new Date(to);
                endOfDay.setHours(23, 59, 59, 999);
                return createdAt <= endOfDay;
            });
        }

        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter((u) => {
                const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
                return (
                    fullName.includes(searchLower) ||
                    u.email?.toLowerCase().includes(searchLower) ||
                    u.user_id?.toLowerCase().includes(searchLower) ||
                    u.phone?.includes(search) ||
                    u.address?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Filter by academic_year if provided
        if (academic_year) {
            users = users.filter((u) => u.academic_year === academic_year);
        }

        // Filter by class_id if provided
        if (class_id) {
            users = users.filter((u) => u.class_id === class_id);
        }

        // Additional filter: check class enrollment if both academic_year and class_id are provided and user_type is Student
        if (academic_year && class_id && user_type === "Student") {
            try {
                const classData = await Class.findOne({
                    campus_id,
                    academic_year,
                    id: class_id,
                    is_active: true,
                    is_deleted: false,
                });

                if (classData && classData.student_ids && classData.student_ids.length > 0) {
                    const enrolledStudentIds = new Set(classData.student_ids);
                    // Further filter to only students enrolled in the class
                    users = users.filter((u) => enrolledStudentIds.has(u.id));
                }
            } catch {
                // If class not found or error, continue with users already filtered by academic_year and class_id fields
                infoLogs(
                    `Class lookup failed for academic_year: ${academic_year}, class_id: ${class_id}`,
                    LogTypes.ERROR,
                    "USER:GET:CLASS_LOOKUP_FAILED"
                );
            }
        }

        const totalUsers = users.length;

        // Apply pagination
        const skip = (page - 1) * limit;
        const paginatedUsers = users.slice(skip, skip + limit);

        // Populate class names for users with class_id
        const usersWithClassNames = await Promise.all(
            paginatedUsers.map(async (user) => {
                if (user.class_id && user.user_type?.toLowerCase() === "student") {
                    try {
                        const classData = await Class.findById(user.class_id);
                        return {
                            ...user,
                            class_name: classData?.name,
                        };
                    } catch (error) {
                        infoLogs(
                            `Failed to fetch class name for class_id: ${user.class_id}`,
                            LogTypes.ERROR,
                            "USER:GET:CLASS_FETCH_FAILED"
                        );
                        return user;
                    }
                }
                return user;
            })
        );

        return {
            users: usersWithClassNames,
            pagination: {
                current_page: page,
                per_page: limit,
                total_items: totalUsers,
                total_pages: Math.ceil(totalUsers / limit),
                has_next: page < Math.ceil(totalUsers / limit),
                has_previous: page > 1,
            },
        };
    };
}
