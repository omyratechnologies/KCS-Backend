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

export const sendWelcomeEmail = async (email: string, userData: WelcomeEmailData) => {
    try {
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "leaflets", "welcome_user.html"),
            "utf8"
        );

        // Set default values
        const emailData = {
            ...userData,
            login_url: userData.login_url || "https://dev.letscatchup-kcs.com/login",
            support_email: userData.support_email || "support@kcs-platform.com",
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
        infoLogs(`Welcome email sent to ${email} via Nodemailer`, LogTypes.LOGS, "MAIL:WELCOME:NODEMAILER");
    } catch (error) {
        infoLogs(`Error sending welcome email to ${email}: ${error}`, LogTypes.ERROR, "MAIL:WELCOME:ERROR");
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

export const sendPasswordResetSuccessEmail = async (email: string, resetData: PasswordResetSuccessEmailData) => {
    try {
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "email", "password-reset-success.html"),
            "utf8"
        );

        // Set default values
        const emailData = {
            ...resetData,
            login_url: resetData.login_url || "https://dev.letscatchup-kcs.com/login",
            dashboard_url: resetData.dashboard_url || "https://dev.letscatchup-kcs.com/dashboard",
            profile_url: resetData.profile_url || "https://dev.letscatchup-kcs.com/profile",
            security_url: resetData.security_url || "https://dev.letscatchup-kcs.com/security",
            support_url: resetData.support_url || "mailto:support@omyra.dev",
            security_center_url: resetData.security_center_url || "https://dev.letscatchup-kcs.com/security",
            help_url: resetData.help_url || "https://dev.letscatchup-kcs.com/help",
            website_url: resetData.website_url || "https://omyra.dev",
            logo_url: resetData.logo_url || "https://dev.letscatchup-kcs.com/logo.png",
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

// Meeting Email Interfaces and Functions
export interface MeetingInvitationEmailData {
    participant_name: string;
    meeting_name: string;
    meeting_description?: string;
    meeting_date: string;
    meeting_time: string;
    meeting_duration: string;
    meeting_timezone?: string;
    host_name: string;
    host_email: string;
    host_phone?: string;
    meeting_url: string;
    meeting_id: string;
    meeting_password?: string;
    calendar_url?: string;
    meeting_materials_url?: string;
    agenda?: string;
    participants_count?: number;
    participant_list?: string[];
    dashboard_url?: string;
    support_url?: string;
    website_url?: string;
    logo_url?: string;
    notification_settings_url?: string;
    email: string;
}

export const sendMeetingInvitation = async (email: string, meetingData: MeetingInvitationEmailData) => {
    try {
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "email", "meeting-invitation.html"),
            "utf8"
        );

        // Set default values
        const emailData = {
            ...meetingData,
            meeting_timezone: meetingData.meeting_timezone || "IST",
            calendar_url: meetingData.calendar_url || "https://dev.letscatchup-kcs.com/calendar",
            dashboard_url: meetingData.dashboard_url || "https://dev.letscatchup-kcs.com/dashboard",
            support_url: meetingData.support_url || "mailto:support@omyra.dev",
            website_url: meetingData.website_url || "https://omyra.dev",
            logo_url: meetingData.logo_url || "https://dev.letscatchup-kcs.com/logo.png",
            notification_settings_url: meetingData.notification_settings_url || "https://dev.letscatchup-kcs.com/settings/notifications",
        };

        const html = await renderMailContent(contentTemplate, emailData);

        const mailOptions = {
            from: FROM_EMAIL,
            to: email,
            subject: `Meeting Invitation: ${meetingData.meeting_name} - ${meetingData.meeting_date}`,
            text: `You're invited to join "${meetingData.meeting_name}" on ${meetingData.meeting_date} at ${meetingData.meeting_time}. Join here: ${meetingData.meeting_url}`,
            html,
        };

        await sendEmailWithNodemailer(mailOptions);
        infoLogs(
            `Meeting invitation sent to ${email} for meeting: ${meetingData.meeting_name}`,
            LogTypes.LOGS,
            "MAIL:MEETING_INVITATION:NODEMAILER"
        );
    } catch (error) {
        infoLogs(
            `Error sending meeting invitation to ${email}: ${error}`,
            LogTypes.ERROR,
            "MAIL:MEETING_INVITATION:ERROR"
        );
        throw error;
    }
};

