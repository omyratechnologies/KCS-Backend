import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface InvoiceData {
    invoice_number: string;
    invoice_date: Date;
    due_date?: Date;
    
    // School details
    school_name: string;
    school_address?: string;
    school_email?: string;
    school_phone?: string;
    school_gstin?: string;
    school_logo_url?: string;
    
    // Student details
    student_name: string;
    student_email?: string;
    student_phone?: string;
    parent_name?: string;
    class_name?: string;
    
    // Line items
    line_items: {
        description: string;
        quantity: number;
        unit_price: number;
        amount: number;
    }[];
    
    // Amounts
    subtotal: number;
    late_fee: number;
    discount: number;
    tax_amount: number;
    tax_percentage?: number;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    
    currency: string;
    
    // Payment info
    payment_status: string;
    payment_date?: Date;
    payment_method?: string;
    razorpay_payment_id?: string;
    
    // Notes
    notes?: string;
    terms_and_conditions?: string;
}

export class InvoiceGenerator {
    /**
     * Generate PDF invoice
     */
    static async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ 
                    size: "A4", 
                    margin: 50,
                    info: {
                        Title: `Invoice ${data.invoice_number}`,
                        Author: data.school_name,
                    }
                });

                const chunks: Buffer[] = [];

                // Collect PDF chunks
                doc.on("data", (chunk: Buffer) => {
                    chunks.push(chunk);
                });

                doc.on("end", () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    resolve(pdfBuffer);
                });

                doc.on("error", (error: Error) => {
                    reject(error);
                });

                // Generate invoice content
                InvoiceGenerator.generateInvoiceContent(doc, data);

                // Finalize the PDF
                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate invoice content
     */
    private static generateInvoiceContent(doc: PDFKit.PDFDocument, data: InvoiceData) {
        // Header
        InvoiceGenerator.generateHeader(doc, data);
        
        // Customer information
        InvoiceGenerator.generateCustomerInfo(doc, data);
        
        // Invoice details table
        InvoiceGenerator.generateInvoiceTable(doc, data);
        
        // Summary
        InvoiceGenerator.generateSummary(doc, data);
        
        // Payment info
        InvoiceGenerator.generatePaymentInfo(doc, data);
        
        // Notes and terms
        InvoiceGenerator.generateFooter(doc, data);
    }

    /**
     * Generate header with school info
     */
    private static generateHeader(doc: PDFKit.PDFDocument, data: InvoiceData) {
        // School name
        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text(data.school_name, 50, 50);

        // School details
        doc
            .fontSize(10)
            .font("Helvetica")
            .text(data.school_address || "", 50, 75)
            .text(`Email: ${data.school_email || ""}`, 50, 90)
            .text(`Phone: ${data.school_phone || ""}`, 50, 105);

        if (data.school_gstin) {
            doc.text(`GSTIN: ${data.school_gstin}`, 50, 120);
        }

        // Invoice title and number
        doc
            .fontSize(20)
            .font("Helvetica-Bold")
            .text("INVOICE", 400, 50, { align: "right" });

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(`Invoice #: ${data.invoice_number}`, 400, 75, { align: "right" })
            .text(`Date: ${InvoiceGenerator.formatDate(data.invoice_date)}`, 400, 90, { align: "right" });

        if (data.due_date) {
            doc.text(`Due Date: ${InvoiceGenerator.formatDate(data.due_date)}`, 400, 105, { align: "right" });
        }

        // Draw line
        doc
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(50, 145)
            .lineTo(545, 145)
            .stroke();
    }

    /**
     * Generate customer information
     */
    private static generateCustomerInfo(doc: PDFKit.PDFDocument, data: InvoiceData) {
        const customerInfoTop = 160;

        doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("Bill To:", 50, customerInfoTop);

        doc
            .fontSize(10)
            .font("Helvetica")
            .text(data.student_name, 50, customerInfoTop + 20);

        if (data.parent_name) {
            doc.text(`Parent: ${data.parent_name}`, 50, customerInfoTop + 35);
        }

        if (data.class_name) {
            doc.text(`Class: ${data.class_name}`, 50, customerInfoTop + 50);
        }

        if (data.student_email) {
            doc.text(`Email: ${data.student_email}`, 50, customerInfoTop + 65);
        }

        if (data.student_phone) {
            doc.text(`Phone: ${data.student_phone}`, 50, customerInfoTop + 80);
        }
    }

    /**
     * Generate invoice table
     */
    private static generateInvoiceTable(doc: PDFKit.PDFDocument, data: InvoiceData) {
        const tableTop = 280;
        const itemCodeX = 50;
        const descriptionX = 150;
        const quantityX = 350;
        const priceX = 410;
        const amountX = 490;

        // Table header
        doc
            .fontSize(10)
            .font("Helvetica-Bold");

        InvoiceGenerator.generateTableRow(
            doc,
            tableTop,
            "Item",
            "Description",
            "Qty",
            "Price",
            "Amount"
        );

        // Draw header line
        doc
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(50, tableTop + 15)
            .lineTo(545, tableTop + 15)
            .stroke();

        // Table items
        doc.font("Helvetica");
        let position = tableTop + 25;

        for (let i = 0; i < data.line_items.length; i++) {
            const item = data.line_items[i];
            
            InvoiceGenerator.generateTableRow(
                doc,
                position,
                (i + 1).toString(),
                item.description,
                item.quantity.toString(),
                InvoiceGenerator.formatCurrency(item.unit_price, data.currency),
                InvoiceGenerator.formatCurrency(item.amount, data.currency)
            );

            position += 25;
        }

        // Draw bottom line
        doc
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(50, position)
            .lineTo(545, position)
            .stroke();
    }

    /**
     * Generate summary section
     */
    private static generateSummary(doc: PDFKit.PDFDocument, data: InvoiceData) {
        const summaryTop = 450;
        const leftColumn = 350;
        const rightColumn = 490;

        doc.fontSize(10).font("Helvetica");

        // Subtotal
        InvoiceGenerator.generateSummaryRow(
            doc,
            summaryTop,
            leftColumn,
            rightColumn,
            "Subtotal:",
            InvoiceGenerator.formatCurrency(data.subtotal, data.currency)
        );

        // Late fee
        if (data.late_fee > 0) {
            InvoiceGenerator.generateSummaryRow(
                doc,
                summaryTop + 20,
                leftColumn,
                rightColumn,
                "Late Fee:",
                InvoiceGenerator.formatCurrency(data.late_fee, data.currency)
            );
        }

        // Discount
        if (data.discount > 0) {
            InvoiceGenerator.generateSummaryRow(
                doc,
                summaryTop + 40,
                leftColumn,
                rightColumn,
                "Discount:",
                `- ${InvoiceGenerator.formatCurrency(data.discount, data.currency)}`
            );
        }

        // Tax
        if (data.tax_amount > 0) {
            const taxLabel = data.tax_percentage 
                ? `Tax (${data.tax_percentage}%):`
                : "Tax:";
            
            InvoiceGenerator.generateSummaryRow(
                doc,
                summaryTop + 60,
                leftColumn,
                rightColumn,
                taxLabel,
                InvoiceGenerator.formatCurrency(data.tax_amount, data.currency)
            );
        }

        // Total
        doc
            .fontSize(12)
            .font("Helvetica-Bold");

        InvoiceGenerator.generateSummaryRow(
            doc,
            summaryTop + 80,
            leftColumn,
            rightColumn,
            "Total:",
            InvoiceGenerator.formatCurrency(data.total_amount, data.currency)
        );

        // Amount paid
        doc.fontSize(10).font("Helvetica");

        InvoiceGenerator.generateSummaryRow(
            doc,
            summaryTop + 100,
            leftColumn,
            rightColumn,
            "Amount Paid:",
            InvoiceGenerator.formatCurrency(data.amount_paid, data.currency)
        );

        // Balance due
        if (data.balance_due > 0) {
            doc.fontSize(12).font("Helvetica-Bold");
            
            InvoiceGenerator.generateSummaryRow(
                doc,
                summaryTop + 120,
                leftColumn,
                rightColumn,
                "Balance Due:",
                InvoiceGenerator.formatCurrency(data.balance_due, data.currency)
            );
        }
    }

    /**
     * Generate payment information
     */
    private static generatePaymentInfo(doc: PDFKit.PDFDocument, data: InvoiceData) {
        if (data.payment_status === "paid" || data.payment_status === "partially_paid") {
            const paymentInfoTop = 600;

            doc
                .fontSize(12)
                .font("Helvetica-Bold")
                .text("Payment Information", 50, paymentInfoTop);

            doc
                .fontSize(10)
                .font("Helvetica")
                .text(`Status: ${data.payment_status.toUpperCase()}`, 50, paymentInfoTop + 20);

            if (data.payment_date) {
                doc.text(`Payment Date: ${InvoiceGenerator.formatDate(data.payment_date)}`, 50, paymentInfoTop + 35);
            }

            if (data.payment_method) {
                doc.text(`Payment Method: ${data.payment_method.toUpperCase()}`, 50, paymentInfoTop + 50);
            }

            if (data.razorpay_payment_id) {
                doc.text(`Transaction ID: ${data.razorpay_payment_id}`, 50, paymentInfoTop + 65);
            }
        }
    }

    /**
     * Generate footer with notes and terms
     */
    private static generateFooter(doc: PDFKit.PDFDocument, data: InvoiceData) {
        const footerTop = 680;

        if (data.notes) {
            doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .text("Notes:", 50, footerTop);

            doc
                .fontSize(9)
                .font("Helvetica")
                .text(data.notes, 50, footerTop + 15, { width: 495 });
        }

        if (data.terms_and_conditions) {
            const termsTop = data.notes ? footerTop + 50 : footerTop;
            
            doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .text("Terms & Conditions:", 50, termsTop);

            doc
                .fontSize(9)
                .font("Helvetica")
                .text(data.terms_and_conditions, 50, termsTop + 15, { width: 495 });
        }

        // Thank you message at the bottom
        doc
            .fontSize(8)
            .font("Helvetica")
            .text("Thank you for your payment!", 50, 750, { align: "center" });
    }

    /**
     * Helper: Generate table row
     */
    private static generateTableRow(
        doc: PDFKit.PDFDocument,
        y: number,
        item: string,
        description: string,
        quantity: string,
        price: string,
        amount: string
    ) {
        doc
            .fontSize(10)
            .text(item, 50, y, { width: 90 })
            .text(description, 150, y, { width: 190 })
            .text(quantity, 350, y, { width: 50, align: "right" })
            .text(price, 410, y, { width: 70, align: "right" })
            .text(amount, 490, y, { width: 55, align: "right" });
    }

    /**
     * Helper: Generate summary row
     */
    private static generateSummaryRow(
        doc: PDFKit.PDFDocument,
        y: number,
        leftColumn: number,
        rightColumn: number,
        label: string,
        value: string
    ) {
        doc
            .text(label, leftColumn, y)
            .text(value, rightColumn, y, { align: "right" });
    }

    /**
     * Helper: Format currency
     */
    private static formatCurrency(amount: number, currency: string): string {
        const symbol = InvoiceGenerator.getCurrencySymbol(currency);
        return `${symbol}${amount.toFixed(2)}`;
    }

    /**
     * Helper: Get currency symbol
     */
    private static getCurrencySymbol(currency: string): string {
        const symbols: { [key: string]: string } = {
            INR: "₹",
            USD: "$",
            EUR: "€",
            GBP: "£",
        };
        return symbols[currency] || currency;
    }

    /**
     * Helper: Format date
     */
    private static formatDate(date: Date): string {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
}
