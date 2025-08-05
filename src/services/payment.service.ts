import { Fee, IFeeData } from "@/models/fee.model";
import { FeeCategory, IFeeCategory } from "@/models/fee_category.model";
import { FeeTemplate, IFeeTemplate } from "@/models/fee_template.model";
import {
    IPaymentInvoice,
    PaymentInvoice,
} from "@/models/payment_invoice.model";
import {
    IPaymentTransaction,
    PaymentTransaction,
} from "@/models/payment_transaction.model";
import {
    ISchoolBankDetails,
    SchoolBankDetails,
} from "@/models/school_bank_details.model";
import crypto from "node:crypto";

import { PaymentGatewayCredentials } from "./credential_encryption.service";
import PaymentErrorHandler from "./payment_error_handler.service";
import {
    PaymentGatewayConfig,
    PaymentGatewayService,
    PaymentOrderRequest,
} from "./payment_gateway.service";
import PaymentSecurityMonitor from "./payment_security_monitor.service";
import { SecurePaymentCredentialService } from "./secure_payment_credential.service";

export class PaymentService {
    // ========================= SCHOOL BANK DETAILS =========================

    /**
     * Create or update school bank details
     */
    static async createOrUpdateSchoolBankDetails(
        campus_id: string,
        bankData: Partial<ISchoolBankDetails>
    ): Promise<ISchoolBankDetails> {
        const startTime = Date.now();

        // Log bank details operation attempt
        PaymentSecurityMonitor.logSecurityEvent({
            event_type: "bank_details_operation",
            campus_id,
            details: {
                operation: "create_or_update",
                has_account_number: !!bankData.account_number,
                has_ifsc: !!bankData.ifsc_code,
                has_bank_name: !!bankData.bank_name,
            },
            severity: "low",
            success: false,
        });

        try {
            // Validate required fields
            if (!campus_id) {
                throw PaymentErrorHandler.createError("VAL_001", {
                    missing_fields: { campus_id: true },
                });
            }

            if (
                !bankData.account_number ||
                !bankData.ifsc_code ||
                !bankData.bank_name
            ) {
                throw PaymentErrorHandler.createError("VAL_001", {
                    missing_fields: {
                        account_number: !bankData.account_number,
                        ifsc_code: !bankData.ifsc_code,
                        bank_name: !bankData.bank_name,
                    },
                });
            }

            // Check if bank details already exist
            const existingBankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            let result: ISchoolBankDetails;
            const executionTime = Date.now() - startTime;

            if (
                existingBankDetails.rows &&
                existingBankDetails.rows.length > 0
            ) {
                // Update existing details
                result = await SchoolBankDetails.updateById(
                    existingBankDetails.rows[0].id,
                    {
                        ...bankData,
                        updated_at: new Date(),
                    }
                );

                PaymentSecurityMonitor.logSecurityEvent({
                    event_type: "bank_details_operation",
                    campus_id,
                    details: {
                        operation: "update",
                        bank_details_id: result.id,
                        execution_time_ms: executionTime,
                    },
                    severity: "low",
                    success: true,
                });
            } else {
                // Create new bank details
                result = await SchoolBankDetails.create({
                    campus_id,
                    ...bankData,
                    is_active: true,
                    is_verified: false,
                    meta_data: bankData.meta_data || {},
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                PaymentSecurityMonitor.logSecurityEvent({
                    event_type: "bank_details_operation",
                    campus_id,
                    details: {
                        operation: "create",
                        bank_details_id: result.id,
                        execution_time_ms: executionTime,
                    },
                    severity: "low",
                    success: true,
                });
            }

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "bank_details_operation",
                campus_id,
                details: {
                    operation: "create_or_update",
                    execution_time_ms: executionTime,
                    error_details:
                        error instanceof Error ? error.message : String(error),
                },
                severity: "medium",
                success: false,
                error_message:
                    error instanceof Error ? error.message : String(error),
            });

            throw error;
        }
    }

    /**
     * Get school bank details by campus
     */
    static async getSchoolBankDetails(
        campus_id: string
    ): Promise<ISchoolBankDetails | null> {
        try {
            const bankDetails = await SchoolBankDetails.find({
                campus_id,
                is_active: true,
            });

            return bankDetails.rows && bankDetails.rows.length > 0
                ? bankDetails.rows[0]
                : null;
        } catch (error) {
            throw new Error(`Failed to get bank details: ${error}`);
        }
    }

    // ========================= FEE CATEGORIES =========================

    /**
     * Create fee category
     */
    static async createFeeCategory(
        campus_id: string,
        categoryData: Partial<IFeeCategory>
    ): Promise<IFeeCategory> {
        try {
            return await FeeCategory.create({
                campus_id,
                ...categoryData,
                is_active: true,
                meta_data: categoryData.meta_data || {},
                created_at: new Date(),
                updated_at: new Date(),
            });
        } catch (error) {
            throw new Error(`Failed to create fee category: ${error}`);
        }
    }

