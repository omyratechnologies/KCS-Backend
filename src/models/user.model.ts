import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IUser {
    id: string;
    user_type: string;
    user_id: string;
    email: string;
    hash: string;
    salt: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    last_login: Date;
    last_login_ip: string;
    campus_id?: string;
    academic_year?: string;
    class_id?: string;
    // meta_data?: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
    meta_data: {
        [key: string]: any;
    };
}

const UserSchema = new Schema({
    user_type: { type: String, required: true },
    user_id: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    hash: { type: String, required: true },
    salt: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    last_login: { type: Date, required: false },
    last_login_ip: { type: String, required: false },
    campus_id: { type: String, required: false },
    academic_year: { type: String, required: false },
    class_id: { type: String, required: false },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

UserSchema.index.findByUserId = { by: "user_id" };
UserSchema.index.findByEmail = { by: "email" };
UserSchema.index.findByCampusId = { by: "campus_id" };
UserSchema.index.findByUserType = { by: "user_type" };
UserSchema.index.findByCampusIdAndUserType = { by: ["campus_id", "user_type"] };
UserSchema.index.findByCampusIdAndUserId = { by: ["campus_id", "user_id"] };
UserSchema.index.findByCampusIdAndEmail = { by: ["campus_id", "email"] };
UserSchema.index.findByClassId = { by: "class_id" };
UserSchema.index.findByAcademicYear = { by: "academic_year" };
UserSchema.index.findByClassIdAndAcademicYear = { by: ["class_id", "academic_year"] };

const User = ottoman.model<IUser>("users", UserSchema);

export { type IUser, User };
