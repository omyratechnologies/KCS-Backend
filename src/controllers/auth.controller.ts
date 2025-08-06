import { Context } from "hono";
import { sign } from "hono/jwt";

import { AuthService } from "@/services/auth.service";
import { UserService } from "@/services/users.service";
import { config } from "@/utils/env";

export class AuthController {
    // Create
    public static readonly login = async (c: Context) => {
        try {
            const { login_id, password } = await c.req.json();

            if (!login_id || !password) {
                throw new Error("Login ID and password are required");
            }

            const user = await AuthService.login({
                login_id,
                password,
            });

            // 7 days
            const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

            const token = await sign(
                {
                    user_id: user.user.id,
                    user_type: user.user.user_type,
                    campus_id: user.campus_id,
                    session_id: user.session_id,
                    exp,
                },
                config.JWT_SECRET,
                "HS512"
            );

            return c.json({
                access_token: token,
                refresh_token: user.refresh_token,
                expires_in: exp,
                type: "Bearer",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    public static readonly forgotPassword = async (c: Context) => {
        try {
            const { email } = await c.req.json();

            if (!email) {
                throw new Error("Email is required");
            }

            await AuthService.forgotPassword({
                email,
            });

            return c.json({
                message: "Password reset email sent",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    public static readonly resetPassword = async (c: Context) => {
        try {
            const { email, otp, password } = await c.req.json();

            if (!email || !otp || !password) {
                throw new Error("Email, OTP and password are required");
            }

            await AuthService.resetPassword({
                email,
                otp,
                password,
            });

            return c.json({
                message: "Password reset successful",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    public static readonly refreshToken = async (c: Context) => {
        try {
            const { refresh_token } = await c.req.json();

            if (!refresh_token) {
                throw new Error("Refresh token is required");
            }

            const { user, session_id, campus_id } = await AuthService.refreshToken({
                refresh_token,
            });

            const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

            const token = await sign(
                {
                    user_id: user.id,
                    user_type: user.user_type,
                    campus_id: campus_id,
                    session_id,
                    exp,
                },
                config.JWT_SECRET,
                "HS512"
            );

            return c.json({
                access_token: token,
                refresh_token,
                expires_in: exp,
                type: "Bearer",
            });
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // get current user
    public static readonly whoami = async (c: Context) => {
        try {
            const user_id = c.get("user_id");
            console.log(user_id);
            const user = await UserService.getUser(user_id);

            return c.json(user);
        } catch (error) {
            if (error instanceof Error) {
                return c.json(
                    {
                        message: error.message,
                    },
                    400
                );
            }
        }
    };
}
