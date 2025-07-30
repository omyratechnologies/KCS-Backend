import { Context, Next } from "hono";

/**
 * Rate limiting middleware for meeting APIs
 */
export const meetingRateLimit = () => {
    const requests = new Map<string, { count: number; resetTime: number }>();
    const RATE_LIMIT = 100; // requests per window
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

    return async (ctx: Context, next: Next) => {
        const userKey = `${ctx.get("user_id")}_${ctx.get("campus_id")}`;
        const now = Date.now();
        
        // Clean up expired entries
        for (const [key, data] of requests.entries()) {
            if (now > data.resetTime) {
                requests.delete(key);
            }
        }
        
        const userRequests = requests.get(userKey);
        
        if (!userRequests) {
            requests.set(userKey, { count: 1, resetTime: now + WINDOW_MS });
        } else if (now > userRequests.resetTime) {
            requests.set(userKey, { count: 1, resetTime: now + WINDOW_MS });
        } else if (userRequests.count >= RATE_LIMIT) {
            return ctx.json({
                success: false,
                message: 'Rate limit exceeded. Too many requests.',
                retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
            }, 429);
        } else {
            userRequests.count++;
        }
        
        await next();
    };
};

/**
 * Strict rate limiting for resource-intensive operations
 */
export const strictMeetingRateLimit = () => {
    const requests = new Map<string, { count: number; resetTime: number }>();
    const RATE_LIMIT = 10; // requests per window
    const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    return async (ctx: Context, next: Next) => {
        const userKey = ctx.get("user_id");
        const now = Date.now();
        
        // Clean up expired entries
        for (const [key, data] of requests.entries()) {
            if (now > data.resetTime) {
                requests.delete(key);
            }
        }
        
        const userRequests = requests.get(userKey);
        
        if (!userRequests) {
            requests.set(userKey, { count: 1, resetTime: now + WINDOW_MS });
        } else if (now > userRequests.resetTime) {
            requests.set(userKey, { count: 1, resetTime: now + WINDOW_MS });
        } else if (userRequests.count >= RATE_LIMIT) {
            return ctx.json({
                success: false,
                message: 'Rate limit exceeded for resource-intensive operations.',
                retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
            }, 429);
        } else {
            userRequests.count++;
        }
        
        await next();
    };
};
