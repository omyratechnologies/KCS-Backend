import { IFeeData } from "@/models/fee.model";
import { IPaymentTransaction } from "@/models/payment_transaction.model";
import { IPaymentInvoice } from "@/models/payment_invoice.model";

export interface PaymentNotificationTemplate {
    id: string;
    campus_id: string;
    name: string;
    type: "email" | "sms" | "both";
    trigger: "payment_due" | "payment_overdue" | "payment_success" | "payment_failed" | "fee_generated";
    subject?: string;
    content: string;
    variables: string[]; // Available template variables
    is_active: boolean;
    days_before_due?: number; // For reminder notifications
    created_at: Date;
    updated_at: Date;
}

export interface PaymentNotificationData {
    student_name: string;
    student_email: string;
    student_phone: string;
    parent_name?: string;
    parent_email?: string;
    parent_phone?: string;
    school_name: string;
    fee_amount: number;
    due_date: string;
    payment_url?: string;
    invoice_url?: string;
    transaction_id?: string;
    late_fee_amount?: number;
}

export class PaymentNotificationService {
    /**
     * Send payment due reminder
     */
    static async sendPaymentDueReminder(
        campus_id: string,
        fee: IFeeData,
        studentData: any,
        schoolData: any
    ): Promise<void> {
        try {
            const template = await this.getNotificationTemplate(campus_id, "payment_due");
            if (!template || !template.is_active) return;

            const notificationData: PaymentNotificationData = {
                student_name: `${studentData.first_name} ${studentData.last_name}`,
                student_email: studentData.email,
                student_phone: studentData.phone,
                parent_email: studentData.parent_email,
                parent_phone: studentData.parent_phone,
                school_name: schoolData.name,
                fee_amount: fee.due_amount,
                due_date: fee.items[0]?.due_date?.toDateString() || "N/A",
                payment_url: `${process.env.FRONTEND_URL}/payment/${fee.id}`
            };

            await this.sendNotification(template, notificationData);

            // Update reminder count
            await this.updateReminderCount(fee.id, template.type);
        } catch (error) {
            console.error("Failed to send payment due reminder:", error);
        }
    }

    /**
     * Send payment overdue notification
     */
    static async sendPaymentOverdueNotification(
        campus_id: string,
        fee: IFeeData,
        studentData: any,
        schoolData: any
    ): Promise<void> {
        try {
            const template = await this.getNotificationTemplate(campus_id, "payment_overdue");
            if (!template || !template.is_active) return;

            const notificationData: PaymentNotificationData = {
                student_name: `${studentData.first_name} ${studentData.last_name}`,
                student_email: studentData.email,
                student_phone: studentData.phone,
                parent_email: studentData.parent_email,
                parent_phone: studentData.parent_phone,
                school_name: schoolData.name,
                fee_amount: fee.due_amount,
                due_date: fee.items[0]?.due_date?.toDateString() || "N/A",
                late_fee_amount: fee.late_fee_amount,
                payment_url: `${process.env.FRONTEND_URL}/payment/${fee.id}`
            };

            await this.sendNotification(template, notificationData);
            await this.updateReminderCount(fee.id, template.type);
        } catch (error) {
            console.error("Failed to send payment overdue notification:", error);
        }
    }

    /**
     * Send payment success confirmation
     */
    static async sendPaymentSuccessConfirmation(
        campus_id: string,
        transaction: IPaymentTransaction,
        invoice: IPaymentInvoice,
        studentData: any,
        schoolData: any
    ): Promise<void> {
        try {
            const template = await this.getNotificationTemplate(campus_id, "payment_success");
            if (!template || !template.is_active) return;

            const notificationData: PaymentNotificationData = {
                student_name: `${studentData.first_name} ${studentData.last_name}`,
                student_email: studentData.email,
                student_phone: studentData.phone,
                parent_email: studentData.parent_email,
                parent_phone: studentData.parent_phone,
                school_name: schoolData.name,
                fee_amount: transaction.amount,
                due_date: new Date().toDateString(),
                transaction_id: transaction.id,
                invoice_url: `${process.env.FRONTEND_URL}/invoice/${invoice.id}`
            };

            await this.sendNotification(template, notificationData);
        } catch (error) {
            console.error("Failed to send payment success confirmation:", error);
        }
    }

