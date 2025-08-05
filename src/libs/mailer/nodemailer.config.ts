import nodemailer from "nodemailer";

import { config } from "@/utils/env";

// Create reusable transporter object using SMTP transport
export const createTransporter = () => {
    // You can configure this for different email providers
    // Example configurations for popular providers:

    // Gmail configuration
    if (config.EMAIL_PROVIDER === "gmail") {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS, // Use app password for Gmail
            },
        });
    }

    // Outlook/Hotmail configuration
    if (config.EMAIL_PROVIDER === "outlook") {
        return nodemailer.createTransport({
            service: "hotmail",
            auth: {
                user: config.EMAIL_USER,
                pass: config.EMAIL_PASS,
            },
        });
    }

    // Custom SMTP configuration
    return nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: Number.parseInt(config.SMTP_PORT || "587"),
        secure: config.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
            user: config.EMAIL_USER,
            pass: config.EMAIL_PASS,
        },
        // For development/testing - ignore certificate errors
        tls: {
            rejectUnauthorized: false,
        },
    });
};

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

export const sendEmailWithNodemailer = async (options: EmailOptions) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: options.from || config.EMAIL_FROM || config.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
