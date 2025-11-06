import { ReminderService } from "./reminder.service";
import log, { LogTypes } from "@/libs/logger";

export class ReminderScheduler {
    private static intervalId: NodeJS.Timeout | null = null;
    private static isRunning = false;

    /**
     * Start the reminder scheduler
     * Checks for pending reminders every minute
     */
    public static start(): void {
        if (this.isRunning) {
            log("Reminder scheduler is already running", LogTypes.LOGS, "ReminderScheduler");
            return;
        }

        log("Starting reminder scheduler...", LogTypes.LOGS, "ReminderScheduler");

        // Run immediately on start
        this.checkAndProcessReminders();

        // Then run every minute
        this.intervalId = setInterval(() => {
            this.checkAndProcessReminders();
        }, 60 * 1000); // 1 minute

        this.isRunning = true;
        log("✅ Reminder scheduler started successfully", LogTypes.LOGS, "ReminderScheduler");
    }

    /**
     * Stop the reminder scheduler
     */
    public static stop(): void {
        if (!this.isRunning) {
            log("Reminder scheduler is not running", LogTypes.LOGS, "ReminderScheduler");
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        log("Reminder scheduler stopped", LogTypes.LOGS, "ReminderScheduler");
    }

    /**
     * Check if scheduler is running
     */
    public static isSchedulerRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Check and process pending reminders
     */
    private static async checkAndProcessReminders(): Promise<void> {
        try {
            const currentTime = new Date();
            log(
                `[${currentTime.toISOString()}] Checking for pending reminders...`,
                LogTypes.LOGS,
                "ReminderScheduler"
            );

            const result = await ReminderService.processPendingReminders();

            if (result.processed > 0) {
                log(
                    `Processed ${result.processed} reminders - Successful: ${result.successful}, Failed: ${result.failed}`,
                    LogTypes.LOGS,
                    "ReminderScheduler"
                );
            }
        } catch (error) {
            log(
                `Error in reminder scheduler: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "ReminderScheduler"
            );
        }
    }

    /**
     * Manually trigger reminder processing (for testing/admin use)
     */
    public static async triggerManualCheck(): Promise<{
        processed: number;
        successful: number;
        failed: number;
    }> {
        log("Manual reminder check triggered", LogTypes.LOGS, "ReminderScheduler");
        return await ReminderService.processPendingReminders();
    }
}
