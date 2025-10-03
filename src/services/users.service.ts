/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";

import { FindOptions } from "ottoman";

import infoLogs, { LogTypes } from "@/libs/logger";
import { sendWelcomeEmail } from "@/libs/mailer";
import { Class } from "@/models/class.model";
import { IUser, User } from "@/models/user.model";

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
    }) => {
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
            user_type: user_type,
            campus_id: campus_id ?? " ",
            created_at: new Date(),
            updated_at: new Date(),
        });

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
                user_type,
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

    // Get All
    public static readonly getUsers = async (campus_id?: string) => {
        const filter = campus_id ? { campus_id: campus_id } : {};
        const options: FindOptions = {
            sort: {
                created_at: "DESC",
            },
            limit: 100,
            skip: 0,
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
                "created_at",
                "updated_at",
            ],
        };

        const data: {
            rows: IUser[];
        } = await User.find(filter, options);

        if (data.rows.length === 0) {
            throw new Error("No users found");
        }

        return data.rows;
    };

    // Get One
    public static readonly getUser = async (id: string): Promise<IUser> => {
        return await User.findById(id, {
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
                "created_at",
                "updated_at",
            ],
        });
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
        }
    ): Promise<void> => {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("User not found");
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
    public static readonly deleteUsers = async (id: string): Promise<void> => {
        const user = await User.findById(id);
        if (!user) {
            throw new Error("User not found");
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
        const parentIds = (student.meta_data as any)?.parent_id;

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
        if (user_type) {
            filter.user_type = user_type;
        }
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
                "created_at",
                "updated_at",
            ],
        };

        const data: {
            rows: IUser[];
        } = await User.find(filter, options);

        let users = data.rows;

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
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                return fullName.includes(nameLower) ||
                       u.first_name?.toLowerCase().includes(nameLower) ||
                       u.last_name?.toLowerCase().includes(nameLower);
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
                const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
                return fullName.includes(searchLower) ||
                       u.email?.toLowerCase().includes(searchLower) ||
                       u.user_id?.toLowerCase().includes(searchLower) ||
                       u.phone?.includes(search) ||
                       u.address?.toLowerCase().includes(searchLower);
            });
        }

        // Filter by class enrollment if academic_year and class_id are provided
        if (academic_year && class_id) {
            const classData = await Class.findOne({
                campus_id,
                academic_year,
                id: class_id,
                is_active: true,
                is_deleted: false,
            });

            if (classData && classData.student_ids && classData.student_ids.length > 0) {
                const enrolledStudentIds = new Set(classData.student_ids);
                users = users.filter((u) => enrolledStudentIds.has(u.id));
            } else {
                // No students enrolled in this class
                users = [];
            }
        }

        const totalUsers = users.length;

        // Apply pagination
        const skip = (page - 1) * limit;
        const paginatedUsers = users.slice(skip, skip + limit);

        return {
            users: paginatedUsers,
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
