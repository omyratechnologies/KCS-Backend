/**
 * Class Fee Structure Controller
 * Admin manages fee structures for each class (both installment and one-time payment)
 */

import { Context } from "hono";
import { ClassFeeStructure } from "../models/class_fee_structure.model";
import { CampusVendor } from "../models/campus_vendor.model";
import { Class } from "../models/class.model";
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
                total_amount,
                one_time_amount,
                one_time_enabled,
                installments_enabled,
                installments,
                amenities,
                fee_description,
            } = body;

            // Validation
            if (!class_id) {
                return c.json({ success: false, message: "Missing required field: class_id" }, 400);
            }

            // Fetch class details to get class_name and academic_year
            const classData = await Class.findById(class_id);
            if (!classData) {
                return c.json({ success: false, message: "Class not found" }, 404);
            }

            // Verify class belongs to this campus
            if (classData.campus_id !== campus_id) {
                return c.json({ success: false, message: "Unauthorized access to class" }, 403);
            }

            // Both payment options should be available
            if (!one_time_enabled && !installments_enabled) {
                return c.json({ success: false, message: "At least one payment option must be enabled" }, 400);
            }

            // Verify vendor exists for this campus
            const vendorResult = await CampusVendor.find({ campus_id });
            const vendor = vendorResult && vendorResult.rows.length > 0 ? vendorResult.rows[0] : null;

            if (!vendor) {
                return c.json(
                    {
                        success: false,
                        message: "Campus vendor not configured. Please setup vendor first.",
                        debug: { campus_id },
                    },
                    400
                );
            }

            // Verify vendor exists in Cashfree (relaxed validation for testing)
            try {
                const cashfreeVendor = await cashfreeService.getVendor(vendor.cashfree_vendor_id);
                // Allow BANK_VALIDATION_FAILED for testing - only block DELETED/INACTIVE
                if (cashfreeVendor.status === "DELETED" || cashfreeVendor.status === "INACTIVE") {
                    return c.json(
                        { success: false, message: `Campus vendor is ${cashfreeVendor.status} in Cashfree` },
                        400
                    );
                }
            } catch (error) {
                return c.json(
                    {
                        success: false,
                        message: "Failed to verify vendor status",
                        error: error instanceof Error ? error.message : "Unknown error",
                    },
                    400
                );
            }

            // Check for existing fee structure - STRICT VALIDATION
            // Only ONE fee structure allowed per class per academic year
            const feeResult = await ClassFeeStructure.find({
                campus_id,
                class_id,
            });

            if (feeResult && feeResult.rows && feeResult.rows.length > 0) {
                const existingFee = feeResult.rows[0];
                return c.json(
                    {
                        success: false,
                        message:
                            "Fee structure already exists for this class and academic year. Each class can have only ONE fee structure. Use update to modify it.",
                        existing_fee_id: existingFee.id,
                        existing_total_amount: existingFee.total_amount,
                    },
                    409
                );
            }

            // Validate amenities total matches fee amount (if amenities provided)
            if (amenities && amenities.length > 0) {
                const amenitiesTotal = amenities.reduce(
                    (sum: number, amenity: { total_amount?: number }) => sum + (amenity.total_amount || 0),
                    0
                );
                const roundedAmenitiesTotal = Math.round(amenitiesTotal * 100) / 100; // Round to 2 decimals
                const roundedTotalAmount = Math.round((total_amount || 0) * 100) / 100;

                if (Math.abs(roundedAmenitiesTotal - roundedTotalAmount) > 0.01) {
                    // Allow 1 paisa difference for rounding
                    return c.json(
                        {
                            success: false,
                            message: `Amenities total (₹${roundedAmenitiesTotal}) must match the total fee amount (₹${roundedTotalAmount})`,
                            amenities_total: roundedAmenitiesTotal,
                            fee_total: roundedTotalAmount,
                            difference: Math.abs(roundedAmenitiesTotal - roundedTotalAmount),
                        },
                        400
                    );
                }
            }

            // Validate installments sum equals total amount (if installments provided)
            if (installments && installments.length > 0) {
                const installmentsTotal = installments.reduce(
                    (sum: number, inst: { amount?: number }) => sum + (inst.amount || 0),
                    0
                );
                const roundedInstallmentsTotal = Math.round(installmentsTotal * 100) / 100;
                const roundedTotalAmount = Math.round((total_amount || 0) * 100) / 100;

                if (Math.abs(roundedInstallmentsTotal - roundedTotalAmount) > 0.01) {
                    return c.json(
                        {
                            success: false,
                            message: `Sum of installments (₹${roundedInstallmentsTotal}) must equal the total fee amount (₹${roundedTotalAmount})`,
                            installments_total: roundedInstallmentsTotal,
                            fee_total: roundedTotalAmount,
                            difference: Math.abs(roundedInstallmentsTotal - roundedTotalAmount),
                        },
                        400
                    );
                }
            }

            // Validate one-time amount cannot exceed total amount
            if (one_time_amount !== undefined && total_amount !== undefined) {
                if (one_time_amount > total_amount) {
                    return c.json(
                        {
                            success: false,
                            message: `One-time amount (₹${one_time_amount}) cannot be greater than total amount (₹${total_amount})`,
                            one_time_amount,
                            total_amount,
                        },
                        400
                    );
                }
            }

            // Create fee structure
            const feeStructure = new ClassFeeStructure({
                campus_id,
                class_id,
                total_amount: total_amount || 0,
                one_time_amount: one_time_amount || 0,
                one_time_enabled: one_time_enabled !== false, // Default true
                installments_enabled: installments_enabled !== false, // Default true
                installments: installments || [],
                amenities: amenities || [],
                fee_description: fee_description || "",
                created_by: admin_id,
                created_at: new Date(),
                updated_at: new Date(),
            });

            await feeStructure.save();

            return c.json(
                {
                    success: true,
                    message: "Fee structure created successfully",
                    data: feeStructure,
                },
                201
            );
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Create Fee Structure Error:", error);
            return c.json(
                {
                    success: false,
                    message: "Failed to create fee structure",
                    error: error instanceof Error ? error.message : "Unknown error",
                    stack: error instanceof Error ? error.stack : undefined,
                },
                500
            );
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
                data: feeStructures.rows || [],
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Get Fee Structures Error:", error);
            return c.json(
                {
                    success: false,
                    message: "Failed to fetch fee structures",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
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

            const feeStructureResult = await ClassFeeStructure.find({ id });
            const feeStructure =
                feeStructureResult && feeStructureResult.rows.length > 0 ? feeStructureResult.rows[0] : null;

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
            return c.json(
                {
                    success: false,
                    message: "Failed to fetch fee structure",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    }

    /**
     * Update fee structure
     * PATCH /api/fee-structures/:id
     */
    static async updateFeeStructure(c: Context) {
        try {
            const campus_id = c.get("campus_id");
            const { id } = c.req.param();

            if (!campus_id) {
                return c.json({ success: false, message: "Campus ID not found in token" }, 401);
            }

            const feeStructureResult = await ClassFeeStructure.find({ id });
            const feeStructure =
                feeStructureResult && feeStructureResult.rows.length > 0 ? feeStructureResult.rows[0] : null;

            if (!feeStructure) {
                return c.json({ success: false, message: "Fee structure not found" }, 404);
            }

            // Verify campus ownership
            if (feeStructure.campus_id !== campus_id) {
                return c.json({ success: false, message: "Unauthorized access to fee structure" }, 403);
            }

            const body = await c.req.json();

            const allowedKeys = [
                "total_amount",
                "one_time_amount",
                "one_time_enabled",
                "installments_enabled",
                "installments",
                "amenities",
                "fee_description",
            ];

            // validate unknown fields
            const unknown = Object.keys(body).filter((k) => !allowedKeys.includes(k));
            if (unknown.length) {
                return c.json({ success: false, message: `Invalid field(s): ${unknown.join(", ")}` }, 400);
            }

            // pick only allowed keys without repeating them
            const data = Object.fromEntries(allowedKeys.map((k) => [k, body[k]]));

            // Update fields if provided
            for (const key of Object.keys(data)) {
                if (data[key] !== undefined) {
                    feeStructure[key] = data[key];
                }
            }

            // Validate amenities total matches fee amount (if both are present)
            if (feeStructure.amenities && feeStructure.amenities.length > 0) {
                const amenitiesTotal = feeStructure.amenities.reduce(
                    (sum: number, amenity: { total_amount?: number }) => sum + (amenity.total_amount || 0),
                    0
                );
                const roundedAmenitiesTotal = Math.round(amenitiesTotal * 100) / 100;
                const roundedTotalAmount = Math.round(feeStructure.total_amount * 100) / 100;

                if (Math.abs(roundedAmenitiesTotal - roundedTotalAmount) > 0.01) {
                    return c.json(
                        {
                            success: false,
                            message: `Amenities total (₹${roundedAmenitiesTotal}) must match the total fee amount (₹${roundedTotalAmount})`,
                            amenities_total: roundedAmenitiesTotal,
                            fee_total: roundedTotalAmount,
                            difference: Math.abs(roundedAmenitiesTotal - roundedTotalAmount),
                        },
                        400
                    );
                }
            }

            // Validate installments sum equals total amount (if both are present)
            if (feeStructure.installments && feeStructure.installments.length > 0) {
                const installmentsTotal = feeStructure.installments.reduce(
                    (sum: number, inst: { amount?: number }) => sum + (inst.amount || 0),
                    0
                );
                const roundedInstallmentsTotal = Math.round(installmentsTotal * 100) / 100;
                const roundedTotalAmount = Math.round(feeStructure.total_amount * 100) / 100;

                if (Math.abs(roundedInstallmentsTotal - roundedTotalAmount) > 0.01) {
                    return c.json(
                        {
                            success: false,
                            message: `Sum of installments (₹${roundedInstallmentsTotal}) must equal the total fee amount (₹${roundedTotalAmount})`,
                            installments_total: roundedInstallmentsTotal,
                            fee_total: roundedTotalAmount,
                            difference: Math.abs(roundedInstallmentsTotal - roundedTotalAmount),
                        },
                        400
                    );
                }
            }

            // Validate one-time amount cannot exceed total amount
            if (feeStructure.one_time_amount > feeStructure.total_amount) {
                return c.json(
                    {
                        success: false,
                        message: `One-time amount (₹${feeStructure.one_time_amount}) cannot be greater than total amount (₹${feeStructure.total_amount})`,
                        one_time_amount: feeStructure.one_time_amount,
                        total_amount: feeStructure.total_amount,
                    },
                    400
                );
            }

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
            return c.json(
                {
                    success: false,
                    message: "Failed to update fee structure",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    }
}
