import { Hono } from "hono";
import { config } from "../utils/env";
import { authMiddleware } from "../middlewares/auth.middleware";

const diagnosticRoutes = new Hono();

/**
 * GET /api/diagnostic/env
 * Check environment variables (admin only)
 */
diagnosticRoutes.get("/env", authMiddleware, async (c) => {
    try {
        const jwtPayload: any = c.get("jwtPayload");
        const user_type = jwtPayload?.user_type;
        
        // Only allow admin users
        if (user_type !== "Admin") {
            return c.json({ 
                success: false, 
                error: "Unauthorized. Admin access required." 
            }, 403);
        }

        return c.json({
            success: true,
            data: {
                NODE_ENV: config.NODE_ENV,
                PORT: config.PORT,
                GETSTREAM_API_KEY: config.GETSTREAM_API_KEY || "NOT_SET",
                GETSTREAM_API_SECRET: config.GETSTREAM_API_SECRET ? 
                    config.GETSTREAM_API_SECRET.substring(0, 20) + "..." : 
                    "NOT_SET",
                GETSTREAM_API_KEY_LENGTH: config.GETSTREAM_API_KEY?.length || 0,
                GETSTREAM_API_SECRET_LENGTH: config.GETSTREAM_API_SECRET?.length || 0,
            }
        });
    } catch (error) {
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, 500);
    }
});

export { diagnosticRoutes };
