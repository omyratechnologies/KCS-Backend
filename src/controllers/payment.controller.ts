import { Context } from "hono";
import { nanoid } from "napi-nanoid";

import { PaymentTemplate } from "@/models/payment_template.model";
import { PaymentTransaction } from "@/models/payment_transaction.model";
import { PaymentInvoice } from "@/models/payment_invoice.model";
import { SchoolBankDetails } from "@/models/school_bank_details.model";
import { User } from "@/models/user.model";
import { Campus } from "@/models/campus.model";
import { Class } from "@/models/class.model";
import { razorpayService } from "@/services/razorpay.service";
import { CredentialEncryptionService } from "@/services/credential_encryption.service";

// Type guards for Razorpay responses
function isRazorpayOrder(obj: unknown): obj is { id: string; [key: string]: unknown } {
    return typeof obj === 'object' && obj !== null && 'id' in obj;
}

function isRazorpayPayment(obj: unknown): obj is { method: string; [key: string]: unknown } {
    return typeof obj === 'object' && obj !== null && 'method' in obj;
}

function isRazorpayTransfer(obj: unknown): obj is { id: string; [key: string]: unknown } {
    return typeof obj === 'object' && obj !== null && 'id' in obj;
}

function isRazorpayRefund(obj: unknown): obj is { id: string; [key: string]: unknown } {
    return typeof obj === 'object' && obj !== null && 'id' in obj;
}

