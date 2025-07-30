import { Context, Next } from "hono";

/**
 * Security middleware for meeting APIs
 */
export const meetingSecurityMiddleware = () => {
    return async (ctx: Context, next: Next) => {
        // Set security headers
        ctx.header('X-Content-Type-Options', 'nosniff');
        ctx.header('X-Frame-Options', 'DENY');
        ctx.header('X-XSS-Protection', '1; mode=block');
        ctx.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        ctx.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
        
        // Disable caching for sensitive endpoints
        if (ctx.req.path.includes('/participants') || ctx.req.path.includes('/chat') || ctx.req.path.includes('/analytics')) {
            ctx.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            ctx.header('Pragma', 'no-cache');
            ctx.header('Expires', '0');
        }
        
        await next();
    };
};

/**
 * Meeting access control middleware
 */
export const meetingAccessControl = () => {
    return async (ctx: Context, next: Next) => {
        const userType = ctx.get("user_type");
        const method = ctx.req.method;
        const path = ctx.req.path;
        
        // Admin-only endpoints
        if (path.includes('/system/') && !["Admin", "Super Admin"].includes(userType)) {
            return ctx.json({
                success: false,
                message: 'Access denied - Admin privileges required',
            }, 403);
        }
        
        // Restrict delete operations for certain user types
        if (method === 'DELETE' && userType === 'Student') {
            return ctx.json({
                success: false,
                message: 'Students cannot delete meetings',
            }, 403);
        }
        
        await next();
    };
};