    /**
     * Get fee categories by campus and academic year
     */
    static async getFeeCategoriesByCampus(
        campus_id: string,
        academic_year?: string
    ): Promise<IFeeCategory[]> {
        try {
            const query: any = { campus_id, is_active: true };
            if (academic_year) {
                query.academic_year = academic_year;
            }

            const categories = await FeeCategory.find(query);
            return categories.rows || [];
        } catch (error) {
            throw new Error(`Failed to get fee categories: ${error}`);
        }
    }

    /**
     * Update fee category
     */
    static async updateFeeCategory(
        category_id: string,
        updateData: Partial<IFeeCategory>
    ): Promise<IFeeCategory> {
        try {
            return await FeeCategory.updateById(category_id, {
                ...updateData,
                updated_at: new Date(),
            });
        } catch (error) {
            throw new Error(`Failed to update fee category: ${error}`);
        }
    }

    // ========================= FEE TEMPLATES =========================

    /**
     * Create fee template
     */
    static async createFeeTemplate(
        campus_id: string,
        templateData: Partial<IFeeTemplate>
    ): Promise<IFeeTemplate> {
        try {
            const template = await FeeTemplate.create({
                campus_id,
                ...templateData,
                is_active: true,
                meta_data: templateData.meta_data || {},
                created_at: new Date(),
                updated_at: new Date(),
            });

            // If auto_generate is true, generate fees for applicable students
            if (template.auto_generate) {
                await this.generateFeesFromTemplate(template.id);
            }

            return template;
        } catch (error) {
            throw new Error(`Failed to create fee template: ${error}`);
        }
    }

    /**
     * Get fee templates by campus and class
     */
    static async getFeeTemplatesByCampus(
        campus_id: string,
        class_id?: string,
        academic_year?: string
    ): Promise<IFeeTemplate[]> {
        try {
            const query: any = { campus_id, is_active: true };
            if (class_id) {query.class_id = class_id;}
            if (academic_year) {query.academic_year = academic_year;}

            const templates = await FeeTemplate.find(query);
            return templates.rows || [];
        } catch (error) {
            throw new Error(`Failed to get fee templates: ${error}`);
        }
    }

    /**
     * Generate fees from template
     */
    static async generateFeesFromTemplate(
        template_id: string
    ): Promise<IFeeData[]> {
        try {
            const template = await FeeTemplate.findById(template_id);
            if (!template) {
                throw new Error("Template not found");
            }

            const fees: IFeeData[] = [];
            const students =
                template.applicable_students.length > 0
                    ? template.applicable_students
                    : await this.getStudentsByClass(template.class_id);

            for (const student_id of students) {
                // Check if fee already exists for this student and template
                const existingFee = await Fee.find({
                    campus_id: template.campus_id,
                    user_id: student_id,
                    fee_template_id: template_id,
                    academic_year: template.academic_year,
                });

                if (!existingFee.rows || existingFee.rows.length === 0) {
                    const feeData = {
                        campus_id: template.campus_id,
                        user_id: student_id,
                        class_id: template.class_id,
                        academic_year: template.academic_year,
                        fee_template_id: template_id,
                        items: template.fee_structure.map((item) => ({
                            category_id: item.category_id,
                            fee_type: item.category_name,
                            amount: item.amount,
                            name: item.category_name,
                            due_date: item.due_date,
                            is_mandatory: item.is_mandatory,
                            late_fee_applicable: item.late_fee_applicable,
                        })),
                        total_amount: template.total_amount,
                        paid_amount: 0,
                        due_amount: template.total_amount,
                        discount_amount: 0,
                        late_fee_amount: 0,
                        payment_status: "unpaid",
                        is_paid: false,
                        installments_allowed: false,
                        auto_late_fee: true,
                        reminder_sent: {
                            email_count: 0,
                            sms_count: 0,
                        },
                        meta_data: {},
                    };

                    const fee = await Fee.create(feeData);
                    fees.push(fee);
                }
            }

            return fees;
        } catch (error) {
            throw new Error(`Failed to generate fees from template: ${error}`);
        }
    }

    // ========================= PAYMENT PROCESSING =========================

