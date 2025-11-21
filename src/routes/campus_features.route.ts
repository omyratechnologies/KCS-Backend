import { Hono } from "hono";
import { CampusFeaturesController } from "@/controllers/campus_features.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { checkUserType } from "@/middlewares/role.middleware";

const campusFeaturesRoutes = new Hono();

// All routes require Super Admin authentication
campusFeaturesRoutes.use("*", authMiddleware());
campusFeaturesRoutes.use("*", checkUserType(["Super Admin"]));

/**
 * @route   GET /api/super-admin/campus-features
 * @desc    Get features for all campuses
 * @access  Super Admin only
 */
campusFeaturesRoutes.get("/", CampusFeaturesController.getAllCampusFeatures);

/**
 * @route   GET /api/super-admin/campus-features/:campus_id
 * @desc    Get features for a specific campus
 * @access  Super Admin only
 */
campusFeaturesRoutes.get("/:campus_id", CampusFeaturesController.getCampusFeatures);

/**
 * @route   PUT /api/super-admin/campus-features/:campus_id
 * @desc    Update features for a specific campus
 * @access  Super Admin only
 * @body    { features: { chat: boolean, meetings: boolean, etc... } }
 */
campusFeaturesRoutes.put("/:campus_id", CampusFeaturesController.updateCampusFeatures);

/**
 * @route   POST /api/super-admin/campus-features/:campus_id/enable/:feature_name
 * @desc    Enable a specific feature for a campus
 * @access  Super Admin only
 */
campusFeaturesRoutes.post("/:campus_id/enable/:feature_name", CampusFeaturesController.enableFeature);

/**
 * @route   POST /api/super-admin/campus-features/:campus_id/disable/:feature_name
 * @desc    Disable a specific feature for a campus
 * @access  Super Admin only
 */
campusFeaturesRoutes.post("/:campus_id/disable/:feature_name", CampusFeaturesController.disableFeature);

/**
 * @route   POST /api/super-admin/campus-features/:campus_id/reset
 * @desc    Reset campus features to defaults (all enabled)
 * @access  Super Admin only
 */
campusFeaturesRoutes.post("/:campus_id/reset", CampusFeaturesController.resetToDefaults);

/**
 * @route   POST /api/super-admin/campus-features/bulk-update
 * @desc    Bulk update features for multiple campuses
 * @access  Super Admin only
 * @body    { campus_ids: string[], features: { chat: boolean, etc... } }
 */
campusFeaturesRoutes.post("/bulk-update", CampusFeaturesController.bulkUpdateFeatures);

export { campusFeaturesRoutes };
