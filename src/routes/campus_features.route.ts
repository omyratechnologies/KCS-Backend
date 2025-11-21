import { Hono } from "hono";
import { CampusFeaturesController } from "@/controllers/campus_features.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { checkUserType } from "@/middlewares/role.middleware";

const campusFeaturesRoutes = new Hono();

// All routes require authentication
campusFeaturesRoutes.use("*", authMiddleware());

/**
 * @route   GET /api/super-admin/campus-features
 * @desc    Get features for all campuses
 * @access  Super Admin only
 */
campusFeaturesRoutes.get("/", checkUserType(["Super Admin"]), CampusFeaturesController.getAllCampusFeatures);

/**
 * @route   GET /api/super-admin/campus-features/:campus_id
 * @desc    Get features for a specific campus
 * @access  Admin, Super Admin
 */
campusFeaturesRoutes.get("/:campus_id", checkUserType(["Admin", "Super Admin"]), CampusFeaturesController.getCampusFeatures);

/**
 * @route   PUT /api/super-admin/campus-features/:campus_id
 * @desc    Update features for a specific campus
 * @access  Super Admin only
 * @body    { features: { chat: boolean, meetings: boolean, etc... } }
 */
campusFeaturesRoutes.put("/:campus_id", checkUserType(["Super Admin"]), CampusFeaturesController.updateCampusFeatures);

/**
 * @route   POST /api/super-admin/campus-features/:campus_id/enable/:feature_name
 * @desc    Enable a specific feature for a campus
 * @access  Super Admin only
 */
campusFeaturesRoutes.post("/:campus_id/enable/:feature_name", checkUserType(["Super Admin"]), CampusFeaturesController.enableFeature);

/**
 * @route   POST /api/super-admin/campus-features/:campus_id/disable/:feature_name
 * @desc    Disable a specific feature for a campus
 * @access  Super Admin only
 */
campusFeaturesRoutes.post("/:campus_id/disable/:feature_name", checkUserType(["Super Admin"]), CampusFeaturesController.disableFeature);

/**
 * @route   POST /api/super-admin/campus-features/:campus_id/reset
 * @desc    Reset campus features to defaults (all enabled)
 * @access  Super Admin only
 */
campusFeaturesRoutes.post("/:campus_id/reset", checkUserType(["Super Admin"]), CampusFeaturesController.resetToDefaults);

/**
 * @route   POST /api/super-admin/campus-features/bulk-update
 * @desc    Bulk update features for multiple campuses
 * @access  Super Admin only
 * @body    { campus_ids: string[], features: { chat: boolean, etc... } }
 */
campusFeaturesRoutes.post("/bulk-update", checkUserType(["Super Admin"]), CampusFeaturesController.bulkUpdateFeatures);

export { campusFeaturesRoutes };
