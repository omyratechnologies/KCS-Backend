import { Schema } from "ottoman";

import { ottoman } from "../libs/db";
import { VendorSettlementSchedule } from "../types/payment-gateway.types";

interface IVendorBankDetails {
    account_number: string;
    account_holder: string;
    ifsc: string;
}

interface IVendorUPIDetails {
    vpa: string;
    account_holder: string;
}

interface IVendorKYCDetails {
    account_type: string;      // Proprietorship, Partnership, Company
    business_type: string;      // Education, etc.
    uidai?: string;
    gst?: string;
    cin?: string;
    pan?: string;
    passport_number?: string;
}

interface ICampusVendor {
    id: string;
    campus_id: string;                          // Link to campus
    
    // Cashfree vendor details
    cashfree_vendor_id: string;                 // Unique vendor ID for Cashfree
    vendor_status: "ACTIVE" | "INACTIVE" | "DELETED";
    
    // Vendor information
    vendor_name: string;
    vendor_email: string;
    vendor_phone: string;
    
    // Account verification
    verify_account: boolean;
    account_verified: boolean;
    verification_status?: string;
    
    // Dashboard access
    dashboard_access: boolean;
    
    // Settlement configuration
    settlement_schedule: VendorSettlementSchedule;
    
    // Bank or UPI details
    bank_details?: IVendorBankDetails;
    upi_details?: IVendorUPIDetails;
    
    // KYC details
    kyc_details?: IVendorKYCDetails;
    kyc_status?: "PENDING" | "VERIFIED" | "REJECTED";
    
    // Metadata
    created_by: string;
    updated_by?: string;
    created_at: Date;
    updated_at: Date;
    is_deleted: boolean;
}

const CampusVendorSchema = new Schema({
    campus_id: { type: String, required: true },
    
    cashfree_vendor_id: { type: String, required: true },
    vendor_status: { type: String, required: true, default: "ACTIVE" },
    
    vendor_name: { type: String, required: true },
    vendor_email: { type: String, required: true },
    vendor_phone: { type: String, required: true },
    
    verify_account: { type: Boolean, required: true, default: true },
    account_verified: { type: Boolean, required: true, default: false },
    verification_status: { type: String, required: false },
    
    dashboard_access: { type: Boolean, required: true, default: true },
    
    settlement_schedule: { type: Number, required: true, default: 2 },
    
    bank_details: Object,
    upi_details: Object,
    kyc_details: Object,
    
    kyc_status: { type: String, required: false, default: "PENDING" },
    
    created_by: { type: String, required: true },
    updated_by: { type: String, required: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
    is_deleted: { type: Boolean, required: true, default: false },
});

// Indexes
CampusVendorSchema.index.findByCampusId = { by: "campus_id" };
CampusVendorSchema.index.findByCashfreeVendorId = { by: "cashfree_vendor_id" };
CampusVendorSchema.index.findByStatus = { by: "vendor_status" };

const CampusVendor = ottoman.model<ICampusVendor>("campus_vendor", CampusVendorSchema);

export { CampusVendor, type ICampusVendor, type IVendorBankDetails, type IVendorUPIDetails, type IVendorKYCDetails };
