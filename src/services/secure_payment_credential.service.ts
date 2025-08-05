import {
    ISchoolBankDetails,
    SchoolBankDetails,
} from "@/models/school_bank_details.model";

import {
    CredentialEncryptionService,
    EncryptedCredential,
    PaymentGatewayCredentials,
} from "./credential_encryption.service";

export class SecurePaymentCredentialService {
    /**
     * Store encrypted payment gateway credentials
     */
    static async storeSecureCredentials(
        campus_id: string,
        credentials: PaymentGatewayCredentials
    ): Promise<ISchoolBankDetails> {
        try {
            // Encrypt credentials
            const encryptedCredentials =
                CredentialEncryptionService.encryptCredentials(credentials);

            // Prepare gateway status (non-sensitive metadata)
            const gatewayStatus: any = {};
            for (const gateway of Object.keys(credentials)) {
                const creds =
                    credentials[gateway as keyof PaymentGatewayCredentials];
                if (creds) {
                    gatewayStatus[gateway] = {
                        enabled: creds.enabled || false,
                        configured: this.isGatewayConfigured(gateway, creds),
                        last_tested: null,
                        test_status: "untested",
                    };
                }
            }

            // Find existing bank details
            const existingBankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            let bankDetails: ISchoolBankDetails;

            if (
                existingBankDetails.rows &&
                existingBankDetails.rows.length > 0
            ) {
                // Update existing record
                bankDetails = await SchoolBankDetails.updateById(
                    existingBankDetails.rows[0].id,
                    {
                        encrypted_payment_credentials: encryptedCredentials,
                        gateway_status: gatewayStatus,
                        credential_updated_at: new Date(),
                        encryption_version: "v1",
                        updated_at: new Date(),
                    }
                );
            } else {
                throw new Error(
                    "Bank details not found. Please setup bank details first."
                );
            }

            return bankDetails;
        } catch (error) {
            throw new Error(`Failed to store secure credentials: ${error}`);
        }
    }

