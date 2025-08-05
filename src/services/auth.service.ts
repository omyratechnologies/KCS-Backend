import crypto from "node:crypto";

import { onForgotPassword, sendPasswordResetSuccessEmail } from "@/libs/mailer";
import { LoginSession } from "@/models/login_session.model";
import { IPasswordResetsData, PasswordResets } from "@/models/password_reset.model";
import { IUser, User } from "@/models/user.model";
import { LoginSessionsData } from "@/types/db";
import { genOTP } from "@/utils/random";

export class AuthService {
    public static readonly login = async ({ login_id, password }) => {
        const is_login_id_email = login_id.includes("@");

        const filter = is_login_id_email ? { email: login_id } : { user_id: login_id };

        const dbUser: {
            rows: IUser[];
        } = await User.find(filter);

        const user = dbUser.rows;

        if (user.length === 0) {
            throw new Error("User not found");
        }

        const hash = crypto.pbkdf2Sync(password, user[0].salt, 1000, 64, "sha512").toString("hex");

        if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user[0].hash))) {
            throw new Error("Invalid password");
        }

        // create a login session
        const session_id = crypto.randomBytes(16).toString("hex");
        const refresh_token = crypto.randomBytes(32).toString("hex");

        await LoginSession.create({
            user_id: user[0].id,
            session_id,
            refresh_token,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Update last login details
        await User.updateById(user[0].id, {
            last_login: new Date(),
        });

        return {
            user: user[0],
            session_id,
            refresh_token,
        };
    };

    public static readonly forgotPassword = async ({ email }) => {
        const dbUser = (await User.find({
            email,
        })) as {
            rows: IUser[];
        };

        const user = dbUser.rows;

        if (user.length === 0) {
            throw new Error("User not found");
        }

        const otp = genOTP(6);

        await PasswordResets.create({
            user_id: user[0].id,
            reset_token: otp.toString(),
            created_at: new Date(),
            updated_at: new Date(),
        });

        // send email with OTP
        await onForgotPassword(user[0].email, {
            code: otp.toString(),
        });

        return {
            message: "Password reset email sent",
        };
    };

    public static readonly resetPassword = async ({
        email,
        otp,
        password,
    }: {
        email: string;
        otp: string;
        password: string;
    }) => {
        const dbUser = (await User.find({
            email,
        })) as {
            rows: IUser[];
        };

        const user = dbUser.rows;

        if (user.length === 0) {
            throw new Error("User not found");
        }

        const dbReset = (await PasswordResets.find({
            user_id: user[0].id,
        })) as {
            rows: IPasswordResetsData[];
        };

        const reset = dbReset.rows;

        if (reset.length === 0) {
            throw new Error("Reset token not found");
        }

        if (reset[0].reset_token !== otp) {
            throw new Error("Invalid OTP");
        }

        // delete the reset token
        await PasswordResets.removeById(reset[0].id);

        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

        await User.updateById(user[0].id, {
            salt,
            hash,
            updated_at: new Date(),
        });

        // Send password reset success email
        try {
            const resetData = {
                email: user[0].email,
                reset_date: new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
                reset_time: new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                }),
                ip_address: "Unknown", // TODO: Get actual IP from request context
            };

            await sendPasswordResetSuccessEmail(user[0].email, resetData);
        } catch (emailError) {
            // Log email error but don't fail the password reset
            console.error("Failed to send password reset success email:", emailError);
        }

        return {
            message: "Password reset successful",
        };
    };

    public static readonly refreshToken = async ({ refresh_token }) => {
        const dbSession = (await LoginSession.find({
            refresh_token,
        })) as {
            rows: LoginSessionsData[];
        };

        const session = dbSession.rows;

        if (session.length === 0) {
            throw new Error("Invalid refresh token");
        }

        const dbUser = (await User.find({
            user_id: session[0].user_id,
        })) as {
            rows: IUser[];
        };

        const user = dbUser.rows;

        // use existing session_id
        return {
            user: user[0],
            session_id: session[0].session_id,
        };
    };

    // Check if session is valid
    public static readonly checkIfSessionIsValid = async ({ user_id, session_id }) => {
        const dbSession = (await LoginSession.find({
            session_id,
        })) as {
            rows: LoginSessionsData[];
        };

        const session = dbSession.rows;

        if (session.length === 0) {
            throw new Error("Invalid session");
        }

        if (session[0].user_id !== user_id) {
            throw new Error("Invalid session");
        }

        return true;
    };
}