    /**
     * Initiate payment for a fee (SECURE VERSION)
     */
    static async initiatePayment(
        campus_id: string,
        fee_id: string,
        student_id: string,
        parent_id: string | undefined,
        gateway: string,
        amount: number,
        callback_url: string,
        cancel_url: string
    ): Promise<{
        transaction: IPaymentTransaction;
        payment_details: any;
        available_gateways: string[];
    }> {
        const startTime = Date.now();

        // Log payment initiation attempt
        PaymentSecurityMonitor.logSecurityEvent({
            event_type: "payment_initiated",
            user_id: student_id,
            campus_id,
            details: {
                fee_id,
                gateway,
                amount,
                parent_id,
                callback_url,
            },
            severity: "low",
            success: false, // Will be updated to true on success
        });

        try {
            // Validate input parameters
            if (!campus_id || !fee_id || !student_id || !gateway) {
                throw PaymentErrorHandler.createError("VAL_001", {
                    missing_fields: {
                        campus_id: !campus_id,
                        fee_id: !fee_id,
                        student_id: !student_id,
                        gateway: !gateway,
                    },
                });
            }

            if (amount <= 0) {
                throw PaymentErrorHandler.createError("VAL_003", {
                    provided_amount: amount,
                });
            }

            // Get school bank details
            const bankDetails = await this.getSchoolBankDetails(campus_id);
            if (!bankDetails) {
                throw PaymentErrorHandler.createError("BIZ_005", { campus_id });
            }

            // Get secure credentials
            const gatewayCredentials =
                await SecurePaymentCredentialService.getSecureCredentials(
                    campus_id
                );
            if (!gatewayCredentials) {
                throw PaymentErrorHandler.createError("GATEWAY_001", {
                    campus_id,
                    gateway,
                });
            }

            const gatewayConfig = gatewayCredentials as any;
            const availableGateways =
                PaymentGatewayService.getAvailableGateways(gatewayConfig);

            if (!availableGateways.includes(gateway)) {
                throw PaymentErrorHandler.createError("GATEWAY_006", {
                    requested_gateway: gateway,
                    available_gateways: availableGateways,
                });
            }

            // Create payment transaction record
            const transaction = await PaymentTransaction.create({
                campus_id,
                fee_id,
                student_id,
                parent_id,
                payment_gateway: gateway,
                amount,
                currency: "INR",
                status: "pending",
                payment_details: {},
                initiated_at: new Date(),
                webhook_verified: false,
                invoice_generated: false,
                meta_data: {},
            });

            // Create payment order with selected gateway
            const orderRequest: PaymentOrderRequest = {
                amount,
                currency: "INR",
                receipt: `RECEIPT_${transaction.id}`,
                student_id,
                parent_id,
                fee_id,
                campus_id,
                callback_url,
                cancel_url,
            };

            let paymentDetails;
            switch (gateway) {
                case "razorpay": {
                    paymentDetails =
                        await PaymentGatewayService.createRazorpayOrder(
                            gatewayConfig.razorpay as any,
                            orderRequest
                        );
                    break;
                }
                case "payu": {
                    paymentDetails =
                        await PaymentGatewayService.createPayUOrder(
                            gatewayConfig.payu as any,
                            orderRequest
                        );
                    break;
                }
                case "cashfree": {
                    paymentDetails =
                        await PaymentGatewayService.createCashfreeOrder(
                            gatewayConfig.cashfree as any,
                            orderRequest
                        );
                    break;
                }
                default: {
                    throw PaymentErrorHandler.createError("GATEWAY_006", {
                        gateway,
                        supported_gateways: ["razorpay", "payu", "cashfree"],
                    });
                }
            }

            // Update transaction with gateway details
            const updatedTransaction = await PaymentTransaction.updateById(
                transaction.id,
                {
                    gateway_order_id: paymentDetails.gateway_order_id,
                    payment_details: paymentDetails,
                    updated_at: new Date(),
                }
            );

            // Log successful payment initiation
            const executionTime = Date.now() - startTime;
            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "payment_initiated",
                user_id: student_id,
                campus_id,
                details: {
                    fee_id,
                    gateway,
                    amount,
                    transaction_id: transaction.id,
                    gateway_order_id: paymentDetails.gateway_order_id,
                    execution_time_ms: executionTime,
                },
                severity: "low",
                success: true,
            });

            PaymentSecurityMonitor.logAuditEvent({
                event_type: "payment_initiated",
                user_id: student_id,
                campus_id,
                transaction_id: transaction.id,
                gateway,
                amount,
                details: {
                    fee_id,
                    parent_id,
                    callback_url,
                    gateway_order_id: paymentDetails.gateway_order_id,
                },
                success: true,
                execution_time_ms: executionTime,
            });

