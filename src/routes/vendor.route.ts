/**
 * Campus Vendor Routes
 * CRUD operations for campus vendor management
 */

import { Hono } from "hono";
import {
    createCampusVendor,
    getCampusVendor,
    getAllVendors,
    updateCampusVendor,
    deleteCampusVendor,
    getVendorBalance,
    uploadVendorDocument,
    getVendorDocuments,
} from "../controllers/vendor.controller";

const vendorRoute = new Hono();

// Create vendor for a campus (admin only)
vendorRoute.post("/", createCampusVendor);

// Get all vendors (admin only)
vendorRoute.get("/", getAllVendors);

// Get vendor by campus ID
vendorRoute.get("/:campus_id", getCampusVendor);

// Update vendor by campus ID
vendorRoute.put("/:campus_id", updateCampusVendor);

// Delete vendor by campus ID (soft delete)
vendorRoute.delete("/:campus_id", deleteCampusVendor);

// Get vendor balance by campus ID
vendorRoute.get("/:campus_id/balance", getVendorBalance);

// Upload vendor document
vendorRoute.post("/:campus_id/documents", uploadVendorDocument);

// Get vendor documents
vendorRoute.get("/:campus_id/documents", getVendorDocuments);

export default vendorRoute;