export class PaymentController {
    /**
     * Create a new payment template (Admin only)
     */
    public static readonly createPaymentTemplate = async (ctx: Context) => {
        try {
            const data = await ctx.req.json();
            const user = ctx.get("user");

            // Verify admin access
            if (user.user_type !== "admin") {
                return ctx.json({ error: "Unauthorized access" }, 403);
            }

            // Validate installments if enabled
            if (data.is_installment_enabled && (!data.installments || data.installments.length === 0)) {
                return ctx.json({ error: "Installments are required when installment is enabled" }, 400);
            }

            // Calculate total from installments if enabled
            if (data.is_installment_enabled) {
                const installmentTotal = data.installments.reduce(
                    (sum: number, inst: { amount: number }) => sum + inst.amount, 
                    0
                );
                if (Math.abs(installmentTotal - data.total_amount) > 0.01) {
                    return ctx.json({ 
                        error: "Total installment amount must equal total amount" 
                    }, 400);
                }
            }

            const templateData = {
                ...data,
                created_by: user.id,
                is_active: true,
                is_deleted: false,
            };

            const template = await PaymentTemplate.create(templateData);

            return ctx.json({
                success: true,
                data: template,
                message: "Payment template created successfully",
            }, 201);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Get all payment templates
     */
    public static readonly getPaymentTemplates = async (ctx: Context) => {
        try {
            const query = ctx.req.query();
            const user = ctx.get("user");

            const filter: Record<string, unknown> = { is_deleted: false };

            // Filter by campus if provided
            if (query.campus_id) {
                filter.campus_id = query.campus_id;
            } else if (user.campus_id && user.user_type !== "super_admin") {
                filter.campus_id = user.campus_id;
            }

            if (query.class_id) {
                filter.class_id = query.class_id;
            }
            if (query.academic_year) {
                filter.academic_year = query.academic_year;
            }
            if (query.payment_category) {
                filter.payment_category = query.payment_category;
            }
            if (query.is_active !== undefined) {
                filter.is_active = query.is_active === "true";
            }

            const templates = await PaymentTemplate.find(filter);

            return ctx.json({
                success: true,
                data: templates,
                count: templates.length,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Get payment template by ID
     */
    public static readonly getPaymentTemplateById = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const template = await PaymentTemplate.findById(id);
            if (!template || template.is_deleted) {
                return ctx.json({ error: "Payment template not found" }, 404);
            }

            return ctx.json({
                success: true,
                data: template,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Update payment template (Admin only)
     */
    public static readonly updatePaymentTemplate = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const data = await ctx.req.json();
            const user = ctx.get("user");

            if (user.user_type !== "admin") {
                return ctx.json({ error: "Unauthorized access" }, 403);
            }

            const template = await PaymentTemplate.findById(id);
            if (!template || template.is_deleted) {
                return ctx.json({ error: "Payment template not found" }, 404);
            }

            const updatedData = {
                ...data,
                updated_by: user.id,
                updated_at: new Date(),
            };

            const updatedTemplate = await PaymentTemplate.updateById(id, updatedData);

            return ctx.json({
                success: true,
                data: updatedTemplate,
                message: "Payment template updated successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Delete payment template (Admin only)
     */
    public static readonly deletePaymentTemplate = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user = ctx.get("user");

            if (user.user_type !== "admin") {
                return ctx.json({ error: "Unauthorized access" }, 403);
            }

            const template = await PaymentTemplate.findById(id);
            if (!template || template.is_deleted) {
                return ctx.json({ error: "Payment template not found" }, 404);
            }

            await PaymentTemplate.updateById(id, {
                is_deleted: true,
                is_active: false,
                updated_at: new Date(),
            });

            return ctx.json({
                success: true,
                message: "Payment template deleted successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Create Razorpay order for student payment
     */
    public static readonly createPaymentOrder = async (ctx: Context) => {
        try {
            const data = await ctx.req.json();
            const user = ctx.get("user");

            // Fetch payment template
            const template = await PaymentTemplate.findById(data.payment_template_id);
            if (!template || !template.is_active || template.is_deleted) {
                return ctx.json({ error: "Invalid payment template" }, 404);
            }

            // Verify student access
            let studentId = user.id;
            if (user.user_type === "parent") {
                // For parent, we need student_id in the request
                if (!data.student_id) {
                    return ctx.json({ error: "Student ID is required for parent users" }, 400);
                }
                studentId = data.student_id;
            } else if (user.user_type !== "student") {
                return ctx.json({ error: "Only students or parents can make payments" }, 403);
            }

            // Get student details
            const student = await User.findById(studentId);
            if (!student) {
                return ctx.json({ error: "Student not found" }, 404);
            }

            // Check if student belongs to the class
            if (student.class_id !== template.class_id) {
                return ctx.json({ error: "This payment template is not applicable for this student" }, 400);
            }

            // Calculate amount based on installment or full payment
            let amount = template.total_amount;
            let installmentNumber: number | undefined;
            let installmentId: string | undefined;

            if (data.installment_number && template.is_installment_enabled) {
                const installment = template.installments.find(
                    (inst) => inst.installment_number === data.installment_number
                );
                if (!installment) {
                    return ctx.json({ error: "Invalid installment number" }, 400);
                }
                amount = installment.amount;
                installmentNumber = data.installment_number;
                installmentId = nanoid();
            }

            // Apply late fee if applicable
            let lateFee = 0;
            if (template.is_late_fee_enabled && template.payment_deadline) {
                const now = new Date();
                const deadline = new Date(template.payment_deadline);
                const gracePeriod = template.late_fee_grace_period_days || 0;
                deadline.setDate(deadline.getDate() + gracePeriod);

                if (now > deadline) {
                    if (template.late_fee_amount) {
                        lateFee = template.late_fee_amount;
                    } else if (template.late_fee_percentage) {
                        lateFee = (amount * template.late_fee_percentage) / 100;
                    }
                }
            }

            // Apply discount if applicable
            let discount = 0;
            if (template.is_discount_enabled && template.early_payment_deadline) {
                const now = new Date();
                const earlyDeadline = new Date(template.early_payment_deadline);

                if (now <= earlyDeadline) {
                    if (template.early_payment_discount_amount) {
                        discount = template.early_payment_discount_amount;
                    } else if (template.early_payment_discount_percentage) {
                        discount = (amount * template.early_payment_discount_percentage) / 100;
                    }
                }
            }

            const finalAmount = amount + lateFee - discount;

            // Get Razorpay credentials for the campus
            const schoolBankDetails = await SchoolBankDetails.findOne({ campus_id: template.campus_id });
            if (!schoolBankDetails) {
                return ctx.json({ error: "School payment configuration not found" }, 500);
            }

            // Decrypt and get Razorpay credentials
            let razorpayConfig;
            if (schoolBankDetails.encrypted_payment_credentials) {
                const decrypted = await CredentialEncryptionService.decryptCredentials(
                    schoolBankDetails.encrypted_payment_credentials
                );
                razorpayConfig = decrypted.razorpay;
            } else if (schoolBankDetails.payment_gateway_credentials?.razorpay) {
                razorpayConfig = schoolBankDetails.payment_gateway_credentials.razorpay;
            } else {
                return ctx.json({ error: "Razorpay not configured for this campus" }, 500);
            }

            if (!razorpayConfig || !razorpayConfig.enabled) {
                return ctx.json({ error: "Razorpay is not enabled for this campus" }, 500);
            }

            // Initialize Razorpay
            razorpayService.initialize({
                key_id: razorpayConfig.key_id,
                key_secret: razorpayConfig.key_secret,
            });

            // Generate receipt number
            const receiptNumber = `RCP-${template.campus_id}-${Date.now()}`;

            // Create Razorpay order
            const order = await razorpayService.createOrder({
                amount: finalAmount,
                currency: template.currency,
                receipt: receiptNumber,
                notes: {
                    campus_id: template.campus_id,
                    student_id: studentId,
                    class_id: template.class_id,
                    payment_template_id: template.id,
                    installment_number: installmentNumber?.toString() || "full",
                    payment_category: template.payment_category,
                },
            });

            // Create payment transaction record
            const transactionData = {
                campus_id: template.campus_id,
                student_id: studentId,
                class_id: template.class_id,
                academic_year: template.academic_year,
                payment_template_id: template.id,
                installment_number: installmentNumber,
                installment_id: installmentId,
                razorpay_order_id: isRazorpayOrder(order) ? order.id : '',
                amount: amount,
                currency: template.currency,
                late_fee: lateFee,
                discount: discount,
                final_amount: finalAmount,
                payment_status: "created" as const,
                student_email: data.student_email || student.email,
                student_phone: data.student_phone || student.phone,
                school_account_id: razorpayConfig.linked_account_id,
                description: `${template.template_name} - ${template.payment_category}`,
                receipt_number: receiptNumber,
                payment_initiated_at: new Date(),
                is_deleted: false,
            };
            
            const transaction = await PaymentTransaction.create(transactionData);

            return ctx.json({
                success: true,
                data: {
                    order_id: isRazorpayOrder(order) ? order.id : '',
                    amount: finalAmount,
                    currency: template.currency,
                    transaction_id: transaction.id,
                    key_id: razorpayConfig.key_id,
                    template_name: template.template_name,
                    description: transaction.description,
                },
                message: "Payment order created successfully",
            }, 201);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Verify payment and create route transfer
     */
    public static readonly verifyPayment = async (ctx: Context) => {
        try {
            const data = await ctx.req.json();

            // Find transaction by order_id
            const transaction = await PaymentTransaction.findOne({ 
                razorpay_order_id: data.razorpay_order_id 
            });

            if (!transaction) {
                return ctx.json({ error: "Transaction not found" }, 404);
            }

            // Get Razorpay credentials
            const schoolBankDetails = await SchoolBankDetails.findOne({ 
                campus_id: transaction.campus_id 
            });
            if (!schoolBankDetails) {
                return ctx.json({ error: "School payment configuration not found" }, 500);
            }

            let razorpayConfig;
            if (schoolBankDetails.encrypted_payment_credentials) {
                const decrypted = await CredentialEncryptionService.decryptCredentials(
                    schoolBankDetails.encrypted_payment_credentials
                );
                razorpayConfig = decrypted.razorpay;
            } else if (schoolBankDetails.payment_gateway_credentials?.razorpay) {
                razorpayConfig = schoolBankDetails.payment_gateway_credentials.razorpay;
            } else {
                return ctx.json({ error: "Razorpay not configured" }, 500);
            }

            // Verify signature
            const isValid = razorpayService.verifyPaymentSignature(
                {
                    order_id: data.razorpay_order_id,
                    payment_id: data.razorpay_payment_id,
                    signature: data.razorpay_signature,
                },
                razorpayConfig.key_secret
            );

            if (!isValid) {
                await PaymentTransaction.updateById(transaction.id, {
                    payment_status: "failed",
                    failure_reason: "Invalid payment signature",
                    updated_at: new Date(),
                });

                return ctx.json({ error: "Payment verification failed" }, 400);
            }

            // Initialize Razorpay
            razorpayService.initialize({
                key_id: razorpayConfig.key_id,
                key_secret: razorpayConfig.key_secret,
            });

            // Fetch payment details
            const payment = await razorpayService.fetchPayment(data.razorpay_payment_id);

            // Update transaction
            const updateData: Record<string, unknown> = {
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_signature: data.razorpay_signature,
                payment_status: "authorized",
                payment_method: isRazorpayPayment(payment) ? payment.method : "unknown",
                updated_at: new Date(),
            };

            // Capture payment
            await razorpayService.capturePayment(
                data.razorpay_payment_id,
                transaction.final_amount,
                transaction.currency
            );

            updateData.payment_status = "captured";
            updateData.payment_captured_at = new Date();

            // Create route transfer to school account (if linked account is configured)
            if (transaction.school_account_id) {
                const platformFee = transaction.final_amount * 0.02; // 2% platform fee
                const transferAmount = transaction.final_amount - platformFee;

                try {
                    const transfer = await razorpayService.createTransfer(
                        data.razorpay_payment_id,
                        {
                            account: transaction.school_account_id,
                            amount: transferAmount,
                            currency: transaction.currency,
                            notes: {
                                campus_id: transaction.campus_id,
                                student_id: transaction.student_id,
                                transaction_id: transaction.id,
                            },
                        }
                    );

                    updateData.razorpay_transfer_id = isRazorpayTransfer(transfer) ? transfer.id : '';
                    updateData.transfer_status = "processed";
                    updateData.transfer_amount = transferAmount;
                    updateData.platform_fee = platformFee;
                    updateData.transfer_initiated_at = new Date();
                    updateData.transfer_completed_at = new Date();
                } catch (transferError) {
                    // Transfer failed but payment is captured
                    updateData.transfer_status = "failed";
                    if (transferError instanceof Error) {
                        updateData.failure_reason = transferError.message;
                    }
                }
            }

            const updatedTransaction = await PaymentTransaction.updateById(transaction.id, updateData);

            // Generate invoice
            await PaymentController.generateInvoice(updatedTransaction as never);

            return ctx.json({
                success: true,
                data: {
                    transaction_id: updatedTransaction?.id,
                    payment_id: updatedTransaction?.razorpay_payment_id,
                    amount: transaction.final_amount,
                    status: transaction.payment_status,
                    transfer_status: transaction.transfer_status,
                },
                message: "Payment verified successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Generate invoice for a transaction
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static async generateInvoice(transaction: any) {
        try {
            // Get student details
            const student = await User.findById(transaction.student_id);
            if (!student) {
                return;
            }

            // Get campus details
            const campus = await Campus.findById(transaction.campus_id);
            if (!campus) {
                return;
            }

            // Get class details
            const classInfo = await Class.findById(transaction.class_id);

            // Get template details
            const template = await PaymentTemplate.findById(transaction.payment_template_id);
            if (!template) {
                return;
            }

            // Generate invoice number
            const invoiceNumber = `INV-${transaction.campus_id}-${Date.now()}`;

            // Create line items
            const lineItems = [
                {
                    description: template.template_name,
                    quantity: 1,
                    unit_price: Number(transaction.amount || 0),
                    amount: Number(transaction.amount || 0),
                },
            ];

            if (Number(transaction.late_fee || 0) > 0) {
                lineItems.push({
                    description: "Late Fee",
                    quantity: 1,
                    unit_price: Number(transaction.late_fee),
                    amount: Number(transaction.late_fee),
                });
            }

            if (Number(transaction.discount || 0) > 0) {
                lineItems.push({
                    description: "Discount",
                    quantity: 1,
                    unit_price: -Number(transaction.discount),
                    amount: -Number(transaction.discount),
                });
            }

            // Create invoice
            const invoice = await PaymentInvoice.create({
                invoice_number: invoiceNumber,
                campus_id: String(transaction.campus_id),
                student_id: String(transaction.student_id),
                class_id: String(transaction.class_id),
                academic_year: String(transaction.academic_year || ""),
                payment_template_id: String(transaction.payment_template_id),
                payment_transaction_id: String(transaction.id),
                invoice_date: new Date(),
                due_date: template.payment_deadline,
                student_name: `${student.first_name} ${student.last_name}`,
                student_email: student.email,
                student_phone: student.phone,
                school_name: campus.name || "School Name",
                school_address: campus.address || "",
                school_email: "",
                school_phone: "",
                line_items: lineItems,
                subtotal: Number(transaction.amount || 0),
                late_fee: Number(transaction.late_fee || 0),
                discount: Number(transaction.discount || 0),
                tax_amount: 0,
                total_amount: Number(transaction.final_amount || 0),
                amount_paid: Number(transaction.final_amount || 0),
                balance_due: 0,
                currency: String(transaction.currency || "INR"),
                payment_status: "paid",
                payment_date: transaction.payment_captured_at,
                payment_method: String(transaction.payment_method || ""),
                razorpay_payment_id: String(transaction.razorpay_payment_id || ""),
                notes: `Class: ${classInfo?.name || "N/A"}`,
                is_deleted: false,
                created_by: String(transaction.student_id),
            });

            // Update transaction with invoice_id
            await PaymentTransaction.updateById(transaction.id, {
                invoice_id: invoice.id,
            });

            return invoice;
        } catch (error) {
            throw new Error(`Error generating invoice: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Get payment transactions
     */
    public static readonly getPaymentTransactions = async (ctx: Context) => {
        try {
            const query = ctx.req.query();
            const user = ctx.get("user");

            const filter: Record<string, unknown> = { is_deleted: false };

            // Apply filters based on user role
            if (user.user_type === "student") {
                filter.student_id = user.id;
            } else if (user.user_type === "parent") {
                // Get all children of parent
                // Assuming parent has children in meta_data
                if (query.student_id) {
                    filter.student_id = query.student_id;
                } else {
                    return ctx.json({ error: "Student ID is required for parents" }, 400);
                }
            } else if (user.user_type === "admin") {
                if (query.student_id) {
                    filter.student_id = query.student_id;
                }
                if (query.campus_id) {
                    filter.campus_id = query.campus_id;
                } else if (user.campus_id) {
                    filter.campus_id = user.campus_id;
                }
            }

            if (query.class_id) {
                filter.class_id = query.class_id;
            }
            if (query.payment_template_id) {
                filter.payment_template_id = query.payment_template_id;
            }
            if (query.payment_status) {
                filter.payment_status = query.payment_status;
            }

            const transactions = await PaymentTransaction.find(filter);

            return ctx.json({
                success: true,
                data: transactions,
                count: transactions.length,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Get transaction by ID
     */
    public static readonly getTransactionById = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user = ctx.get("user");

            const transaction = await PaymentTransaction.findById(id);
            if (!transaction || transaction.is_deleted) {
                return ctx.json({ error: "Transaction not found" }, 404);
            }

            // Check access permissions
            if (user.user_type === "student" && transaction.student_id !== user.id) {
                return ctx.json({ error: "Unauthorized access" }, 403);
            }

            return ctx.json({
                success: true,
                data: transaction,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Get invoices
     */
    public static readonly getInvoices = async (ctx: Context) => {
        try {
            const query = ctx.req.query();
            const user = ctx.get("user");

            const filter: Record<string, unknown> = { is_deleted: false };

            // Apply filters based on user role
            if (user.user_type === "student") {
                filter.student_id = user.id;
            } else if (user.user_type === "parent") {
                if (query.student_id) {
                    filter.student_id = query.student_id;
                } else {
                    return ctx.json({ error: "Student ID is required for parents" }, 400);
                }
            } else if (user.user_type === "admin") {
                if (query.student_id) {
                    filter.student_id = query.student_id;
                }
                if (query.campus_id) {
                    filter.campus_id = query.campus_id;
                } else if (user.campus_id) {
                    filter.campus_id = user.campus_id;
                }
            }

            if (query.payment_status) {
                filter.payment_status = query.payment_status;
            }

            const invoices = await PaymentInvoice.find(filter);

            return ctx.json({
                success: true,
                data: invoices,
                count: invoices.length,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Get invoice by ID
     */
    public static readonly getInvoiceById = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();
            const user = ctx.get("user");

            const invoice = await PaymentInvoice.findById(id);
            if (!invoice || invoice.is_deleted) {
                return ctx.json({ error: "Invoice not found" }, 404);
            }

            // Check access permissions
            if (user.user_type === "student" && invoice.student_id !== user.id) {
                return ctx.json({ error: "Unauthorized access" }, 403);
            }

            return ctx.json({
                success: true,
                data: invoice,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Webhook handler for Razorpay events
     */
    public static readonly handleWebhook = async (ctx: Context) => {
        try {
            const webhookSignature = ctx.req.header("x-razorpay-signature");
            const webhookBody = await ctx.req.text();

            if (!webhookSignature) {
                return ctx.json({ error: "Missing webhook signature" }, 400);
            }

            // Get webhook secret from environment or database
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

            // Verify webhook signature
            const isValid = razorpayService.verifyWebhookSignature({
                webhook_signature: webhookSignature,
                webhook_body: webhookBody,
                webhook_secret: webhookSecret,
            });

            if (!isValid) {
                return ctx.json({ error: "Invalid webhook signature" }, 400);
            }

            const payload = JSON.parse(webhookBody);
            const event = payload.event;

            // Log webhook event for debugging (remove in production)
            // eslint-disable-next-line no-console
            console.log(`[Webhook] Received event: ${event}`, {
                event_id: payload.event_id,
                created_at: payload.created_at,
            });

            // Handle different webhook events
            switch (event) {
                case "payment.captured":
                    await PaymentController.handlePaymentCaptured(payload.payload.payment.entity);
                    break;
                case "payment.failed":
                    await PaymentController.handlePaymentFailed(payload.payload.payment.entity);
                    break;
                case "transfer.processed":
                    await PaymentController.handleTransferProcessed(payload.payload.transfer.entity);
                    break;
                case "transfer.failed":
                    await PaymentController.handleTransferFailed(payload.payload.transfer.entity);
                    break;
                case "payment.authorized":
                    // Payment authorized but not captured yet
                    await PaymentController.handlePaymentAuthorized(payload.payload.payment.entity);
                    break;
                default:
                    // Log unhandled events for debugging
                    // eslint-disable-next-line no-console
                    console.log(`[Webhook] Unhandled event: ${event}`);
                    break;
            }

            return ctx.json({ success: true });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    private static async handlePaymentAuthorized(paymentEntity: Record<string, unknown>) {
        const transaction = await PaymentTransaction.findOne({ 
            razorpay_order_id: paymentEntity.order_id 
        });
        if (transaction) {
            await PaymentTransaction.updateById(transaction.id, {
                payment_status: "authorized",
                razorpay_payment_id: paymentEntity.id as string,
            });
        }
    }

    private static async handlePaymentCaptured(paymentEntity: Record<string, unknown>) {
        const transaction = await PaymentTransaction.findOne({ 
            razorpay_order_id: paymentEntity.order_id 
        });
        if (transaction) {
            await PaymentTransaction.updateById(transaction.id, {
                payment_status: "captured",
                payment_captured_at: new Date((paymentEntity.created_at as number) * 1000),
            });

            // Check if transfer exists for this payment
            // This helps when transfer webhook events are not available
            if (transaction.school_account_id && transaction.razorpay_payment_id) {
                try {
                    // Small delay to allow transfer to process
                    setTimeout(async () => {
                        try {
                            const transfers = await razorpayService.fetchPaymentTransfers(
                                transaction.razorpay_payment_id as string
                            );
                            
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const transfersArray = (transfers as any)?.items || [];
                            
                            if (transfersArray.length > 0) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const transfer = transfersArray[0] as any;
                                
                                await PaymentTransaction.updateById(transaction.id, {
                                    razorpay_transfer_id: transfer.id,
                                    transfer_status: transfer.status === "processed" ? "processed" : "pending",
                                    transfer_amount: transfer.amount / 100,
                                    transfer_completed_at: transfer.status === "processed" 
                                        ? new Date(transfer.processed_at * 1000) 
                                        : undefined,
                                });
                            }
                        } catch (error) {
                            // eslint-disable-next-line no-console
                            console.error("[Webhook] Error fetching transfer:", error);
                        }
                    }, 5000); // Wait 5 seconds for transfer to process
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error("[Webhook] Error setting up transfer check:", error);
                }
            }
        }
    }

    private static async handlePaymentFailed(paymentEntity: Record<string, unknown>) {
        const transaction = await PaymentTransaction.findOne({ 
            razorpay_order_id: paymentEntity.order_id 
        });
        if (transaction) {
            await PaymentTransaction.updateById(transaction.id, {
                payment_status: "failed",
                failure_reason: paymentEntity.error_description as string,
                error_code: paymentEntity.error_code as string,
            });
        }
    }

    private static async handleTransferProcessed(transferEntity: Record<string, unknown>) {
        const transaction = await PaymentTransaction.findOne({ 
            razorpay_payment_id: transferEntity.source 
        });
        if (transaction) {
            await PaymentTransaction.updateById(transaction.id, {
                transfer_status: "processed",
                transfer_completed_at: new Date((transferEntity.created_at as number) * 1000),
            });
        }
    }

    private static async handleTransferFailed(transferEntity: Record<string, unknown>) {
        const transaction = await PaymentTransaction.findOne({ 
            razorpay_payment_id: transferEntity.source 
        });
        if (transaction) {
            await PaymentTransaction.updateById(transaction.id, {
                transfer_status: "failed",
            });
        }
    }

    /**
     * Create refund (Admin only)
     */
    public static readonly createRefund = async (ctx: Context) => {
        try {
            const data = await ctx.req.json();
            const user = ctx.get("user");

            if (user.user_type !== "admin") {
                return ctx.json({ error: "Unauthorized access" }, 403);
            }

            const transaction = await PaymentTransaction.findById(data.payment_transaction_id);
            if (!transaction || transaction.is_deleted) {
                return ctx.json({ error: "Transaction not found" }, 404);
            }

            if (transaction.payment_status !== "captured") {
                return ctx.json({ error: "Can only refund captured payments" }, 400);
            }

            // Get Razorpay credentials
            const schoolBankDetails = await SchoolBankDetails.findOne({ 
                campus_id: transaction.campus_id 
            });
            if (!schoolBankDetails) {
                return ctx.json({ error: "School payment configuration not found" }, 500);
            }

            let razorpayConfig;
            if (schoolBankDetails.encrypted_payment_credentials) {
                const decrypted = await CredentialEncryptionService.decryptCredentials(
                    schoolBankDetails.encrypted_payment_credentials
                );
                razorpayConfig = decrypted.razorpay;
            } else if (schoolBankDetails.payment_gateway_credentials?.razorpay) {
                razorpayConfig = schoolBankDetails.payment_gateway_credentials.razorpay;
            }

            if (!razorpayConfig) {
                return ctx.json({ error: "Razorpay not configured" }, 500);
            }

            // Initialize Razorpay
            razorpayService.initialize({
                key_id: razorpayConfig.key_id,
                key_secret: razorpayConfig.key_secret,
            });

            // Create refund
            if (!transaction.razorpay_payment_id) {
                return ctx.json({ error: "Payment ID not found in transaction" }, 400);
            }
            
            const refund = await razorpayService.createRefund(
                transaction.razorpay_payment_id,
                data.amount,
                { reason: data.reason }
            );

            // Update transaction
            const refundData = {
                refund_id: isRazorpayRefund(refund) ? refund.id : "",
                refund_amount: data.amount || transaction.final_amount,
                refund_status: "processed",
                refund_reason: data.reason,
                refunded_at: new Date(),
                payment_status: data.amount ? "partially_refunded" : "refunded",
            };
            
            await PaymentTransaction.updateById(transaction.id, refundData);

            // Update invoice
            const invoice = await PaymentInvoice.findOne({ 
                payment_transaction_id: transaction.id 
            });
            if (invoice) {
                await PaymentInvoice.updateById(invoice.id, {
                    payment_status: "cancelled",
                    updated_at: new Date(),
                });
            }

            return ctx.json({
                success: true,
                data: {
                    refund_id: isRazorpayRefund(refund) ? refund.id : "",
                    amount: refundData.refund_amount,
                    status: refundData.refund_status,
                },
                message: "Refund processed successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };

    /**
     * Get payment analytics (Admin only)
     */
    public static readonly getPaymentAnalytics = async (ctx: Context) => {
        try {
            const query = ctx.req.query();
            const user = ctx.get("user");

            if (user.user_type !== "admin") {
                return ctx.json({ error: "Unauthorized access" }, 403);
            }

            const filter: Record<string, unknown> = { is_deleted: false };

            if (query.campus_id) {
                filter.campus_id = query.campus_id;
            } else if (user.campus_id) {
                filter.campus_id = user.campus_id;
            }

            if (query.class_id) {
                filter.class_id = query.class_id;
            }
            if (query.academic_year) {
                filter.academic_year = query.academic_year;
            }

            // Get all transactions
            type TransactionType = { final_amount: number; payment_status: string; transfer_status?: string; refund_amount?: number; transfer_amount?: number; platform_fee?: number };
            const transactions = await PaymentTransaction.find(filter) as unknown as TransactionType[];

            // Calculate analytics
            const totalAmount = transactions.reduce((sum: number, t: TransactionType) => sum + t.final_amount, 0);
            const totalCaptured = transactions
                .filter((t: TransactionType) => t.payment_status === "captured")
                .reduce((sum: number, t: TransactionType) => sum + t.final_amount, 0);
            const totalPending = transactions
                .filter((t: TransactionType) => ["created", "pending", "authorized"].includes(t.payment_status))
                .reduce((sum: number, t: TransactionType) => sum + t.final_amount, 0);
            const totalFailed = transactions
                .filter((t: TransactionType) => t.payment_status === "failed")
                .reduce((sum: number, t: TransactionType) => sum + t.final_amount, 0);
            const totalRefunded = transactions
                .filter((t: TransactionType) => t.payment_status === "refunded")
                .reduce((sum: number, t: TransactionType) => sum + (t.refund_amount || 0), 0);
            const totalTransferred = transactions
                .filter((t: TransactionType) => t.transfer_status === "processed")
                .reduce((sum: number, t: TransactionType) => sum + (t.transfer_amount || 0), 0);
            const totalPlatformFee = transactions
                .filter((t: TransactionType) => t.transfer_status === "processed")
                .reduce((sum: number, t: TransactionType) => sum + (t.platform_fee || 0), 0);

            const analytics = {
                total_transactions: transactions.length,
                total_amount: totalAmount,
                total_captured: totalCaptured,
                total_pending: totalPending,
                total_failed: totalFailed,
                total_refunded: totalRefunded,
                total_transferred: totalTransferred,
                total_platform_fee: totalPlatformFee,
                success_rate: transactions.length > 0 
                    ? ((transactions.filter((t: TransactionType) => t.payment_status === "captured").length / transactions.length) * 100).toFixed(2)
                    : 0,
                status_breakdown: {
                    created: transactions.filter((t: TransactionType) => t.payment_status === "created").length,
                    pending: transactions.filter((t: TransactionType) => t.payment_status === "pending").length,
                    authorized: transactions.filter((t: TransactionType) => t.payment_status === "authorized").length,
                    captured: transactions.filter((t: TransactionType) => t.payment_status === "captured").length,
                    failed: transactions.filter((t: TransactionType) => t.payment_status === "failed").length,
                    refunded: transactions.filter((t: TransactionType) => t.payment_status === "refunded").length,
                    partially_refunded: transactions.filter((t: TransactionType) => t.payment_status === "partially_refunded").length,
                },
            };

            return ctx.json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({ error: error.message }, 500);
            }
        }
    };
}
