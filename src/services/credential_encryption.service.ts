import crypto from "node:crypto";

export interface EncryptedCredential {
    encrypted_data: string;
    iv: string;
    tag: string;
    algorithm: string;
}

export interface PaymentGatewayCredentials {
    razorpay?: {
        key_id: string;
        key_secret: string;
        webhook_secret?: string;
        enabled: boolean;
        mode?: "test" | "live";
    };
    payu?: {
        merchant_key: string;
        merchant_salt: string;
        enabled: boolean;
        mode?: "test" | "live";
    };
    cashfree?: {
        app_id: string;
        secret_key: string;
        enabled: boolean;
        mode?: "test" | "live";
    };
}

export class CredentialEncryptionService {
    private static readonly ALGORITHM = "aes-256-gcm";
    private static readonly KEY_LENGTH = 32; // 256 bits
    private static readonly IV_LENGTH = 16; // 128 bits
    
    /**
     * Get encryption key from environment variables
     */
    private static getEncryptionKey(): Buffer {
        const key = process.env.PAYMENT_CREDENTIAL_ENCRYPTION_KEY;
        if (!key) {
            throw new Error("PAYMENT_CREDENTIAL_ENCRYPTION_KEY environment variable not set");
        }
        
        // If key is base64 encoded
        if (key.length === 44 && key.endsWith("=")) {
            return Buffer.from(key, "base64");
        }
        
        // If key is hex encoded
        if (key.length === 64) {
            return Buffer.from(key, "hex");
        }
        
        // Generate key from string (less secure, not recommended for production)
        return crypto.scryptSync(key, "salt", this.KEY_LENGTH);
    }

    /**
     * Generate a new encryption key (for initial setup)
     */
    static generateEncryptionKey(): string {
        const key = crypto.randomBytes(this.KEY_LENGTH);
        return key.toString("base64");
    }

    /**
     * Encrypt payment gateway credentials
     */
    static encryptCredentials(credentials: PaymentGatewayCredentials): EncryptedCredential {
        try {
            const key = this.getEncryptionKey();
            const iv = crypto.randomBytes(this.IV_LENGTH);
            
            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
            
            const credentialString = JSON.stringify(credentials);
            let encrypted = cipher.update(credentialString, "utf8", "hex");
            encrypted += cipher.final("hex");
            
            const tag = (cipher as any).getAuthTag();
            
            return {
                encrypted_data: encrypted,
                iv: iv.toString("hex"),
                tag: tag.toString("hex"),
                algorithm: this.ALGORITHM
            };
        } catch (error) {
            throw new Error(`Failed to encrypt credentials: ${error}`);
        }
    }

    /**
     * Decrypt payment gateway credentials
     */
    static decryptCredentials(encryptedCredential: EncryptedCredential): PaymentGatewayCredentials {
        try {
            const key = this.getEncryptionKey();
            const iv = Buffer.from(encryptedCredential.iv, "hex");
            const tag = Buffer.from(encryptedCredential.tag, "hex");
            
            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            (decipher as any).setAuthTag(tag);
            
            let decrypted = decipher.update(encryptedCredential.encrypted_data, "hex", "utf8");
            decrypted += decipher.final("utf8");
            
            return JSON.parse(decrypted);
        } catch (error) {
            throw new Error(`Failed to decrypt credentials: ${error}`);
        }
    }

    /**
     * Encrypt specific gateway credentials
     */
    static encryptGatewayCredentials(
        gateway: "razorpay" | "payu" | "cashfree",
        credentials: any
    ): EncryptedCredential {
        const gatewayCredentials: PaymentGatewayCredentials = {
            [gateway]: credentials
        };
        return this.encryptCredentials(gatewayCredentials);
    }

    /**
     * Decrypt specific gateway credentials
     */
    static decryptGatewayCredentials(
        gateway: "razorpay" | "payu" | "cashfree",
        encryptedCredential: EncryptedCredential
    ): any {
        const decrypted = this.decryptCredentials(encryptedCredential);
        return decrypted[gateway];
    }

    /**
     * Mask sensitive data for logging/display
     */
    static maskCredentials(credentials: PaymentGatewayCredentials): any {
        const masked = JSON.parse(JSON.stringify(credentials));
        
        for (const gateway of Object.keys(masked)) {
            const creds = masked[gateway];
            for (const key of Object.keys(creds)) {
                if ((key.includes("secret") || key.includes("key") || key.includes("salt")) && typeof creds[key] === "string" && creds[key].length > 8) {
                        creds[key] = creds[key].slice(0, 4) + "***" + creds[key].slice(Math.max(0, creds[key].length - 4));
                    }
            }
        }
        
        return masked;
    }

    /**
     * Validate encryption key strength
     */
    static validateEncryptionKey(): { valid: boolean; message: string } {
        try {
            const key = this.getEncryptionKey();
            
            if (key.length !== this.KEY_LENGTH) {
                return {
                    valid: false,
                    message: `Encryption key must be ${this.KEY_LENGTH} bytes (256 bits)`
                };
            }
            
            // Test encryption/decryption
            const testData = { test: "data" };
            const encrypted = this.encryptCredentials(testData as any);
            const decrypted = this.decryptCredentials(encrypted);
            
            if (JSON.stringify(testData) !== JSON.stringify(decrypted)) {
                return {
                    valid: false,
                    message: "Encryption key validation failed - encryption/decryption mismatch"
                };
            }
            
            return {
                valid: true,
                message: "Encryption key is valid"
            };
        } catch (error) {
            return {
                valid: false,
                message: `Encryption key validation failed: ${error}`
            };
        }
    }

    /**
     * Rotate encryption (re-encrypt with new key)
     */
    static rotateEncryption(
        oldEncryptedCredential: EncryptedCredential,
        oldKey: string
    ): EncryptedCredential {
        try {
            // Temporarily set old key
            const currentKey = process.env.PAYMENT_CREDENTIAL_ENCRYPTION_KEY;
            process.env.PAYMENT_CREDENTIAL_ENCRYPTION_KEY = oldKey;
            
            // Decrypt with old key
            const credentials = this.decryptCredentials(oldEncryptedCredential);
            
            // Restore new key
            process.env.PAYMENT_CREDENTIAL_ENCRYPTION_KEY = currentKey;
            
            // Encrypt with new key
            return this.encryptCredentials(credentials);
        } catch (error) {
            throw new Error(`Failed to rotate encryption: ${error}`);
        }
    }
}
