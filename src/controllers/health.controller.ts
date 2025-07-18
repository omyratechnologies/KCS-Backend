import { type Context } from "hono";
import { User } from "@/models/user.model";

export class HealthController {
    /**
     * Check database connectivity
     */
    public static readonly checkDatabase = async (c: Context) => {
        try {
            // Try a simple database operation
            await User.find({ is_deleted: false }, { limit: 1 });
            
            return c.json({
                success: true,
                message: "Database connection healthy",
                timestamp: new Date().toISOString(),
                service: "Ottoman/Couchbase"
            });
        } catch (error) {
            console.error("Database health check failed:", error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            return c.json({
                success: false,
                message: "Database connection failed",
                error: errorMessage,
                timestamp: new Date().toISOString(),
                service: "Ottoman/Couchbase",
                suggestions: [
                    "Check if database service is running",
                    "Verify environment variables (OTTOMAN_*)",
                    "Ensure initDB() was called during application startup",
                    "Check network connectivity to database"
                ]
            }, 500);
        }
    };

    /**
     * Check overall application health
     */
    public static readonly checkHealth = async (c: Context) => {
        const healthChecks = {
            timestamp: new Date().toISOString(),
            status: "healthy",
            version: process.env.npm_package_version || "unknown",
            environment: process.env.NODE_ENV || "unknown",
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            checks: {
                database: { status: "unknown", message: "" }
            }
        };

        // Check database
        try {
            await User.find({ is_deleted: false }, { limit: 1 });
            healthChecks.checks.database = {
                status: "healthy",
                message: "Database connection successful"
            };
        } catch (error) {
            healthChecks.status = "unhealthy";
            healthChecks.checks.database = {
                status: "unhealthy", 
                message: error instanceof Error ? error.message : String(error)
            };
        }

        const statusCode = healthChecks.status === "healthy" ? 200 : 503;
        return c.json(healthChecks, statusCode);
    };
}