export interface MeetingReminderEmailData {
    participant_name: string;
    meeting_name: string;
    meeting_date: string;
    meeting_time: string;
    meeting_duration: string;
    host_name: string;
    meeting_url: string;
    time_remaining: string;
    time_label: string;
    urgency_class: string;
    urgency_icon: string;
    calendar_url?: string;
    meeting_materials_url?: string;
    device_test_url?: string;
    dashboard_url?: string;
    support_url?: string;
    tech_support_url?: string;
    meeting_help_url?: string;
    website_url?: string;
    logo_url?: string;
    notification_settings_url?: string;
    email: string;
}

export const sendMeetingReminder = async (email: string, reminderData: MeetingReminderEmailData) => {
    try {
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "email", "meeting-reminder.html"),
            "utf8"
        );

        // Set default values
        const emailData = {
            ...reminderData,
            calendar_url: reminderData.calendar_url || "https://dev.letscatchup-kcs.com/calendar",
            dashboard_url: reminderData.dashboard_url || "https://dev.letscatchup-kcs.com/dashboard",
            support_url: reminderData.support_url || "mailto:support@omyra.dev",
            tech_support_url: reminderData.tech_support_url || "mailto:tech-support@omyra.dev",
            meeting_help_url: reminderData.meeting_help_url || "https://dev.letscatchup-kcs.com/help/meetings",
            website_url: reminderData.website_url || "https://omyra.dev",
            logo_url: reminderData.logo_url || "https://dev.letscatchup-kcs.com/logo.png",
            notification_settings_url: reminderData.notification_settings_url || "https://dev.letscatchup-kcs.com/settings/notifications",
            device_test_url: reminderData.device_test_url || "https://dev.letscatchup-kcs.com/device-test",
        };

        const html = await renderMailContent(contentTemplate, emailData);

        const mailOptions = {
            from: FROM_EMAIL,
            to: email,
            subject: `⏰ Meeting Starting Soon: ${reminderData.meeting_name} - ${reminderData.time_remaining}`,
            text: `Reminder: Your meeting "${reminderData.meeting_name}" starts in ${reminderData.time_remaining}. Join here: ${reminderData.meeting_url}`,
            html,
        };

        await sendEmailWithNodemailer(mailOptions);
        infoLogs(
            `Meeting reminder sent to ${email} for meeting: ${reminderData.meeting_name}`,
            LogTypes.LOGS,
            "MAIL:MEETING_REMINDER:NODEMAILER"
        );
    } catch (error) {
        infoLogs(
            `Error sending meeting reminder to ${email}: ${error}`,
            LogTypes.ERROR,
            "MAIL:MEETING_REMINDER:ERROR"
        );
        throw error;
    }
};

export interface MeetingCancellationEmailData {
    participant_name?: string;
    meeting_name: string;
    meeting_date: string;
    meeting_time: string;
    meeting_duration: string;
    host_name: string;
    host_email: string;
    host_phone?: string;
    cancellation_reason?: string;
    cancellation_date: string;
    cancellation_time: string;
    reschedule_available?: boolean;
    reschedule_url?: string;
    calendar_url?: string;
    dashboard_url?: string;
    support_url?: string;
    support_email?: string;
    website_url?: string;
    logo_url?: string;
    notification_settings_url?: string;
    email: string;
}

