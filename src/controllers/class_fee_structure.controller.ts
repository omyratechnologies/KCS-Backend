/**
 * Class Fee Structure Controller
 * Admin manages fee structures for each class (both installment and one-time payment)
 */

import { Context } from "hono";
import { ClassFeeStructure } from "../models/class_fee_structure.model";
import { CampusVendor } from "../models/campus_vendor.model";
import { cashfreeService } from "../services/cashfree.service";

export class ClassFeeStructureController {
    /**
     * Create fee structure for a class
     * POST /api/fee-structures
     */
    static async createFeeStructure(c: Context) {
        try {
            const campus_id = c.get("campus_id");
            const admin_id = c.get("user_id");

            if (!campus_id) {
                return c.json({ success: false, message: "Campus ID not found in token" }, 401);
            }

            const body = await c.req.json();
            const {
                class_id,
                class_name,
                academic_year,
                total_amount,
                one_time_amount,
                one_time_enabled,
                installments_enabled,
                installments,
                vendor_split_percentage,
            } = body;

            // Validation
            if (!class_id || !class_name || !academic_year) {
                return c.json({ success: false, message: "Missing required fields: class_id, class_name, academic_year" }, 400);
            }

            // Both payment options should be available
            if (!one_time_enabled && !installments_enabled) {
                return c.json({ success: false, message: "At least one payment option must be enabled" }, 400);
            }

            // Verify vendor exists for this campus  
            const vendorResult = await CampusVendor.find({ campus_id });
            const vendor = vendorResult && vendorResult.rows.length > 0 ? vendorResult.rows[0] : null;
            
            if (!vendor) {
                return c.json({ 
                    success: false, 
                    message: "Campus vendor not configured. Please setup vendor first.",
                    debug: { campus_id } 
                }, 400);
            }

            // Verify vendor exists in Cashfree (relaxed validation for testing)
            try {
                const cashfreeVendor = await cashfreeService.getVendor(vendor.cashfree_vendor_id);
                // Allow BANK_VALIDATION_FAILED for testing - only block DELETED/INACTIVE
                if (cashfreeVendor.status === "DELETED" || cashfreeVendor.status === "INACTIVE") {
                    return c.json({ success: false, message: `Campus vendor is ${cashfreeVendor.status} in Cashfree` }, 400);
                }
            } catch (error) {
                return c.json({ success: false, message: "Failed to verify vendor status", error: error instanceof Error ? error.message : "Unknown error" }, 400);
            }

            // Check for existing fee structure (use find instead of findOne to avoid throwing error)
            let existingFee = null;
            try {
                const feeResult = await ClassFeeStructure.find({ 
                    campus_id, 
                    class_id, 
                    academic_year 
                });
                existingFee = feeResult && feeResult.rows.length > 0 ? feeResult.rows[0] : null;
            } catch {
                // Ignore not found error
            }

            if (existingFee) {
                return c.json({ success: false, message: "Fee structure already exists for this class and academic year. Use update instead." }, 409);
            }

            // Create fee structure
            const feeStructure = new ClassFeeStructure({
                campus_id,
                class_id,
                class_name,
                academic_year,
                total_amount: total_amount || 0,
                one_time_amount: one_time_amount || 0,
                one_time_enabled: one_time_enabled !== false, // Default true
                installments_enabled: installments_enabled !== false, // Default true
                installments: installments || [],
                vendor_id: vendor.cashfree_vendor_id,
                vendor_split_percentage: vendor_split_percentage || 100, // Default 100%
                created_by: admin_id,
                created_at: new Date(),
                updated_at: new Date(),
            });

            await feeStructure.save();

            return c.json({
                success: true,
                message: "Fee structure created successfully",
                data: feeStructure,
            }, 201);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Create Fee Structure Error:", error);
            return c.json({
                success: false,
                message: "Failed to create fee structure",
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            }, 500);
        }
    }