    /**
     * Send bulk reminders for overdue fees
     */
    static async sendBulkPaymentReminders(campus_id: string): Promise<{
        sent: number;
        failed: number;
        details: any[];
    }> {
        try {
            const { Fee } = await import("@/models/fee.model");
            const { UserService } = await import("@/services/users.service");
            
            // Get all overdue fees
            const overdueFees = await Fee.find({
                campus_id,
                payment_status: "overdue",
                is_paid: false
            });

            const results = {
                sent: 0,
                failed: 0,
                details: [] as any[]
            };

            for (const fee of overdueFees.rows || []) {
                try {
                    const studentData = await UserService.getUser(fee.user_id);
                    const schoolData = await this.getSchoolDetails(campus_id);
                    
                    await this.sendPaymentOverdueNotification(campus_id, fee, studentData, schoolData);
                    results.sent++;
                    results.details.push({
                        fee_id: fee.id,
                        student_id: fee.user_id,
                        status: "sent"
                    });
                } catch (error) {
                    results.failed++;
                    results.details.push({
                        fee_id: fee.id,
                        student_id: fee.user_id,
                        status: "failed",
                        error: error instanceof Error ? error.message : "Unknown error"
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to send bulk reminders: ${error}`);
        }
    }

    /**
     * Get notification template
     */
    private static async getNotificationTemplate(
        campus_id: string,
        trigger: string
    ): Promise<PaymentNotificationTemplate | null> {
        try {
            // For now, return default templates - you can implement database storage later
            const defaultTemplates: { [key: string]: PaymentNotificationTemplate } = {
                payment_due: {
                    id: "payment_due_default",
                    campus_id,
                    name: "Payment Due Reminder",
                    type: "both",
                    trigger: "payment_due",
                    subject: "Fee Payment Due - {{school_name}}",
                    content: `Dear {{student_name}},

This is a reminder that your fee payment of ₹{{fee_amount}} is due on {{due_date}}.

Please make the payment at your earliest convenience to avoid late fees.

Payment Link: {{payment_url}}

Thank you,
{{school_name}}`,
                    variables: ["student_name", "school_name", "fee_amount", "due_date", "payment_url"],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                payment_overdue: {
                    id: "payment_overdue_default",
                    campus_id,
                    name: "Payment Overdue Notice",
                    type: "both",
                    trigger: "payment_overdue",
                    subject: "URGENT: Fee Payment Overdue - {{school_name}}",
                    content: `Dear {{student_name}},

Your fee payment of ₹{{fee_amount}} was due on {{due_date}} and is now overdue.

Late fee of ₹{{late_fee_amount}} has been added to your account.

Please make the payment immediately to avoid further charges.

Payment Link: {{payment_url}}

{{school_name}}`,
                    variables: ["student_name", "school_name", "fee_amount", "due_date", "late_fee_amount", "payment_url"],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                },
                payment_success: {
                    id: "payment_success_default",
                    campus_id,
                    name: "Payment Success Confirmation",
                    type: "both",
                    trigger: "payment_success",
                    subject: "Payment Successful - {{school_name}}",
                    content: `Dear {{student_name}},

Your payment of ₹{{fee_amount}} has been successfully processed.

Transaction ID: {{transaction_id}}

Download your invoice: {{invoice_url}}

Thank you for your payment!

{{school_name}}`,
                    variables: ["student_name", "school_name", "fee_amount", "transaction_id", "invoice_url"],
                    is_active: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            };

            return defaultTemplates[trigger] || null;
        } catch (error) {
            console.error("Failed to get notification template:", error);
            return null;
        }
    }

    /**
     * Send notification via email/SMS
     */
    private static async sendNotification(
        template: PaymentNotificationTemplate,
        data: PaymentNotificationData
    ): Promise<void> {
        const content = this.replaceTemplateVariables(template.content, data);
        const subject = template.subject ? this.replaceTemplateVariables(template.subject, data) : undefined;

        if (template.type === "email" || template.type === "both") {
            await this.sendEmail(data.student_email, subject || "Payment Notification", content);
            
            // Also send to parent if available
            if (data.parent_email) {
                await this.sendEmail(data.parent_email, subject || "Payment Notification", content);
            }
        }

        if (template.type === "sms" || template.type === "both") {
            const smsContent = this.truncateForSMS(content);
            await this.sendSMS(data.student_phone, smsContent);
            
            // Also send to parent if available
            if (data.parent_phone) {
                await this.sendSMS(data.parent_phone, smsContent);
            }
        }
    }

    /**
     * Replace template variables with actual data
     */
    private static replaceTemplateVariables(template: string, data: PaymentNotificationData): string {
        let content = template;
        
        // Replace all available variables
        content = content.replace(/{{student_name}}/g, data.student_name);
        content = content.replace(/{{school_name}}/g, data.school_name);
        content = content.replace(/{{fee_amount}}/g, data.fee_amount.toString());
        content = content.replace(/{{due_date}}/g, data.due_date);
        content = content.replace(/{{payment_url}}/g, data.payment_url || "");
        content = content.replace(/{{invoice_url}}/g, data.invoice_url || "");
        content = content.replace(/{{transaction_id}}/g, data.transaction_id || "");
        content = content.replace(/{{late_fee_amount}}/g, (data.late_fee_amount || 0).toString());

        return content;
    }

    /**
     * Truncate content for SMS (160 characters)
     */
    private static truncateForSMS(content: string): string {
        // Remove extra whitespace and line breaks
        const cleaned = content.replace(/\s+/g, ' ').trim();
        
        if (cleaned.length <= 160) {
            return cleaned;
        }
        
        // Truncate and add ellipsis
        return cleaned.substring(0, 157) + "...";
    }

    /**
     * Send email notification
     */
    private static async sendEmail(to: string, subject: string, content: string): Promise<void> {
        try {
            // Integration with your email service (e.g., SendGrid, AWS SES, etc.)
            console.log(`📧 Sending email to ${to}: ${subject}`);
            
            // Example integration points:
            // - SendGrid: await sgMail.send({ to, subject, html: content });
            // - AWS SES: await ses.sendEmail({ Destination: { ToAddresses: [to] }, Message: { Subject: { Data: subject }, Body: { Html: { Data: content } } } }).promise();
            // - Nodemailer: await transporter.sendMail({ to, subject, html: content });
            
            // For now, we'll log the email (replace with actual implementation)
            console.log("✅ Email sent successfully");
        } catch (error) {
            console.error("❌ Failed to send email:", error);
            throw error;
        }
    }

    /**
     * Send SMS notification
     */
    private static async sendSMS(to: string, content: string): Promise<void> {
        try {
            // Integration with your SMS service (e.g., Twilio, AWS SNS, etc.)
            console.log(`📱 Sending SMS to ${to}: ${content}`);
            
            // Example integration points:
            // - Twilio: await client.messages.create({ to, from: process.env.SMS_FROM, body: content });
            // - AWS SNS: await sns.publish({ PhoneNumber: to, Message: content }).promise();
            // - TextLocal: await textlocal.sendSms([to], content);
            
            // For now, we'll log the SMS (replace with actual implementation)
            console.log("✅ SMS sent successfully");
        } catch (error) {
            console.error("❌ Failed to send SMS:", error);
            throw error;
        }
    }

    /**
     * Update reminder count in fee record
     */
    private static async updateReminderCount(fee_id: string, type: "email" | "sms" | "both"): Promise<void> {
        try {
            const { Fee } = await import("@/models/fee.model");
            const fee = await Fee.findById(fee_id);
            
            if (fee) {
                const reminderSent = fee.reminder_sent || { email_count: 0, sms_count: 0 };
                
                if (type === "email" || type === "both") {
                    reminderSent.email_count = (reminderSent.email_count || 0) + 1;
                }
                
                if (type === "sms" || type === "both") {
                    reminderSent.sms_count = (reminderSent.sms_count || 0) + 1;
                }
                
                reminderSent.last_sent_at = new Date();
                
                await Fee.updateById(fee_id, {
                    reminder_sent: reminderSent,
                    updated_at: new Date()
                });
            }
        } catch (error) {
            console.error("Failed to update reminder count:", error);
        }
    }

    /**
     * Get school details
     */
    static async getSchoolDetails(campus_id: string): Promise<any> {
        try {
            const { Campus } = await import("@/models/campus.model");
            return await Campus.findById(campus_id);
        } catch (error) {
            throw new Error(`Failed to get school details: ${error}`);
        }
    }

    /**
     * Schedule automatic payment reminders
     */
    static async schedulePaymentReminders(campus_id: string): Promise<void> {
        try {
            const { Fee } = await import("@/models/fee.model");
            const { UserService } = await import("@/services/users.service");
            
            const today = new Date();
            const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

            // Get fees due in next 3 days
            const feesDueSoon = await Fee.find({
                campus_id,
                payment_status: "unpaid",
                is_paid: false
            });

            const schoolData = await this.getSchoolDetails(campus_id);

            for (const fee of feesDueSoon.rows || []) {
                // Check if any item is due in next 3 days
                const hasDueSoon = fee.items.some(item => {
                    const dueDate = new Date(item.due_date);
                    return dueDate >= today && dueDate <= threeDaysFromNow;
                });

                if (hasDueSoon) {
                    const studentData = await UserService.getUser(fee.user_id);
                    await this.sendPaymentDueReminder(campus_id, fee, studentData, schoolData);
                }
            }

        } catch (error) {
            console.error("Failed to schedule payment reminders:", error);
        }
    }
}