export const sendMeetingCancellation = async (email: string, cancellationData: MeetingCancellationEmailData) => {
    try {
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "email", "meeting-cancellation.html"),
            "utf8"
        );

        // Set default values
        const emailData = {
            ...cancellationData,
            participant_name: cancellationData.participant_name || "Participant",
            reschedule_available: cancellationData.reschedule_available || false,
            calendar_url: cancellationData.calendar_url || "https://dev.letscatchup-kcs.com/calendar",
            dashboard_url: cancellationData.dashboard_url || "https://dev.letscatchup-kcs.com/dashboard",
            support_url: cancellationData.support_url || "mailto:support@omyra.dev",
            support_email: cancellationData.support_email || "support@omyra.dev",
            website_url: cancellationData.website_url || "https://omyra.dev",
            logo_url: cancellationData.logo_url || "https://dev.letscatchup-kcs.com/logo.png",
            notification_settings_url: cancellationData.notification_settings_url || "https://dev.letscatchup-kcs.com/settings/notifications",
        };

        const html = await renderMailContent(contentTemplate, emailData);

        const mailOptions = {
            from: FROM_EMAIL,
            to: email,
            subject: `❌ Meeting Cancelled: ${cancellationData.meeting_name} - ${cancellationData.meeting_date}`,
            text: `Meeting Cancelled: "${cancellationData.meeting_name}" scheduled for ${cancellationData.meeting_date} at ${cancellationData.meeting_time} has been cancelled.`,
            html,
        };

        await sendEmailWithNodemailer(mailOptions);
        infoLogs(
            `Meeting cancellation notification sent to ${email} for meeting: ${cancellationData.meeting_name}`,
            LogTypes.LOGS,
            "MAIL:MEETING_CANCELLATION:NODEMAILER"
        );
    } catch (error) {
        infoLogs(
            `Error sending meeting cancellation to ${email}: ${error}`,
            LogTypes.ERROR,
            "MAIL:MEETING_CANCELLATION:ERROR"
        );
        throw error;
    }
};

export interface MeetingUpdateEmailData {
    participant_name?: string;
    meeting_name: string;
    old_meeting_date?: string;
    old_meeting_time?: string;
    new_meeting_date: string;
    new_meeting_time: string;
    meeting_duration: string;
    host_name: string;
    meeting_url: string;
    update_reason?: string;
    changes_summary: string[];
    calendar_url?: string;
    dashboard_url?: string;
    support_url?: string;
    website_url?: string;
    logo_url?: string;
    notification_settings_url?: string;
    email: string;
}

export const sendMeetingUpdate = async (email: string, updateData: MeetingUpdateEmailData) => {
    try {
        // For now, we'll use the invitation template for updates
        // You can create a specific meeting-update.html template later
        const contentTemplate = await fs.readFile(
            path.join(__dirname, "templates", "email", "meeting-invitation.html"),
            "utf8"
        );

        // Set default values
        const emailData = {
            participant_name: updateData.participant_name || "Participant",
            meeting_name: updateData.meeting_name,
            meeting_date: updateData.new_meeting_date,
            meeting_time: updateData.new_meeting_time,
            meeting_duration: updateData.meeting_duration,
            host_name: updateData.host_name,
            meeting_url: updateData.meeting_url,
            calendar_url: updateData.calendar_url || "https://dev.letscatchup-kcs.com/calendar",
            dashboard_url: updateData.dashboard_url || "https://dev.letscatchup-kcs.com/dashboard",
            support_url: updateData.support_url || "mailto:support@omyra.dev",
            website_url: updateData.website_url || "https://omyra.dev",
            logo_url: updateData.logo_url || "https://dev.letscatchup-kcs.com/logo.png",
            notification_settings_url: updateData.notification_settings_url || "https://dev.letscatchup-kcs.com/settings/notifications",
            email: updateData.email,
        };

        const html = await renderMailContent(contentTemplate, emailData);

        const mailOptions = {
            from: FROM_EMAIL,
            to: email,
            subject: `📅 Meeting Updated: ${updateData.meeting_name} - New Time: ${updateData.new_meeting_date}`,
            text: `Meeting Update: "${updateData.meeting_name}" has been rescheduled to ${updateData.new_meeting_date} at ${updateData.new_meeting_time}. Join here: ${updateData.meeting_url}`,
            html,
        };

        await sendEmailWithNodemailer(mailOptions);
        infoLogs(
            `Meeting update notification sent to ${email} for meeting: ${updateData.meeting_name}`,
            LogTypes.LOGS,
            "MAIL:MEETING_UPDATE:NODEMAILER"
        );
    } catch (error) {
        infoLogs(
            `Error sending meeting update to ${email}: ${error}`,
            LogTypes.ERROR,
            "MAIL:MEETING_UPDATE:ERROR"
        );
        throw error;
    }
};
