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
 * campus_id is extracted from admin token
 */
export const createCampusVendor = async (c: Context) => {
    try {
        // Get campus_id from authenticated admin token (set by authMiddleware)
        const campus_id = c.get("campus_id");

        if (!campus_id) {
            return c.json({
                success: false,
                error: "Unauthorized: campus_id not found in token",
            }, 401);
        }

        const body = await c.req.json();
        const {
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

        // STRICT CHECK: Only ONE vendor per campus allowed (permanent)
        const existingVendor = await CampusVendor.find({
            campus_id: campus_id,
        });

        if (existingVendor && existingVendor.rows.length > 0) {
            return c.json({
                success: false,
                error: "A vendor already exists for this campus. Only one vendor allowed per campus.",
                message: "Use the update endpoint (PUT /vendors) to modify the existing vendor.",
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
            created_by: c.get("user_id") || "admin",
            
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
 * Get vendor for admin's campus
 * Always syncs with Cashfree to get latest status
 * campus_id is extracted from admin token
 */
export const getCampusVendor = async (c: Context) => {
    try {
        // Get campus_id from authenticated admin token (set by authMiddleware)
        const campus_id = c.get("campus_id");

        if (!campus_id) {
            return c.json({
                success: false,
                error: "Unauthorized: campus_id not found in token",
            }, 401);
        }

        const result = await CampusVendor.find({
            campus_id: campus_id,
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
 * Update campus vendor for admin's campus
 * campus_id is extracted from admin token
 */
export const updateCampusVendor = async (c: Context) => {
    try {
        // Get campus_id from authenticated admin token (set by authMiddleware)
        const campus_id = c.get("campus_id");

        if (!campus_id) {
            return c.json({
                success: false,
                error: "Unauthorized: campus_id not found in token",
            }, 401);
        }

        const body = await c.req.json();

        const result = await CampusVendor.find({
            campus_id: campus_id,
            
        });

        if (!result || result.rows.length === 0) {
            return c.json({
                success: false,
                error: "No vendor found for this campus",
            }, 404);
        }

        const vendor = result.rows[0];

        // Accept both naming conventions (vendor_name OR name)
        const vendorName = body.vendor_name || body.name;
        const vendorEmail = body.vendor_email || body.email;
        const vendorPhone = body.vendor_phone || body.phone;
        const vendorStatus = body.vendor_status || body.status;
        const scheduleOption = body.settlement_schedule || body.schedule_option;

        // Prepare update data for Cashfree
        const cashfreeUpdateData: Partial<ICashfreeVendor> = {};

        if (vendorName) {
            cashfreeUpdateData.name = vendorName;
        }
        if (vendorEmail) {
            cashfreeUpdateData.email = vendorEmail;
        }
        if (vendorPhone) {
            cashfreeUpdateData.phone = vendorPhone;
        }
        if (vendorStatus) {
            cashfreeUpdateData.status = vendorStatus;
        }
        if (scheduleOption) {
            cashfreeUpdateData.schedule_option = scheduleOption;
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
            updated_by: c.get("user_id") || "admin",
            updated_at: new Date(),
        };

        if (vendorName) {
            updateData.vendor_name = vendorName;
        }
        if (vendorEmail) {
            updateData.vendor_email = vendorEmail;
        }
        if (vendorPhone) {
            updateData.vendor_phone = vendorPhone;
        }
        if (vendorStatus) {
            updateData.vendor_status = vendorStatus;
        }
        if (scheduleOption) {
            updateData.settlement_schedule = scheduleOption;
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

// NOTE: Delete operation removed. Vendors are create-once and may be updated.
// If a request reaches this old endpoint, return a 405 Not Allowed.
// The route for DELETE was removed from routing, so this function is intentionally omitted.

/**
 * Get vendor balance for admin's campus
 * campus_id is extracted from admin token
 */
export const getVendorBalance = async (c: Context) => {
    try {
        // Get campus_id from authenticated admin token (set by authMiddleware)
        const campus_id = c.get("campus_id");

        if (!campus_id) {
            return c.json({
                success: false,
                error: "Unauthorized: campus_id not found in token",
            }, 401);
        }

        const result = await CampusVendor.find({
            campus_id: campus_id,
            
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
 * Upload vendor documents for admin's campus
 * campus_id is extracted from admin token
 */
export const uploadVendorDocument = async (c: Context) => {
    try {
        // Get campus_id from authenticated admin token (set by authMiddleware)
        const campus_id = c.get("campus_id");

        if (!campus_id) {
            return c.json({
                success: false,
                error: "Unauthorized: campus_id not found in token",
            }, 401);
        }

        const result = await CampusVendor.find({
            campus_id: campus_id,
            
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
 * Get vendor documents for admin's campus
 * campus_id is extracted from admin token
 */
export const getVendorDocuments = async (c: Context) => {
    try {
        // Get campus_id from authenticated admin token (set by authMiddleware)
        const campus_id = c.get("campus_id");

        if (!campus_id) {
            return c.json({
                success: false,
                error: "Unauthorized: campus_id not found in token",
            }, 401);
        }

        const result = await CampusVendor.find({
            campus_id: campus_id,
            
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
