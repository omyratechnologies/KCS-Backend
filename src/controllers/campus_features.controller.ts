import { Context } from "hono";
import { CampusFeaturesService } from "@/services/campus_features.service";
import { Campus } from "@/models/campus.model";

export class CampusFeaturesController {
    /**
     * Get features for a specific campus
     * GET /api/super-admin/campus-features/:campus_id
     */
    static getCampusFeatures = async (ctx: Context) => {
        try {
            const campus_id = ctx.req.param("campus_id");

            if (!campus_id) {
                return ctx.json({ error: "Campus ID is required" }, 400);
            }

            const features = await CampusFeaturesService.getCampusFeatures(campus_id);

            if (!features) {
                // If no features exist, return default (all enabled)
                return ctx.json({
                    success: true,
                    message: "No custom features configured, using defaults",
                    data: {
                        campus_id,
                        features: {
                            chat: true,
                            meetings: true,
                            payments: true,
                            curriculum: true,
                            subject_materials: true,
                            student_parent_access: true,
                        },
                        is_default: true,
                    },
                });
            }

            return ctx.json({
                success: true,
                data: features,
            });
        } catch (error) {
            return ctx.json(
                {
                    error: "Failed to fetch campus features",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get features for all campuses
     * GET /api/super-admin/campus-features
     */
    static getAllCampusFeatures = async (ctx: Context) => {
        try {
            const allFeatures = await CampusFeaturesService.getAllCampusFeatures();
            const campusesResult = await Campus.find({});
            
            // Ottoman returns {rows: [...]} structure
            const allCampuses = campusesResult.rows || [];

            // Merge campus info with features
            const result = allCampuses.map((campus: { id: string; name: string }) => {
                const features = allFeatures.find((f) => f.campus_id === campus.id);
                return {
                    campus_id: campus.id,
                    campus_name: campus.name,
                    features: features
                        ? features.features
                        : {
                              chat: true,
                              meetings: true,
                              payments: true,
                              curriculum: true,
                              subject_materials: true,
                              student_parent_access: true,
                          },
                    updated_by: features?.updated_by,
                    updated_at: features?.updated_at,
                    is_default: !features,
                };
            });

            return ctx.json({
                success: true,
                data: result,
                total: result.length,
            });
        } catch (error) {
            return ctx.json(
                {
                    error: "Failed to fetch all campus features",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Update features for a specific campus
     * PUT /api/super-admin/campus-features/:campus_id
     */
    static updateCampusFeatures = async (ctx: Context) => {
        try {
            const campus_id = ctx.req.param("campus_id");
            const user_id = ctx.get("user_id");
            const body = await ctx.req.json();

            if (!campus_id) {
                return ctx.json({ error: "Campus ID is required" }, 400);
            }

            // Validate features object
            const validFeatures = [
                "chat",
                "meetings",
                "payments",
                "curriculum",
                "subject_materials",
                "student_parent_access",
            ];

            if (!body.features || typeof body.features !== "object") {
                return ctx.json(
                    {
                        error: "Features object is required",
                        valid_features: validFeatures,
                    },
                    400
                );
            }

            // Validate that only valid features are being updated
            const invalidFeatures = Object.keys(body.features).filter(
                (key) => !validFeatures.includes(key)
            );

            if (invalidFeatures.length > 0) {
                return ctx.json(
                    {
                        error: "Invalid features provided",
                        invalid_features: invalidFeatures,
                        valid_features: validFeatures,
                    },
                    400
                );
            }

            // Validate that all feature values are boolean
            const nonBooleanFeatures = Object.entries(body.features).filter(
                ([, value]) => typeof value !== "boolean"
            );

            if (nonBooleanFeatures.length > 0) {
                return ctx.json(
                    {
                        error: "All feature values must be boolean",
                        invalid_values: nonBooleanFeatures.map(([key]) => key),
                    },
                    400
                );
            }

            const updated = await CampusFeaturesService.updateCampusFeatures(
                campus_id,
                body.features,
                user_id
            );

            return ctx.json({
                success: true,
                message: "Campus features updated successfully",
                data: updated,
            });
        } catch (error) {
            return ctx.json(
                {
                    error: "Failed to update campus features",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Enable a specific feature for a campus
     * POST /api/super-admin/campus-features/:campus_id/enable/:feature_name
     */
    static enableFeature = async (ctx: Context) => {
        try {
            const campus_id = ctx.req.param("campus_id");
            const feature_name = ctx.req.param("feature_name");
            const user_id = ctx.get("user_id");

            if (!campus_id || !feature_name) {
                return ctx.json(
                    { error: "Campus ID and feature name are required" },
                    400
                );
            }

            const validFeatures = [
                "chat",
                "meetings",
                "payments",
                "curriculum",
                "subject_materials",
                "student_parent_access",
            ];

            if (!validFeatures.includes(feature_name)) {
                return ctx.json(
                    {
                        error: "Invalid feature name",
                        valid_features: validFeatures,
                    },
                    400
                );
            }

            const updated = await CampusFeaturesService.enableFeature(
                campus_id,
                feature_name as keyof typeof updated.features,
                user_id
            );

            return ctx.json({
                success: true,
                message: `Feature '${feature_name}' enabled successfully`,
                data: updated,
            });
        } catch (error) {
            return ctx.json(
                {
                    error: "Failed to enable feature",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Disable a specific feature for a campus
     * POST /api/super-admin/campus-features/:campus_id/disable/:feature_name
     */
    static disableFeature = async (ctx: Context) => {
        try {
            const campus_id = ctx.req.param("campus_id");
            const feature_name = ctx.req.param("feature_name");
            const user_id = ctx.get("user_id");

            if (!campus_id || !feature_name) {
                return ctx.json(
                    { error: "Campus ID and feature name are required" },
                    400
                );
            }

            const validFeatures = [
                "chat",
                "meetings",
                "payments",
                "curriculum",
                "subject_materials",
                "student_parent_access",
            ];

            if (!validFeatures.includes(feature_name)) {
                return ctx.json(
                    {
                        error: "Invalid feature name",
                        valid_features: validFeatures,
                    },
                    400
                );
            }

            const updated = await CampusFeaturesService.disableFeature(
                campus_id,
                feature_name as keyof typeof updated.features,
                user_id
            );

            return ctx.json({
                success: true,
                message: `Feature '${feature_name}' disabled successfully`,
                data: updated,
            });
        } catch (error) {
            return ctx.json(
                {
                    error: "Failed to disable feature",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Reset campus features to defaults (all enabled)
     * POST /api/super-admin/campus-features/:campus_id/reset
     */
    static resetToDefaults = async (ctx: Context) => {
        try {
            const campus_id = ctx.req.param("campus_id");
            const user_id = ctx.get("user_id");

            if (!campus_id) {
                return ctx.json({ error: "Campus ID is required" }, 400);
            }

            const updated = await CampusFeaturesService.resetToDefaults(
                campus_id,
                user_id
            );

            return ctx.json({
                success: true,
                message: "Campus features reset to defaults successfully",
                data: updated,
            });
        } catch (error) {
            return ctx.json(
                {
                    error: "Failed to reset campus features",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Bulk update features for multiple campuses
     * POST /api/super-admin/campus-features/bulk-update
     */
    static bulkUpdateFeatures = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const body = await ctx.req.json();

            if (!body.campus_ids || !Array.isArray(body.campus_ids)) {
                return ctx.json(
                    { error: "campus_ids array is required" },
                    400
                );
            }

            if (!body.features || typeof body.features !== "object") {
                return ctx.json({ error: "features object is required" }, 400);
            }

            const results = await CampusFeaturesService.bulkUpdateFeatures(
                body.campus_ids,
                body.features,
                user_id
            );

            return ctx.json({
                success: true,
                message: `Features updated for ${results.length} campuses`,
                data: results,
            });
        } catch (error) {
            return ctx.json(
                {
                    error: "Failed to bulk update campus features",
                    details: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };
}
