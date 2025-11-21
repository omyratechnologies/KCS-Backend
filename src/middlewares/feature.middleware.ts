import { Context, MiddlewareHandler, Next } from "hono";
import { CampusFeatures } from "@/models/campus_features.model";

export type FeatureType = 
    | "chat" 
    | "meetings" 
    | "payments" 
    | "curriculum" 
    | "subject_materials" 
    | "student_parent_access";

/**
 * Strict middleware to check if a specific feature is enabled for a campus
 * This middleware should be used on routes that require feature-level access control
 * 
 * @param featureName - The name of the feature to check (chat, meetings, payments, etc.)
 * @returns MiddlewareHandler
 * 
 * @example
 * // Protect chat routes
 * app.use("/api/chat/*", featureAccessMiddleware("chat"));
 * 
 * // Protect meeting routes
 * app.use("/api/meetings/*", featureAccessMiddleware("meetings"));
 */
export const featureAccessMiddleware = (featureName: FeatureType): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");
        const campus_id = ctx.get("campus_id");

        // Super Admin bypasses all feature restrictions
        if (user_type === "Super Admin") {
            await next();
            return;
        }

        // All other users need a campus_id
        if (!campus_id) {
            return ctx.json(
                { 
                    error: "Campus ID is required", 
                    message: "Unable to verify feature access without campus context" 
                }, 
                400
            );
        }

        try {
            // Fetch campus features
            const campusFeatures = await CampusFeatures.findOne({ campus_id });

            // If no feature record exists, assume all features are enabled (backward compatibility)
            if (!campusFeatures) {
                await next();
                return;
            }

            // Check if the specific feature is enabled
            const isFeatureEnabled = campusFeatures.features[featureName];

            if (!isFeatureEnabled) {
                return ctx.json(
                    { 
                        error: "Feature Disabled", 
                        message: `The ${featureName} feature is currently disabled for your campus. Please contact your administrator.`,
                        feature: featureName,
                        campus_id: campus_id
                    }, 
                    403
                );
            }

            // Feature is enabled, proceed
            await next();
        } catch (error) {
            console.error(`Error checking feature access for ${featureName}:`, error);
            return ctx.json(
                { 
                    error: "Feature Access Check Failed", 
                    message: "Unable to verify feature access. Please try again later." 
                }, 
                500
            );
        }
    };
};

/**
 * Middleware to block creation of Student or Parent accounts when feature is disabled
 * This should be used on user creation routes to prevent student/parent registration
 * when the campus has disabled this feature
 */
export const studentParentCreationMiddleware = (): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");
        const campus_id = ctx.get("campus_id");

        // Super Admin bypasses this check
        if (user_type === "Super Admin") {
            await next();
            return;
        }

        if (!campus_id) {
            return ctx.json(
                { 
                    error: "Campus ID is required", 
                    message: "Unable to verify access without campus context" 
                }, 
                400
            );
        }

        try {
            // Clone the request to read the body without consuming it
            const body = await ctx.req.json();
            
            // Check if it's a bulk creation request
            if (Array.isArray(body.users)) {
                // Bulk creation - check if any user is student or parent
                const hasStudentOrParent = body.users.some((user: { user_type?: string }) => {
                    const userType = user.user_type?.toLowerCase();
                    return userType === "student" || userType === "parent";
                });

                if (hasStudentOrParent) {
                    const campusFeatures = await CampusFeatures.findOne({ campus_id });

                    if (campusFeatures && !campusFeatures.features.student_parent_access) {
                        return ctx.json(
                            { 
                                error: "Feature Disabled", 
                                message: "Creation of Student and Parent accounts is currently disabled for your campus. Please contact your administrator.",
                                feature: "student_parent_access",
                                campus_id: campus_id
                            }, 
                            403
                        );
                    }
                }
            } else {
                // Single user creation
                const targetUserType = body.user_type?.toLowerCase();

                if (targetUserType === "student" || targetUserType === "parent") {
                    const campusFeatures = await CampusFeatures.findOne({ campus_id });

                    if (campusFeatures && !campusFeatures.features.student_parent_access) {
                        return ctx.json(
                            { 
                                error: "Feature Disabled", 
                                message: `Creation of ${targetUserType} accounts is currently disabled for your campus. Please contact your administrator.`,
                                feature: "student_parent_access",
                                campus_id: campus_id
                            }, 
                            403
                        );
                    }
                }
            }

            await next();
        } catch {
            return ctx.json(
                { 
                    error: "Access Check Failed", 
                    message: "Unable to verify access. Please try again later." 
                }, 
                500
            );
        }
    };
};

/**
 * Helper function to check multiple features at once
 * Useful for routes that depend on multiple features
 */
export const checkMultipleFeatures = (features: FeatureType[]): MiddlewareHandler => {
    return async (ctx: Context, next: Next) => {
        const user_type = ctx.get("user_type");
        const campus_id = ctx.get("campus_id");

        // Super Admin bypasses all feature restrictions
        if (user_type === "Super Admin") {
            await next();
            return;
        }

        if (!campus_id) {
            return ctx.json(
                { 
                    error: "Campus ID is required", 
                    message: "Unable to verify feature access without campus context" 
                }, 
                400
            );
        }

        try {
            const campusFeatures = await CampusFeatures.findOne({ campus_id });

            // If no feature record exists, assume all features are enabled
            if (!campusFeatures) {
                await next();
                return;
            }

            // Check all required features
            const disabledFeatures = features.filter(
                feature => !campusFeatures.features[feature]
            );

            if (disabledFeatures.length > 0) {
                return ctx.json(
                    { 
                        error: "Features Disabled", 
                        message: `The following features are currently disabled for your campus: ${disabledFeatures.join(", ")}`,
                        disabled_features: disabledFeatures,
                        campus_id: campus_id
                    }, 
                    403
                );
            }

            await next();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return ctx.json(
                { 
                    error: "Feature Access Check Failed", 
                    message: "Unable to verify feature access. Please try again later.",
                    details: errorMessage
                }, 
                500
            );
        }
    };
};