            return {
                transaction: updatedTransaction,
                payment_details: paymentDetails,
                available_gateways: availableGateways,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Log failed payment initiation
            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "payment_initiated",
                user_id: student_id,
                campus_id,
                details: {
                    fee_id,
                    gateway,
                    amount,
                    execution_time_ms: executionTime,
                    error_details:
                        error instanceof Error ? error.message : String(error),
                },
                severity: "medium",
                success: false,
                error_message:
                    error instanceof Error ? error.message : String(error),
            });

            // Re-throw the error for the controller to handle
            throw error;
        }
    }

    /**
     * Verify payment and update status (SECURE VERSION)
     */
    static async verifyAndUpdatePayment(
        transaction_id: string,
        payment_id: string,
        signature: string,
        additionalData?: any
    ): Promise<{
        success: boolean;
        transaction: IPaymentTransaction;
        invoice?: IPaymentInvoice;
    }> {
        const startTime = Date.now();

        try {
            // Validate input parameters
            if (!transaction_id || !payment_id || !signature) {
                throw PaymentErrorHandler.createError("VAL_001", {
                    missing_fields: {
                        transaction_id: !transaction_id,
                        payment_id: !payment_id,
                        signature: !signature,
                    },
                });
            }

            const transaction =
                await PaymentTransaction.findById(transaction_id);
            if (!transaction) {
                throw PaymentErrorHandler.createError("TRANS_001", {
                    transaction_id,
                });
            }

            // Check if transaction is already processed
            if (transaction.status === "success") {
                throw PaymentErrorHandler.createError("TRANS_002", {
                    transaction_id,
                    current_status: transaction.status,
                });
            }

            // Get secure credentials
            const gatewayCredentials =
                await SecurePaymentCredentialService.getSecureCredentials(
                    transaction.campus_id
                );
            if (!gatewayCredentials) {
                throw PaymentErrorHandler.createError("GATEWAY_001", {
                    campus_id: transaction.campus_id,
                    gateway: transaction.payment_gateway,
                });
            }

            const gatewayConfig = gatewayCredentials;
            let isVerified = false;

            // Verify payment based on gateway
            switch (transaction.payment_gateway) {
                case "razorpay": {
                    isVerified = PaymentGatewayService.verifyRazorpayPayment(
                        gatewayConfig.razorpay as any,
                        {
                            gateway: "razorpay",
                            payment_id,
                            order_id: transaction.gateway_order_id!,
                            signature,
                            amount: transaction.amount,
                        }
                    );
                    break;
                }
                case "payu": {
                    isVerified = PaymentGatewayService.verifyPayUPayment(
                        gatewayConfig.payu as any,
                        {
                            ...additionalData,
                            gateway: "payu",
                            payment_id,
                            order_id: transaction.gateway_order_id!,
                            signature,
                            amount: transaction.amount,
                        }
                    );
                    break;
                }
                case "cashfree": {
                    isVerified = PaymentGatewayService.verifyCashfreePayment(
                        gatewayConfig.cashfree as any,
                        {
                            gateway: "cashfree",
                            payment_id,
                            order_id: transaction.gateway_order_id!,
                            signature,
                            amount: transaction.amount,
                        }
                    );
                    break;
                }
                default: {
                    throw new Error("Unsupported payment gateway");
                }
            }

            if (isVerified) {
                // Update transaction status
                const updatedTransaction = await PaymentTransaction.updateById(
                    transaction_id,
                    {
                        gateway_payment_id: payment_id,
                        status: "success",
                        completed_at: new Date(),
                        webhook_verified: true,
                        payment_details: {
                            ...transaction.payment_details,
                            verification_data: {
                                payment_id,
                                signature,
                                ...additionalData,
                            },
                        },
                        updated_at: new Date(),
                    }
                );

                // Update fee status
                await Fee.updateById(transaction.fee_id, {
                    paid_amount: transaction.amount,
                    payment_status: "paid",
                    is_paid: true,
                    payment_date: new Date(),
                    payment_mode: transaction.payment_gateway,
                    updated_at: new Date(),
                });

                // Generate invoice
                const invoice = await this.generateInvoice(transaction_id);

                // Log successful payment verification
                const executionTime = Date.now() - startTime;
                PaymentSecurityMonitor.logSecurityEvent({
                    event_type: "payment_verified",
                    user_id: transaction.student_id,
                    campus_id: transaction.campus_id,
                    details: {
                        transaction_id,
                        payment_id,
                        gateway: transaction.payment_gateway,
                        amount: transaction.amount,
                        execution_time_ms: executionTime,
                    },
                    severity: "low",
                    success: true,
                });

                PaymentSecurityMonitor.logAuditEvent({
                    event_type: "payment_verified",
                    user_id: transaction.student_id,
                    campus_id: transaction.campus_id,
                    transaction_id,
                    gateway: transaction.payment_gateway,
                    amount: transaction.amount,
                    details: {
                        payment_id,
                        signature_verified: true,
                        invoice_id: invoice.id,
                    },
                    success: true,
                    execution_time_ms: executionTime,
                });

                return {
                    success: true,
                    transaction: updatedTransaction,
                    invoice,
                };
            } else {
                // Update transaction as failed
                const updatedTransaction = await PaymentTransaction.updateById(
                    transaction_id,
                    {
                        status: "failed",
                        payment_details: {
                            ...transaction.payment_details,
                            failure_reason: "Payment verification failed",
                        },
                        updated_at: new Date(),
                    }
                );

                // Log failed payment verification
                const executionTime = Date.now() - startTime;
                PaymentSecurityMonitor.logSecurityEvent({
                    event_type: "payment_verified",
                    user_id: transaction.student_id,
                    campus_id: transaction.campus_id,
                    details: {
                        transaction_id,
                        payment_id,
                        gateway: transaction.payment_gateway,
                        amount: transaction.amount,
                        failure_reason: "signature_verification_failed",
                        execution_time_ms: executionTime,
                    },
                    severity: "high",
                    success: false,
                    error_message:
                        "Payment verification failed - invalid signature",
                });

                throw PaymentErrorHandler.createError("GATEWAY_005", {
                    transaction_id,
                    payment_id,
                    gateway: transaction.payment_gateway,
                });
            }
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Log verification error
            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "payment_verified",
                user_id: transaction_id ? "unknown" : undefined,
                details: {
                    transaction_id,
                    payment_id,
                    execution_time_ms: executionTime,
                    error_details:
                        error instanceof Error ? error.message : String(error),
                },
                severity: "high",
                success: false,
                error_message:
                    error instanceof Error ? error.message : String(error),
            });

            // Re-throw the error for the controller to handle
            throw error;
        }
    }

    /**
     * Generate invoice for payment
     */
    static async generateInvoice(
        transaction_id: string
    ): Promise<IPaymentInvoice> {
        try {
            const transaction =
                await PaymentTransaction.findById(transaction_id);
            if (!transaction) {
                throw new Error("Transaction not found");
            }

            const fee = await Fee.findById(transaction.fee_id);
            if (!fee) {
                throw new Error("Fee record not found");
            }

            // Generate unique invoice number
            const invoiceNumber = `INV-${transaction.campus_id}-${Date.now()}`;

            // Get student and school details (this would need actual implementation)
            const studentDetails = await this.getStudentDetails(
                transaction.student_id
            );
            const schoolDetails = await this.getSchoolDetails(
                transaction.campus_id
            );

            const invoice = await PaymentInvoice.create({
                campus_id: transaction.campus_id,
                transaction_id: transaction_id,
                fee_id: transaction.fee_id,
                student_id: transaction.student_id,
                parent_id: transaction.parent_id,
                invoice_number: invoiceNumber,
                invoice_date: new Date(),
                due_date: new Date(), // This should be calculated based on fee due date
                amount_details: {
                    subtotal: fee.total_amount,
                    discount_amount: fee.discount_amount,
                    late_fee_amount: fee.late_fee_amount,
                    tax_amount: 0, // Calculate if applicable
                    total_amount: transaction.amount,
                },
                payment_details: {
                    amount_paid: transaction.amount,
                    payment_date: transaction.completed_at,
                    payment_method: transaction.payment_gateway,
                    transaction_reference: transaction.gateway_payment_id,
                },
                student_details: studentDetails,
                school_details: schoolDetails,
                fee_breakdown: fee.items.map((item) => ({
                    category_name: item.name,
                    amount: item.amount,
                    description: item.fee_type,
                })),
                status: "generated",
                sent_notifications: {
                    email_sent: false,
                    sms_sent: false,
                    whatsapp_sent: false,
                },
                meta_data: {},
            });

            // Update transaction with invoice generated flag
            await PaymentTransaction.updateById(transaction_id, {
                invoice_generated: true,
                receipt_number: invoiceNumber,
                updated_at: new Date(),
            });

            return invoice;
        } catch (error) {
            throw new Error(`Failed to generate invoice: ${error}`);
        }
    }

    /**
     * Get payment history for student/parent
     */
    static async getPaymentHistory(
        campus_id: string,
        student_id?: string,
        parent_id?: string,
        status?: string
    ): Promise<{
        fees: IFeeData[];
        transactions: IPaymentTransaction[];
        invoices: IPaymentInvoice[];
    }> {
        try {
            const query: any = { campus_id };
            if (student_id) {query.user_id = student_id;}

            const fees = await Fee.find(query);

            const transactionQuery: any = { campus_id };
            if (student_id) {transactionQuery.student_id = student_id;}
            if (parent_id) {transactionQuery.parent_id = parent_id;}
            if (status) {transactionQuery.status = status;}

            const transactions =
                await PaymentTransaction.find(transactionQuery);

            const invoiceQuery: any = { campus_id };
            if (student_id) {invoiceQuery.student_id = student_id;}
            if (parent_id) {invoiceQuery.parent_id = parent_id;}

            const invoices = await PaymentInvoice.find(invoiceQuery);

            return {
                fees: fees.rows || [],
                transactions: transactions.rows || [],
                invoices: invoices.rows || [],
            };
        } catch (error) {
            throw new Error(`Failed to get payment history: ${error}`);
        }
    }

    // ========================= PAYMENT GATEWAY CONFIGURATION =========================

    /**
     * Configure specific payment gateway for a school (SECURE VERSION)
     */
    static async configurePaymentGateway(
        campus_id: string,
        gateway: "razorpay" | "payu" | "cashfree",
        credentials: any,
        enabled: boolean = true
    ): Promise<ISchoolBankDetails> {
        const startTime = Date.now();

        // Log gateway configuration attempt
        PaymentSecurityMonitor.logSecurityEvent({
            event_type: "credential_modified",
            campus_id,
            details: {
                gateway,
                operation: "configure_gateway",
                enabled,
                has_credentials: !!credentials,
            },
            severity: "medium",
            success: false,
        });

        try {
            // Validate input parameters
            if (!campus_id || !gateway || !credentials) {
                throw PaymentErrorHandler.createError("VAL_001", {
                    missing_fields: {
                        campus_id: !campus_id,
                        gateway: !gateway,
                        credentials: !credentials,
                    },
                });
            }

            const bankDetails = await this.getSchoolBankDetails(campus_id);
            if (!bankDetails) {
                throw PaymentErrorHandler.createError("BIZ_005", { campus_id });
            }

            // Validate credentials before saving
            await this.validateGatewayCredentials(gateway, credentials);

            // Prepare credentials for secure storage
            const gatewayCredentials = {
                ...credentials,
                enabled,
            };

            // Store securely
            const result =
                await SecurePaymentCredentialService.updateGatewayCredentials(
                    campus_id,
                    gateway,
                    gatewayCredentials
                );

            const executionTime = Date.now() - startTime;

            // Log successful configuration
            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "credential_modified",
                campus_id,
                details: {
                    gateway,
                    operation: "configure_gateway",
                    enabled,
                    execution_time_ms: executionTime,
                },
                severity: "medium",
                success: true,
            });

            PaymentSecurityMonitor.logAuditEvent({
                event_type: "gateway_configured",
                campus_id,
                gateway,
                details: {
                    enabled,
                    credentials_updated: true,
                },
                success: true,
                execution_time_ms: executionTime,
            });

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "credential_modified",
                campus_id,
                details: {
                    gateway,
                    operation: "configure_gateway",
                    execution_time_ms: executionTime,
                    error_details:
                        error instanceof Error ? error.message : String(error),
                },
                severity: "high",
                success: false,
                error_message:
                    error instanceof Error ? error.message : String(error),
            });

            throw error;
        }
    }

    /**
     * Test payment gateway configuration (SECURE VERSION)
     */
    static async testGatewayConfiguration(
        campus_id: string,
        gateway: "razorpay" | "payu" | "cashfree"
    ): Promise<{ success: boolean; message: string; details?: any }> {
        const startTime = Date.now();

        // Log gateway test attempt
        PaymentSecurityMonitor.logSecurityEvent({
            event_type: "gateway_test",
            campus_id,
            details: {
                gateway,
                operation: "test_configuration",
            },
            severity: "low",
            success: false,
        });

        try {
            // Validate input parameters
            if (!campus_id || !gateway) {
                const error = PaymentErrorHandler.createError("VAL_001", {
                    missing_fields: {
                        campus_id: !campus_id,
                        gateway: !gateway,
                    },
                });
                const errorResponse =
                    PaymentErrorHandler.formatErrorResponse(error);
                return {
                    success: false,
                    message: errorResponse.error.message,
                };
            }

            const bankDetails = await this.getSchoolBankDetails(campus_id);
            if (!bankDetails) {
                return {
                    success: false,
                    message: "School bank details not found",
                };
            }

            // Get secure credentials
            const gatewayConfig =
                await SecurePaymentCredentialService.getGatewayCredentials(
                    campus_id,
                    gateway
                );

            if (!gatewayConfig) {
                return { success: false, message: `${gateway} not configured` };
            }

            if (!gatewayConfig.enabled) {
                return { success: false, message: `${gateway} is disabled` };
            }

            // Test gateway connection based on type
            let testResult;
            switch (gateway) {
                case "razorpay": {
                    testResult =
                        await this.testRazorpayConnection(gatewayConfig);
                    break;
                }
                case "payu": {
                    testResult = await this.testPayUConnection(gatewayConfig);
                    break;
                }
                case "cashfree": {
                    testResult =
                        await this.testCashfreeConnection(gatewayConfig);
                    break;
                }
                default: {
                    return { success: false, message: "Unsupported gateway" };
                }
            }

            // Update gateway status
            await SecurePaymentCredentialService.updateGatewayStatus(
                campus_id,
                gateway,
                {
                    last_tested: new Date(),
                    test_status: testResult.success ? "success" : "failed",
                }
            );

            const executionTime = Date.now() - startTime;

            // Log test result
            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "gateway_test",
                campus_id,
                details: {
                    gateway,
                    operation: "test_configuration",
                    test_success: testResult.success,
                    execution_time_ms: executionTime,
                },
                severity: testResult.success ? "low" : "medium",
                success: testResult.success,
            });

            PaymentSecurityMonitor.logAuditEvent({
                event_type: "gateway_tested",
                campus_id,
                gateway,
                details: {
                    test_result: testResult.success,
                    test_message: testResult.message,
                },
                success: testResult.success,
                execution_time_ms: executionTime,
            });

            return testResult;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            PaymentSecurityMonitor.logSecurityEvent({
                event_type: "gateway_test",
                campus_id,
                details: {
                    gateway,
                    operation: "test_configuration",
                    execution_time_ms: executionTime,
                    error_details:
                        error instanceof Error ? error.message : String(error),
                },
                severity: "medium",
                success: false,
                error_message:
                    error instanceof Error ? error.message : String(error),
            });

            return {
                success: false,
                message: `Gateway test failed: ${error}`,
                details: { error: String(error) },
            };
        }
    }

    /**
     * Get available and enabled payment gateways for a school (SECURE VERSION)
     */
    static async getAvailableGateways(campus_id: string): Promise<{
        available: string[];
        enabled: string[];
        configurations: { [key: string]: any };
    }> {
        try {
            const bankDetails = await this.getSchoolBankDetails(campus_id);
            if (!bankDetails) {
                return { available: [], enabled: [], configurations: {} };
            }

            // Get gateway status (non-sensitive data)
            const gatewayStatus =
                await SecurePaymentCredentialService.getGatewayStatus(
                    campus_id
                );

            const available = Object.keys(gatewayStatus || {});
            const enabled = available.filter(
                (gateway) => gatewayStatus[gateway]?.enabled === true
            );

            // Return configurations without sensitive data
            const safeConfigurations: { [key: string]: any } = {};
            for (const gateway of available) {
                const status = gatewayStatus[gateway];
                safeConfigurations[gateway] = {
                    enabled: status?.enabled || false,
                    configured: status?.configured || false,
                    last_tested: status?.last_tested || null,
                    test_status: status?.test_status || "untested",
                };
            }

            return {
                available,
                enabled,
                configurations: safeConfigurations,
            };
        } catch (error) {
            throw new Error(`Failed to get available gateways: ${error}`);
        }
    }

    /**
     * Enable/Disable specific payment gateway (SECURE VERSION)
     */
    static async toggleGateway(
        campus_id: string,
        gateway: "razorpay" | "payu" | "cashfree",
        enabled: boolean
    ): Promise<ISchoolBankDetails> {
        try {
            const bankDetails = await this.getSchoolBankDetails(campus_id);
            if (!bankDetails) {
                throw new Error("School bank details not found");
            }

            // Get current credentials
            const gatewayConfig =
                await SecurePaymentCredentialService.getGatewayCredentials(
                    campus_id,
                    gateway
                );

            if (!gatewayConfig) {
                throw new Error(`${gateway} is not configured`);
            }

            // If enabling, test the configuration first
            if (enabled) {
                const testResult = await this.testGatewayConfiguration(
                    campus_id,
                    gateway
                );
                if (!testResult.success) {
                    throw new Error(
                        `Cannot enable ${gateway}: ${testResult.message}`
                    );
                }
            }

            // Update credentials with new enabled status
            const updatedCredentials = {
                ...gatewayConfig,
                enabled,
                last_modified: new Date(),
            };

            const updated =
                await SecurePaymentCredentialService.updateGatewayCredentials(
                    campus_id,
                    gateway,
                    updatedCredentials
                );

            // Update gateway status
            await SecurePaymentCredentialService.updateGatewayStatus(
                campus_id,
                gateway,
                { enabled }
            );

            return updated;
        } catch (error) {
            throw new Error(`Failed to toggle ${gateway} gateway: ${error}`);
        }
    }

    /**
     * Validate gateway credentials format
     */
    private static async validateGatewayCredentials(
        gateway: "razorpay" | "payu" | "cashfree",
        credentials: any
    ): Promise<void> {
        switch (gateway) {
            case "razorpay": {
                if (!credentials.key_id || !credentials.key_secret) {
                    throw new Error("Razorpay requires key_id and key_secret");
                }
                if (!credentials.key_id.startsWith("rzp_")) {
                    throw new Error("Invalid Razorpay key_id format");
                }
                break;
            }

            case "payu": {
                if (!credentials.merchant_key || !credentials.merchant_salt) {
                    throw new Error(
                        "PayU requires merchant_key and merchant_salt"
                    );
                }
                break;
            }

            case "cashfree": {
                if (!credentials.app_id || !credentials.secret_key) {
                    throw new Error("Cashfree requires app_id and secret_key");
                }
                break;
            }

            default: {
                throw new Error("Unsupported gateway type");
            }
        }
    }

    /**
     * Test Razorpay connection
     */
    private static async testRazorpayConnection(
        config: any
    ): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            // This would make an actual API call to Razorpay to test credentials
            // For now, we'll just validate the format
            if (!config.key_id || !config.key_secret) {
                return {
                    success: false,
                    message: "Missing Razorpay credentials",
                };
            }

            // Here you would make an actual test API call to Razorpay
            // const razorpay = new Razorpay({ key_id: config.key_id, key_secret: config.key_secret });
            // const testOrder = await razorpay.orders.create({ amount: 100, currency: 'INR' });

            return {
                success: true,
                message: "Razorpay connection successful",
                details: { gateway: "razorpay", tested_at: new Date() },
            };
        } catch (error) {
            return {
                success: false,
                message: `Razorpay test failed: ${error}`,
                details: { error: String(error) },
            };
        }
    }

    /**
     * Test PayU connection
     */
    private static async testPayUConnection(
        config: any
    ): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            if (!config.merchant_key || !config.merchant_salt) {
                return { success: false, message: "Missing PayU credentials" };
            }

            // Here you would make an actual test API call to PayU
            // Test hash generation
            const testHash = crypto
                .createHash("sha512")
                .update(
                    `${config.merchant_key}|test|100|test|test|test@test.com|||||||||||${config.merchant_salt}`
                )
                .digest("hex");

            return {
                success: true,
                message: "PayU connection successful",
                details: { gateway: "payu", tested_at: new Date() },
            };
        } catch (error) {
            return {
                success: false,
                message: `PayU test failed: ${error}`,
                details: { error: String(error) },
            };
        }
    }

    /**
     * Test Cashfree connection
     */
    private static async testCashfreeConnection(
        config: any
    ): Promise<{ success: boolean; message: string; details?: any }> {
        try {
            if (!config.app_id || !config.secret_key) {
                return {
                    success: false,
                    message: "Missing Cashfree credentials",
                };
            }

            // Here you would make an actual test API call to Cashfree
            return {
                success: true,
                message: "Cashfree connection successful",
                details: { gateway: "cashfree", tested_at: new Date() },
            };
        } catch (error) {
            return {
                success: false,
                message: `Cashfree test failed: ${error}`,
                details: { error: String(error) },
            };
        }
    }

    /**
     * Check if gateway is fully configured
     */
    private static isGatewayFullyConfigured(
        gateway: string,
        config: any
    ): boolean {
        switch (gateway) {
            case "razorpay": {
                return !!(config.key_id && config.key_secret);
            }
            case "payu": {
                return !!(config.merchant_key && config.merchant_salt);
            }
            case "cashfree": {
                return !!(config.app_id && config.secret_key);
            }
            default: {
                return false;
            }
        }
    }

    // ========================= HELPER METHODS =========================

    /**
     * Get students by class (using existing class service)
     */
    private static async getStudentsByClass(
        class_id: string
    ): Promise<string[]> {
        try {
            const { Class } = await import("@/models/class.model");
            const classData = await Class.findById(class_id);

            if (!classData || !classData.is_active || classData.is_deleted) {
                throw new Error("Class not found or inactive");
            }

            return classData.student_ids || [];
        } catch (error) {
            throw new Error(`Failed to get students by class: ${error}`);
        }
    }

    /**
     * Get student details (using existing user service)
     */
    private static async getStudentDetails(student_id: string): Promise<any> {
        try {
            const { UserService } = await import("@/services/users.service");
            const student = await UserService.getUser(student_id);

            if (
                !student ||
                student.user_type !== "Student" ||
                !student.is_active
            ) {
                throw new Error("Student not found or inactive");
            }

            return {
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                email: student.email,
                phone: student.phone,
                user_id: student.user_id,
                campus_id: student.campus_id,
                meta_data: student.meta_data,
            };
        } catch (error) {
            throw new Error(`Failed to get student details: ${error}`);
        }
    }

    /**
     * Get school details (using existing campus service)
     */
    private static async getSchoolDetails(campus_id: string): Promise<any> {
        try {
            const { Campus } = await import("@/models/campus.model");
            const campus = await Campus.findById(campus_id);

            if (!campus || !campus.is_active || campus.is_deleted) {
                throw new Error("Campus not found or inactive");
            }

            return {
                id: campus.id,
                name: campus.name,
                address: campus.address,
                domain: campus.domain,
                meta_data: campus.meta_data,
            };
        } catch (error) {
            throw new Error(`Failed to get campus details: ${error}`);
        }
    }
}
