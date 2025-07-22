import { Schema } from "ottoman";

import { ottoman } from "../libs/db";
import { EncryptedCredential } from "../services/credential_encryption.service";

interface ISchoolBankDetails {
    id: string;
    campus_id: string;
    bank_name: string;
    account_number: string;
    account_holder_name: string;
    ifsc_code: string;
    branch_name: string;
    account_type: string; // savings, current
    upi_id?: string;
    
    // Encrypted payment gateway credentials
    encrypted_payment_credentials?: EncryptedCredential;
    
    // Legacy field for backward compatibility (deprecated)
    payment_gateway_credentials?: {
        razorpay?: {
            key_id: string;
            key_secret: string;
            webhook_secret: string;
            enabled: boolean;
        };
        payu?: {
            merchant_key: string;
            merchant_salt: string;
            enabled: boolean;
        };
        cashfree?: {
            app_id: string;
            secret_key: string;
            enabled: boolean;
        };
    };
    
    // Gateway status information (not encrypted)
    gateway_status: {
        razorpay?: {
            enabled: boolean;
            configured: boolean;
            last_tested?: Date;
            test_status?: "success" | "failed" | "untested";
        };
        payu?: {
            enabled: boolean;
            configured: boolean;
            last_tested?: Date;
            test_status?: "success" | "failed" | "untested";
        };
        cashfree?: {
            enabled: boolean;
            configured: boolean;
            last_tested?: Date;
            test_status?: "success" | "failed" | "untested";
        };
    };
    
    is_active: boolean;
    is_verified: boolean;
    verified_at?: Date;
    credential_updated_at?: Date;
    encryption_version?: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const SchoolBankDetailsSchema = new Schema({
    campus_id: { type: String, required: true },
    bank_name: { type: String, required: true },
    account_number: { type: String, required: true },
    account_holder_name: { type: String, required: true },
    ifsc_code: { type: String, required: true },
    branch_name: { type: String, required: true },
    account_type: { 
        type: String, 
        required: true,
        enum: ["savings", "current"]
    },
    upi_id: { type: String, required: false },
    
    // Encrypted credentials storage
    encrypted_payment_credentials: {
        type: Object,
        required: false
    },
    
    // Legacy field for backward compatibility (deprecated)
    payment_gateway_credentials: {
        type: Object,
        required: false,
        default: {}
    },
    
    // Gateway status (non-sensitive data)
    gateway_status: {
        type: Object,
        required: true,
        default: {}
    },
    
    is_active: { type: Boolean, required: true, default: true },
    is_verified: { type: Boolean, required: true, default: false },
    verified_at: { type: Date, required: false },
    credential_updated_at: { type: Date, required: false },
    encryption_version: { type: String, required: false, default: "v1" },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

SchoolBankDetailsSchema.index.findByCampusId = { by: "campus_id" };
SchoolBankDetailsSchema.index.findByAccountNumber = { by: "account_number" };
SchoolBankDetailsSchema.index.findByIfscCode = { by: "ifsc_code" };

const SchoolBankDetails = ottoman.model<ISchoolBankDetails>(
    "school_bank_details",
    SchoolBankDetailsSchema
);

export { type ISchoolBankDetails,SchoolBankDetails };
