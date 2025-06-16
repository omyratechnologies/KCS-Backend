import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { AuthController } from "@/controllers/auth.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import {
    forgotPasswordRequestBodySchema,
    forgotPasswordResponseSchema,
    loginRequestBodySchema,
    loginResponseSchema,
    meResponseSchema,
    refreshTokenRequestBodySchema,
    refreshTokenResponseSchema,
    resetPasswordRequestBodySchema,
    resetPasswordResponseSchema,
} from "@/schema/auth";

const app = new Hono();

app.post(
    "/login",
    describeRoute({
        operationId: "login",
        summary: "Login",
        description: "Login to Account",
        tags: ["Auth"],
        responses: {
            200: {
                description: "Login",
                content: {
                    "application/json": {
                        schema: resolver(loginResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", loginRequestBodySchema),
    AuthController.login
);
app.post(
    "/forgot",
    describeRoute({
        operationId: "forgotPassword",
        summary: "Forgot Password",
        description: "Forgot Password",
        tags: ["Auth"],
        responses: {
            200: {
                description: "Forgot Password",
                content: {
                    "application/json": {
                        schema: resolver(forgotPasswordResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", forgotPasswordRequestBodySchema),
    AuthController.forgotPassword
);
app.post(
    "/reset",
    describeRoute({
        operationId: "resetPassword",
        summary: "Reset Password",
        description: "Reset Password",
        tags: ["Auth"],
        responses: {
            200: {
                description: "Reset Password",
                content: {
                    "application/json": {
                        schema: resolver(resetPasswordResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", resetPasswordRequestBodySchema),
    AuthController.resetPassword
);
app.post(
    "/refresh",
    describeRoute({
        operationId: "refreshToken",
        summary: "Refresh Token",
        description: "Refresh Token",
        tags: ["Auth"],
        responses: {
            200: {
                description: "Refresh Token",
                content: {
                    "application/json": {
                        schema: resolver(refreshTokenResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", refreshTokenRequestBodySchema),
    AuthController.refreshToken
);

app.use(authMiddleware());

app.get(
    "/me",
    describeRoute({
        operationId: "me",
        summary: "Me",
        description: "Get Me",
        tags: ["Auth"],
        responses: {
            200: {
                description: "Me",
                content: {
                    "application/json": {
                        schema: resolver(meResponseSchema),
                    },
                },
            },
        },
    }),
    AuthController.whoami
);

export default app;
