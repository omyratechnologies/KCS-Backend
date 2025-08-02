import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import infoLogs, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

import { sendEmailWithNodemailer } from "./nodemailer.config";
import { renderMailContent } from "./templates";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use only nodemailer email settings
const FROM_EMAIL = config.EMAIL_FROM || config.EMAIL_USER;

export const onForgotPassword = async (
    email: string,
    body: {
        code: string;
    }
) => {
    const contentTemplate = await fs.readFile(
        path.join(__dirname, "templates", "leaflets", "forgot_passwd.html"),
        "utf8"
    );
    const html = await renderMailContent(contentTemplate, body);
    const mail = {
        from: FROM_EMAIL,
        to: email,
        subject: "Reset your password",
        text: "Reset your password",
        html,
    };
    
    // Use only nodemailer
    try {
        await sendEmailWithNodemailer(mail);
        infoLogs(
            `Password reset email sent to ${email} via Nodemailer`,
            LogTypes.LOGS,
            "MAIL:FORGOTPASSWORD:NODEMAILER"
        );
    } catch (error) {
        infoLogs(
            `Error sending password reset email to ${email} via Nodemailer: ${error}`,
            LogTypes.ERROR,
            "MAIL:FORGOTPASSWORD:NODEMAILER"
        );
        throw error;
    }
};

export interface WelcomeEmailData {
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
    user_id: string;
    campus_name?: string;
    login_url?: string;
    support_email?: string;
}

export const sendWelcomeEmail = async (
    email: string,
    userData: WelcomeEmailData
) => {
    try {
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "leaflets", "welcome_user.html"),
            "utf8"
        );
        
        // Set default values
        const emailData = {
            ...userData,
            login_url: userData.login_url || "https://your-kcs-platform.com/login",
            support_email: userData.support_email || "support@kcs-platform.com"
        };
        
        const html = await renderMailContent(contentTemplate, emailData);
        
        const mailOptions = {
            from: FROM_EMAIL,
            to: email,
            subject: "Welcome to KCS - Your Account is Ready!",
            text: `Welcome to KCS, ${userData.first_name}! Your account has been successfully created.`,
            html,
        };

        // Use only nodemailer
        await sendEmailWithNodemailer(mailOptions);
        infoLogs(
            `Welcome email sent to ${email} via Nodemailer`,
            LogTypes.LOGS,
            "MAIL:WELCOME:NODEMAILER"
        );
    } catch (error) {
        infoLogs(
            `Error sending welcome email to ${email}: ${error}`,
            LogTypes.ERROR,
            "MAIL:WELCOME:ERROR"
        );
        throw error;
    }
};

export interface PasswordResetSuccessEmailData {
    email: string;
    reset_date: string;
    reset_time: string;
    ip_address: string;
    login_url?: string;
    dashboard_url?: string;
    profile_url?: string;
    security_url?: string;
    support_url?: string;
    security_center_url?: string;
    help_url?: string;
    website_url?: string;
    logo_url?: string;
}

export const sendPasswordResetSuccessEmail = async (
    email: string,
    resetData: PasswordResetSuccessEmailData
) => {
    try {
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "email", "password-reset-success.html"),
            "utf8"
        );
        
        // Set default values
        const emailData = {
            ...resetData,
            login_url: resetData.login_url || "https://your-kcs-platform.com/login",
            dashboard_url: resetData.dashboard_url || "https://your-kcs-platform.com/dashboard",
            profile_url: resetData.profile_url || "https://your-kcs-platform.com/profile",
            security_url: resetData.security_url || "https://your-kcs-platform.com/security",
            support_url: resetData.support_url || "mailto:support@omyra.dev",
            security_center_url: resetData.security_center_url || "https://your-kcs-platform.com/security",
            help_url: resetData.help_url || "https://your-kcs-platform.com/help",
            website_url: resetData.website_url || "https://omyra.dev",
            logo_url: resetData.logo_url || "https://your-kcs-platform.com/logo.png"
        };
        
        const html = await renderMailContent(contentTemplate, emailData);
        
        const mailOptions = {
            from: FROM_EMAIL,
            to: email,
            subject: "Password Successfully Reset - Let's Catch Up",
            text: "Your password has been successfully reset. You can now sign in to your account using your new password.",
            html,
        };

        // Use only nodemailer
        await sendEmailWithNodemailer(mailOptions);
        infoLogs(
            `Password reset success email sent to ${email} via Nodemailer`,
            LogTypes.LOGS,
            "MAIL:PASSWORD_RESET_SUCCESS:NODEMAILER"
        );
    } catch (error) {
        infoLogs(
            `Error sending password reset success email to ${email}: ${error}`,
            LogTypes.ERROR,
            "MAIL:PASSWORD_RESET_SUCCESS:ERROR"
        );
        throw error;
    }
};