    /**
     * Get all fee structures for the campus
     * GET /api/fee-structures
     */
    static async getAllFeeStructures(c: Context) {
        try {
            const campus_id = c.get("campus_id");

            if (!campus_id) {
                return c.json({ success: false, message: "Campus ID not found in token" }, 401);
            }

            // Query params for filtering
            const academic_year = c.req.query("academic_year");
            const class_id = c.req.query("class_id");

            const filter: { campus_id: string; academic_year?: string; class_id?: string } = { campus_id };
            if (academic_year) {
                filter.academic_year = academic_year;
            }
            if (class_id) {
                filter.class_id = class_id;
            }

            const feeStructures = await ClassFeeStructure.find(filter);

            return c.json({
                success: true,
                count: feeStructures.length,
                data: feeStructures,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Get Fee Structures Error:", error);
            return c.json({
                success: false,
                message: "Failed to fetch fee structures",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Get single fee structure by ID
     * GET /api/fee-structures/:id
     */
    static async getFeeStructureById(c: Context) {
        try {
            const campus_id = c.get("campus_id");
            const { id } = c.req.param();

            if (!campus_id) {
                return c.json({ success: false, message: "Campus ID not found in token" }, 401);
            }

            const feeStructure = await ClassFeeStructure.findById(id);

            if (!feeStructure) {
                return c.json({ success: false, message: "Fee structure not found" }, 404);
            }

            // Verify campus ownership
            if (feeStructure.campus_id !== campus_id) {
                return c.json({ success: false, message: "Unauthorized access to fee structure" }, 403);
            }

            return c.json({
                success: true,
                data: feeStructure,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Get Fee Structure Error:", error);
            return c.json({
                success: false,
                message: "Failed to fetch fee structure",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Update fee structure
     * PUT /api/fee-structures/:id
     */
    static async updateFeeStructure(c: Context) {
        try {
            const campus_id = c.get("campus_id");
            const admin_id = c.get("user_id");
            const { id } = c.req.param();

            if (!campus_id) {
                return c.json({ success: false, message: "Campus ID not found in token" }, 401);
            }

            const feeStructure = await ClassFeeStructure.findById(id);

            if (!feeStructure) {
                return c.json({ success: false, message: "Fee structure not found" }, 404);
            }

            // Verify campus ownership
            if (feeStructure.campus_id !== campus_id) {
                return c.json({ success: false, message: "Unauthorized access to fee structure" }, 403);
            }

            const body = await c.req.json();
            const {
                class_name,
                total_amount,
                one_time_amount,
                one_time_enabled,
                installments_enabled,
                installments,
                vendor_split_percentage,
            } = body;

            // Update fields
            if (class_name !== undefined) {
                feeStructure.class_name = class_name;
            }
            if (total_amount !== undefined) {
                feeStructure.total_amount = total_amount;
            }
            if (one_time_amount !== undefined) {
                feeStructure.one_time_amount = one_time_amount;
            }
            if (one_time_enabled !== undefined) {
                feeStructure.one_time_enabled = one_time_enabled;
            }
            if (installments_enabled !== undefined) {
                feeStructure.installments_enabled = installments_enabled;
            }
            if (installments !== undefined) {
                feeStructure.installments = installments;
            }
            if (vendor_split_percentage !== undefined) {
                feeStructure.vendor_split_percentage = vendor_split_percentage;
            }

            feeStructure.updated_by = admin_id;
            feeStructure.updated_at = new Date();

            await feeStructure.save();

            return c.json({
                success: true,
                message: "Fee structure updated successfully",
                data: feeStructure,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Update Fee Structure Error:", error);
            return c.json({
                success: false,
                message: "Failed to update fee structure",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Delete fee structure (soft delete - mark as inactive)
     * DELETE /api/fee-structures/:id
     */
    static async deleteFeeStructure(c: Context) {
        try {
            const campus_id = c.get("campus_id");
            const { id } = c.req.param();

            if (!campus_id) {
                return c.json({ success: false, message: "Campus ID not found in token" }, 401);
            }

            const feeStructure = await ClassFeeStructure.findById(id);

            if (!feeStructure) {
                return c.json({ success: false, message: "Fee structure not found" }, 404);
            }

            // Verify campus ownership
            if (feeStructure.campus_id !== campus_id) {
                return c.json({ success: false, message: "Unauthorized access to fee structure" }, 403);
            }

            // Soft delete
            await ClassFeeStructure.removeById(id);

            return c.json({
                success: true,
                message: "Fee structure deleted successfully",
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Delete Fee Structure Error:", error);
            return c.json({
                success: false,
                message: "Failed to delete fee structure",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }
}
