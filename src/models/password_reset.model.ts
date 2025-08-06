import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IPasswordResetsData {
    id: string;
    user_id: string;
    reset_token: string;
    created_at: Date;
    updated_at: Date;
}

const PasswordResetSchema = new Schema({
    user_id: { type: String, required: true },
    reset_token: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

PasswordResetSchema.index.findByUserId = { by: "user_id" };

const PasswordResets = ottoman.model<IPasswordResetsData>("password_reset", PasswordResetSchema);

export { type IPasswordResetsData, PasswordResets };
