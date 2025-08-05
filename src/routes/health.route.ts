import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import { HealthController } from "@/controllers/health.controller";

const app = new Hono();

// Basic health check - no authentication required
app.get(
    "/",
    describeRoute({
        operationId: "getBasicHealthCheck",
        summary: "Basic health check",
        description:
            "Basic application health check - no authentication required",
        tags: ["Health"],
        responses: {
            200: {
                description: "Health check successful",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                timestamp: { type: "string" },
                                version: { type: "string" },
                                environment: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Health check failed",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                error: { type: "string" },
                                timestamp: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    HealthController.checkHealth
);

// Database health check - no authentication required
app.get(
    "/database",
    describeRoute({
        operationId: "getDatabaseHealthCheck",
        summary: "Database health check",
        description: "Check database connectivity - no authentication required",
        tags: ["Health", "Database"],
        responses: {
            200: {
                description: "Database health check successful",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                timestamp: { type: "string" },
                                service: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Database health check failed",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                error: { type: "string" },
                                timestamp: { type: "string" },
                                service: { type: "string" },
                                suggestions: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        },
    }),
    HealthController.checkDatabase
);

// WebRTC health check - no authentication required
app.get(
    "/webrtc",
    describeRoute({
        operationId: "getWebRTCHealthCheck",
        summary: "WebRTC service health check",
        description:
            "Check WebRTC service status and MediaSoup workers - no authentication required",
        tags: ["Health", "WebRTC"],
        responses: {
            200: {
                description: "WebRTC health check successful",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                timestamp: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "WebRTC health check failed",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                error: { type: "string" },
                                timestamp: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    HealthController.checkWebRTC
);

export default app;
