import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILoginSession {
    id: string;
    user_id: string;
    session_id: string;
    refresh_token: string;
    created_at: Date;
    updated_at: Date;
}

const LoginSessionSchema = new Schema({
    user_id: { type: String, required: true },
    session_id: { type: String, required: true },
    refresh_token: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LoginSessionSchema.index.findByUserId = { by: "user_id" };

const LoginSession = ottoman.model<ILoginSession>(
    "login_sessions",
    LoginSessionSchema
);

export { type ILoginSession, LoginSession };
