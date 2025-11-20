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
