/**
 * Campus Vendor Routes
 * Vendor management for campus payment accounts
 * - Admin only access (campus_id extracted from token)
 * - One vendor per campus (permanent)
 * - Create once, update anytime
 * - No delete (permanent vendor assignment)
 */

import { Hono } from "hono";
import {
    createCampusVendor,
    getCampusVendor,
    getAllVendors,
    updateCampusVendor,
    getVendorBalance,
    uploadVendorDocument,
    getVendorDocuments,
} from "../controllers/vendor.controller";

const vendorRoute = new Hono();

// Create vendor for admin's campus (admin only) - ONE TIME ONLY
vendorRoute.post("/", createCampusVendor);

// Get all vendors (super admin only)
vendorRoute.get("/all", getAllVendors);

// Get vendor for admin's campus 
vendorRoute.get("/", getCampusVendor);

// Update vendor for admin's campus 
vendorRoute.put("/", updateCampusVendor);

// Get vendor balance for admin's campus 
vendorRoute.get("/balance", getVendorBalance);

// Upload vendor document for admin's campus 
vendorRoute.post("/documents", uploadVendorDocument);

// Get vendor documents for admin's campus 
vendorRoute.get("/documents", getVendorDocuments);

export default vendorRoute;
