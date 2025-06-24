/* eslint-disable unicorn/no-array-method-this-argument */
import crypto from "node:crypto";

import { FindOptions } from "ottoman";

import { IUser, User } from "@/models/user.model";

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
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, "sha512")
            .toString("hex");

        return await User.create({
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
        const hash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, "sha512")
            .toString("hex");

        await User.updateById(id, {
            hash: hash,
            salt: salt,
            updated_at: new Date(),
        });
    };

    // getParentForStudent
    public static readonly getParentForStudent = async (
        student_id: string
    ): Promise<IUser[]> => {
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
    public static readonly getStudentForParent = async (
        parent_id: string
    ): Promise<IUser[]> => {
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
}