    /**
     * Retrieve and decrypt payment gateway credentials
     */
    static async getSecureCredentials(
        campus_id: string
    ): Promise<PaymentGatewayCredentials | null> {
        try {
            const bankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                return null;
            }

            const details = bankDetails.rows[0];

            // Check if encrypted credentials exist
            if (details.encrypted_payment_credentials) {
                return CredentialEncryptionService.decryptCredentials(
                    details.encrypted_payment_credentials
                );
            }

            // Fallback to legacy unencrypted credentials (for backward compatibility)
            if (details.payment_gateway_credentials) {
                console.warn(
                    `Legacy unencrypted credentials found for campus ${campus_id}. Consider migrating to encrypted storage.`
                );
                return details.payment_gateway_credentials as PaymentGatewayCredentials;
            }

            return null;
        } catch (error) {
            throw new Error(`Failed to retrieve secure credentials: ${error}`);
        }
    }

    /**
     * Get specific gateway credentials
     */
    static async getGatewayCredentials(
        campus_id: string,
        gateway: "razorpay" | "payu" | "cashfree"
    ): Promise<any | null> {
        try {
            const credentials = await this.getSecureCredentials(campus_id);
            return credentials?.[gateway] || null;
        } catch (error) {
            throw new Error(`Failed to get ${gateway} credentials: ${error}`);
        }
    }

    /**
     * Update specific gateway credentials
     */
    static async updateGatewayCredentials(
        campus_id: string,
        gateway: "razorpay" | "payu" | "cashfree",
        newCredentials: any
    ): Promise<ISchoolBankDetails> {
        try {
            // Get existing credentials
            const existingCredentials =
                (await this.getSecureCredentials(campus_id)) || {};

            // Update specific gateway
            const updatedCredentials: PaymentGatewayCredentials = {
                ...existingCredentials,
                [gateway]: newCredentials,
            };

            // Store updated credentials
            return await this.storeSecureCredentials(
                campus_id,
                updatedCredentials
            );
        } catch (error) {
            throw new Error(
                `Failed to update ${gateway} credentials: ${error}`
            );
        }
    }

    /**
     * Remove specific gateway credentials
     */
    static async removeGatewayCredentials(
        campus_id: string,
        gateway: "razorpay" | "payu" | "cashfree"
    ): Promise<ISchoolBankDetails> {
        try {
            const existingCredentials =
                (await this.getSecureCredentials(campus_id)) || {};

            // Remove specific gateway
            delete existingCredentials[gateway];

            return await this.storeSecureCredentials(
                campus_id,
                existingCredentials
            );
        } catch (error) {
            throw new Error(
                `Failed to remove ${gateway} credentials: ${error}`
            );
        }
    }

    /**
     * Get gateway status (non-sensitive information)
     */
    static async getGatewayStatus(campus_id: string): Promise<any> {
        try {
            const bankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                return {};
            }

            return bankDetails.rows[0].gateway_status || {};
        } catch (error) {
            throw new Error(`Failed to get gateway status: ${error}`);
        }
    }

    /**
     * Update gateway status
     */
    static async updateGatewayStatus(
        campus_id: string,
        gateway: "razorpay" | "payu" | "cashfree",
        status: {
            enabled?: boolean;
            configured?: boolean;
            last_tested?: Date;
            test_status?: "success" | "failed" | "untested";
        }
    ): Promise<ISchoolBankDetails> {
        try {
            const bankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                throw new Error("Bank details not found");
            }

            const details = bankDetails.rows[0];
            const gatewayStatus = details.gateway_status || {};

            // Update specific gateway status
            gatewayStatus[gateway] = {
                ...gatewayStatus[gateway],
                ...status,
            };

            return await SchoolBankDetails.updateById(details.id, {
                gateway_status: gatewayStatus,
                updated_at: new Date(),
            });
        } catch (error) {
            throw new Error(`Failed to update gateway status: ${error}`);
        }
    }

    /**
     * Migrate legacy unencrypted credentials to encrypted storage
     */
    static async migrateLegacyCredentials(campus_id: string): Promise<{
        success: boolean;
        message: string;
        migrated_gateways: string[];
    }> {
        try {
            const bankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                return {
                    success: false,
                    message: "Bank details not found",
                    migrated_gateways: [],
                };
            }

            const details = bankDetails.rows[0];

            // Check if already encrypted
            if (details.encrypted_payment_credentials) {
                return {
                    success: true,
                    message: "Credentials already encrypted",
                    migrated_gateways: [],
                };
            }

            // Check if legacy credentials exist
            if (!details.payment_gateway_credentials) {
                return {
                    success: false,
                    message: "No credentials found to migrate",
                    migrated_gateways: [],
                };
            }

            // Migrate to encrypted storage
            const legacyCredentials =
                details.payment_gateway_credentials as PaymentGatewayCredentials;
            await this.storeSecureCredentials(campus_id, legacyCredentials);

            // Clear legacy credentials
            await SchoolBankDetails.updateById(details.id, {
                payment_gateway_credentials: {},
                updated_at: new Date(),
            });

            const migratedGateways = Object.keys(legacyCredentials);

            return {
                success: true,
                message:
                    "Credentials successfully migrated to encrypted storage",
                migrated_gateways: migratedGateways,
            };
        } catch (error) {
            return {
                success: false,
                message: `Migration failed: ${error}`,
                migrated_gateways: [],
            };
        }
    }

    /**
     * Rotate encryption for existing credentials
     */
    static async rotateEncryption(
        campus_id: string,
        oldEncryptionKey: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const bankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                return { success: false, message: "Bank details not found" };
            }

            const details = bankDetails.rows[0];

            if (!details.encrypted_payment_credentials) {
                return {
                    success: false,
                    message: "No encrypted credentials found",
                };
            }

            // Rotate encryption
            const newEncryptedCredentials =
                CredentialEncryptionService.rotateEncryption(
                    details.encrypted_payment_credentials,
                    oldEncryptionKey
                );

            // Update with new encryption
            await SchoolBankDetails.updateById(details.id, {
                encrypted_payment_credentials: newEncryptedCredentials,
                encryption_version: "v2",
                updated_at: new Date(),
            });

            return {
                success: true,
                message: "Encryption rotated successfully",
            };
        } catch (error) {
            return {
                success: false,
                message: `Encryption rotation failed: ${error}`,
            };
        }
    }

    /**
     * Validate encryption key and credentials
     */
    static async validateCredentialSecurity(campus_id: string): Promise<{
        valid: boolean;
        issues: string[];
        recommendations: string[];
    }> {
        try {
            const issues: string[] = [];
            const recommendations: string[] = [];

            // Validate encryption key
            const keyValidation =
                CredentialEncryptionService.validateEncryptionKey();
            if (!keyValidation.valid) {
                issues.push(`Encryption key issue: ${keyValidation.message}`);
            }

            // Check credential storage
            const bankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                issues.push("Bank details not found");
                return { valid: false, issues, recommendations };
            }

            const details = bankDetails.rows[0];

            // Check if using encrypted storage
            if (
                !details.encrypted_payment_credentials &&
                details.payment_gateway_credentials
            ) {
                issues.push("Using legacy unencrypted credential storage");
                recommendations.push("Migrate to encrypted credential storage");
            }

            // Check encryption version
            if (
                details.encryption_version &&
                details.encryption_version !== "v2"
            ) {
                recommendations.push(
                    "Consider updating to latest encryption version"
                );
            }

            // Check last updated
            if (details.credential_updated_at) {
                const daysSinceUpdate = Math.floor(
                    (Date.now() - details.credential_updated_at.getTime()) /
                        (1000 * 60 * 60 * 24)
                );
                if (daysSinceUpdate > 90) {
                    recommendations.push(
                        "Consider rotating payment gateway credentials (>90 days old)"
                    );
                }
            }

            return {
                valid: issues.length === 0,
                issues,
                recommendations,
            };
        } catch (error) {
            return {
                valid: false,
                issues: [`Validation failed: ${error}`],
                recommendations: [],
            };
        }
    }

    /**
     * Check if gateway is properly configured
     */
    private static isGatewayConfigured(
        gateway: string,
        credentials: any
    ): boolean {
        switch (gateway) {
            case "razorpay": {
                return !!(credentials.key_id && credentials.key_secret);
            }
            case "payu": {
                return !!(
                    credentials.merchant_key && credentials.merchant_salt
                );
            }
            case "cashfree": {
                return !!(credentials.app_id && credentials.secret_key);
            }
            default: {
                return false;
            }
        }
    }

    /**
     * Get masked credentials for display/logging
     */
    static async getMaskedCredentials(campus_id: string): Promise<any> {
        try {
            const credentials = await this.getSecureCredentials(campus_id);
            if (!credentials) {
                return null;
            }

            return CredentialEncryptionService.maskCredentials(credentials);
        } catch (error) {
            throw new Error(`Failed to get masked credentials: ${error}`);
        }
    }
}
