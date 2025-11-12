/**
 * Campus Vendor Controller
 * Manages Cashfree vendor accounts for each campus
 * Each campus can have only ONE vendor account
 */

import { Context } from "hono";
import { CampusVendor, type ICampusVendor } from "../models/campus_vendor.model";
import { cashfreeService } from "../services/cashfree.service";
import type { ICashfreeVendor } from "../types/payment-gateway.types";

/**
 * Create vendor for a campus
 * Only admin can create vendors
 * One vendor per campus - strictly enforced
 */
export const createCampusVendor = async (c: Context) => {
    try {
        const body = await c.req.json();
        const {
            campus_id,
            vendor_name,
            name,
            vendor_email,
            email,
            vendor_phone,
            phone,
            settlement_schedule,
            schedule_option,
            bank_details,
            bank,
            upi_details,
            upi,
            kyc_details,
            verify_account = true,
            dashboard_access = true,
        } = body;

        // Accept both naming conventions (vendor_name OR name)
        const vendorName = vendor_name || name;
        const vendorEmail = vendor_email || email;
        const vendorPhone = vendor_phone || phone;
        const scheduleOption = settlement_schedule || schedule_option || 2;
        const bankDetails = bank_details || bank;
        const upiDetails = upi_details || upi;

        // Validation
        if (!vendorName || !vendorEmail || !vendorPhone) {
            return c.json({
                success: false,
                error: "vendor_name/name, vendor_email/email, and vendor_phone/phone are required",
            }, 400);
        }

        // STRICT CHECK: Only ONE vendor per campus allowed
        const existingVendor = await CampusVendor.find({
            campus_id: campus_id,
            is_deleted: false,
        });

        if (existingVendor && existingVendor.rows.length > 0) {
            return c.json({
                success: false,
                error: "A vendor already exists for this campus. Only one vendor allowed per campus.",
                message: "Please delete the existing vendor first or use the update endpoint to modify it.",
                existing_vendor: {
                    vendor_id: existingVendor.rows[0].id,
                    cashfree_vendor_id: existingVendor.rows[0].cashfree_vendor_id,
                    vendor_name: existingVendor.rows[0].vendor_name,
                },
            }, 400);
        }

        // Generate unique vendor ID for Cashfree (alphanumeric only - no hyphens)
        const cashfree_vendor_id = `campus${campus_id.replace(/[^a-zA-Z0-9]/g, '')}${Date.now()}`;

        // Prepare Cashfree vendor data
        const cashfreeVendorData: ICashfreeVendor = {
            vendor_id: cashfree_vendor_id,
            status: "ACTIVE",
            name: vendorName,
            email: vendorEmail,
            phone: vendorPhone,
            verify_account: verify_account,
            dashboard_access: dashboard_access,
            schedule_option: scheduleOption,
        };

        // Add bank or UPI details
        if (bankDetails) {
            cashfreeVendorData.bank = {
                account_number: bankDetails.account_number,
                account_holder: bankDetails.account_holder,
                ifsc: bankDetails.ifsc,
            };
        } else if (upiDetails) {
            cashfreeVendorData.upi = {
                vpa: upiDetails.vpa,
                account_holder: upiDetails.account_holder,
            };
        } else {
            return c.json({
                success: false,
                error: "Either bank_details or upi_details is required",
            }, 400);
        }

        // Add KYC details if provided
        if (kyc_details) {
            cashfreeVendorData.kyc_details = kyc_details;
        }

        // Create vendor in Cashfree
        const cashfreeVendor = await cashfreeService.createVendor(cashfreeVendorData);

        // Create vendor in database
        const vendor = await CampusVendor.create({
            campus_id,
            cashfree_vendor_id,
            vendor_status: "ACTIVE",
            vendor_name: vendorName,
            vendor_email: vendorEmail,
            vendor_phone: vendorPhone,
            verify_account,
            account_verified: false,
            dashboard_access,
            settlement_schedule: scheduleOption,
            bank_details: bankDetails,
            upi_details: upiDetails,
            kyc_details,
            kyc_status: "PENDING",
            created_by: c.get("user")?.id || "admin",
            is_deleted: false,
        });

        return c.json({
            success: true,
            message: "Campus vendor created successfully",
            data: {
                vendor_id: vendor.id,
                campus_id: vendor.campus_id,
                cashfree_vendor_id: vendor.cashfree_vendor_id,
                vendor_status: vendor.vendor_status,
                cashfree_response: cashfreeVendor,
            },
        }, 201);

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to create vendor",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};

/**
 * Get vendor for a campus
 * Always syncs with Cashfree to get latest status
 */
export const getCampusVendor = async (c: Context) => {
    try {
        const campus_id = c.req.param("campus_id");

        const result = await CampusVendor.find({
            campus_id: campus_id,
            is_deleted: false,
        });

        if (!result || result.rows.length === 0) {
            return c.json({
                success: false,
                error: "No vendor found for this campus",
                message: "Create a vendor first using POST /vendors",
            }, 404);
        }

        const vendor = result.rows[0];

        // Always fetch latest details from Cashfree for real-time sync
        let cashfreeVendor: ICashfreeVendor | null = null;
        let syncError: string | null = null;
        
        try {
            cashfreeVendor = await cashfreeService.getVendor(vendor.cashfree_vendor_id);
            
            // Update local database with latest Cashfree status
            if (cashfreeVendor && cashfreeVendor.status !== vendor.vendor_status) {
                await CampusVendor.updateById(vendor.id, {
                    vendor_status: cashfreeVendor.status,
                    updated_at: new Date(),
                });
            }
        } catch (error) {
            syncError = error instanceof Error ? error.message : "Unknown error";
        }

        return c.json({
            success: true,
            data: {
                ...vendor,
                cashfree_details: cashfreeVendor,
                sync_status: syncError ? "failed" : "success",
                sync_error: syncError,
            },
        });

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to get vendor",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};

/**
 * Get all vendors (admin only)
 * Returns all campus vendors in the system
 */
export const getAllVendors = async (c: Context) => {
    try {
        const result = await CampusVendor.find({
            is_deleted: false,
        });

        // Fetch latest status from Cashfree for each vendor
        const vendorsWithCashfreeStatus = await Promise.all(
            result.rows.map(async (vendor) => {
                try {
                    const cashfreeVendor = await cashfreeService.getVendor(vendor.cashfree_vendor_id);
                    return {
                        ...vendor,
                        cashfree_status: cashfreeVendor.status,
                        sync_status: "synced",
                    };
                } catch {
                    return {
                        ...vendor,
                        sync_status: "failed",
                    };
                }
            })
        );

        return c.json({
            success: true,
            count: vendorsWithCashfreeStatus.length,
            data: vendorsWithCashfreeStatus,
        });

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to get vendors",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};

/**
 * Update campus vendor
 */
export const updateCampusVendor = async (c: Context) => {
    try {
        const campus_id = c.req.param("campus_id");
        const body = await c.req.json();

        const result = await CampusVendor.find({
            campus_id: campus_id,
            is_deleted: false,
        });

        if (!result || result.rows.length === 0) {
            return c.json({
                success: false,
                error: "No vendor found for this campus",
            }, 404);
        }

        const vendor = result.rows[0];

        // Prepare update data for Cashfree
        const cashfreeUpdateData: Partial<ICashfreeVendor> = {};

        if (body.vendor_name) {
            cashfreeUpdateData.name = body.vendor_name;
        }
        if (body.vendor_email) {
            cashfreeUpdateData.email = body.vendor_email;
        }
        if (body.vendor_phone) {
            cashfreeUpdateData.phone = body.vendor_phone;
        }
        if (body.vendor_status) {
            cashfreeUpdateData.status = body.vendor_status;
        }
        if (body.settlement_schedule) {
            cashfreeUpdateData.schedule_option = body.settlement_schedule;
        }
        if (body.verify_account !== undefined) {
            cashfreeUpdateData.verify_account = body.verify_account;
        }
        if (body.dashboard_access !== undefined) {
            cashfreeUpdateData.dashboard_access = body.dashboard_access;
        }
        if (body.kyc_details) {
            cashfreeUpdateData.kyc_details = body.kyc_details;
        }

        // Update in Cashfree if there are changes
        let cashfreeVendor: ICashfreeVendor | null = null;
        if (Object.keys(cashfreeUpdateData).length > 0) {
            cashfreeVendor = await cashfreeService.updateVendor(
                vendor.cashfree_vendor_id,
                cashfreeUpdateData
            );
        }

        // Update in database
        const updateData: Partial<ICampusVendor> = {
            updated_by: c.get("user")?.id || "admin",
            updated_at: new Date(),
        };

        if (body.vendor_name) {
            updateData.vendor_name = body.vendor_name;
        }
        if (body.vendor_email) {
            updateData.vendor_email = body.vendor_email;
        }
        if (body.vendor_phone) {
            updateData.vendor_phone = body.vendor_phone;
        }
        if (body.vendor_status) {
            updateData.vendor_status = body.vendor_status;
        }
        if (body.settlement_schedule) {
            updateData.settlement_schedule = body.settlement_schedule;
        }
        if (body.verify_account !== undefined) {
            updateData.verify_account = body.verify_account;
        }
        if (body.dashboard_access !== undefined) {
            updateData.dashboard_access = body.dashboard_access;
        }
        if (body.bank_details) {
            updateData.bank_details = body.bank_details;
        }
        if (body.upi_details) {
            updateData.upi_details = body.upi_details;
        }
        if (body.kyc_details) {
            updateData.kyc_details = body.kyc_details;
        }
        if (body.kyc_status) {
            updateData.kyc_status = body.kyc_status;
        }

        await CampusVendor.updateById(vendor.id, updateData);

        return c.json({
            success: true,
            message: "Vendor updated successfully",
            data: {
                vendor_id: vendor.id,
                campus_id: vendor.campus_id,
                cashfree_response: cashfreeVendor,
            },
        });

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to update vendor",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};

/**
 * Delete campus vendor (soft delete)
 * Admin only - syncs with Cashfree
 */
export const deleteCampusVendor = async (c: Context) => {
    try {
        const campus_id = c.req.param("campus_id");

        const result = await CampusVendor.find({
            campus_id: campus_id,
            is_deleted: false,
        });

        if (!result || result.rows.length === 0) {
            return c.json({
                success: false,
                error: "No vendor found for this campus",
            }, 404);
        }

        const vendor = result.rows[0];

        // Sync with Cashfree - mark vendor as DELETED
        try {
            await cashfreeService.updateVendor(vendor.cashfree_vendor_id, {
                status: "DELETED",
            });
        } catch (cashfreeError) {
            // Log error but continue with database deletion
            if (cashfreeError instanceof Error) {
                return c.json({
                    success: false,
                    error: "Failed to sync deletion with Cashfree",
                    details: cashfreeError.message,
                    message: "Vendor exists in database but Cashfree sync failed. Contact support.",
                }, 500);
            }
        }

        // Soft delete in database
        await CampusVendor.updateById(vendor.id, {
            is_deleted: true,
            vendor_status: "DELETED",
            updated_by: c.get("user")?.id || "admin",
            updated_at: new Date(),
        });

        return c.json({
            success: true,
            message: "Vendor deleted successfully and synced with Cashfree",
            data: {
                campus_id: vendor.campus_id,
                vendor_name: vendor.vendor_name,
                cashfree_vendor_id: vendor.cashfree_vendor_id,
            },
        });

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to delete vendor",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};

/**
 * Get vendor balance
 */
export const getVendorBalance = async (c: Context) => {
    try {
        const campus_id = c.req.param("campus_id");

        const result = await CampusVendor.find({
            campus_id: campus_id,
            is_deleted: false,
        });

        if (!result || result.rows.length === 0) {
            return c.json({
                success: false,
                error: "No vendor found for this campus",
            }, 404);
        }

        const vendor = result.rows[0];

        // Get balance from Cashfree
        const balance = await cashfreeService.getVendorBalance(vendor.cashfree_vendor_id);

        return c.json({
            success: true,
            data: balance,
        });

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to get vendor balance",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};

/**
 * Upload vendor documents
 */
export const uploadVendorDocument = async (c: Context) => {
    try {
        const campus_id = c.req.param("campus_id");
        
        const result = await CampusVendor.find({
            campus_id: campus_id,
            is_deleted: false,
        });

        if (!result || result.rows.length === 0) {
            return c.json({
                success: false,
                error: "No vendor found for this campus",
            }, 404);
        }

        const vendor = result.rows[0];

        // Get form data
        const formData = await c.req.formData();

        // Upload to Cashfree
        const uploadResult = await cashfreeService.uploadVendorDocument(
            vendor.cashfree_vendor_id,
            formData
        );

        return c.json({
            success: true,
            message: "Document uploaded successfully",
            data: uploadResult,
        });

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to upload document",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};

/**
 * Get vendor documents
 */
export const getVendorDocuments = async (c: Context) => {
    try {
        const campus_id = c.req.param("campus_id");

        const result = await CampusVendor.find({
            campus_id: campus_id,
            is_deleted: false,
        });

        if (!result || result.rows.length === 0) {
            return c.json({
                success: false,
                error: "No vendor found for this campus",
            }, 404);
        }

        const vendor = result.rows[0];

        // Get documents from Cashfree
        const documents = await cashfreeService.getVendorDocuments(vendor.cashfree_vendor_id);

        return c.json({
            success: true,
            data: documents,
        });

    } catch (error) {
        if (error instanceof Error) {
            return c.json({
                success: false,
                error: "Failed to get vendor documents",
                details: error.message,
            }, 500);
        }
        throw error;
    }
};
