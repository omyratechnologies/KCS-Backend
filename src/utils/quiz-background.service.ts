import { ClassQuizService } from "@/services/class_quiz.service";

/**
 * Background service for handling quiz session timeouts and maintenance tasks
 */
export class QuizBackgroundService {
    private static intervalId: NodeJS.Timeout | null = null;

    /**
     * Start the background service to check for expired sessions
     * @param intervalMinutes - How often to check (in minutes), default 1 minute
     */
    public static start(intervalMinutes: number = 1): void {
        if (this.intervalId) {
            console.log("Quiz background service is already running");
            return;
        }

        const intervalMs = intervalMinutes * 60 * 1000;

        console.log(
            `Starting quiz background service - checking every ${intervalMinutes} minute(s)`
        );

        // Run immediately on start
        this.checkExpiredSessions();

        // Set up recurring checks
        this.intervalId = setInterval(() => {
            this.checkExpiredSessions();
        }, intervalMs);
    }

    /**
     * Stop the background service
     */
    public static stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log("Quiz background service stopped");
        }
    }

    /**
     * Check and handle expired sessions
     */
    private static async checkExpiredSessions(): Promise<void> {
        try {
            const results =
                await ClassQuizService.checkAndHandleExpiredSessions();

            if (results.length > 0) {
                console.log(
                    `[${new Date().toISOString()}] Auto-submitted ${results.length} expired quiz sessions`
                );

                // Log each auto-submission for audit purposes
                for (const result of results) {
                    console.log(
                        `  - User ${result.user_id}: Quiz ${result.quiz_id}, Score: ${result.result.score}/${result.result.total_questions}`
                    );
                }
            }
        } catch (error) {
            console.error(
                "[Quiz Background Service] Error checking expired sessions:",
                error
            );
        }
    }

    /**
     * Manual trigger for checking expired sessions
     */
    public static async manualCheck(): Promise<void> {
        console.log("Manual check for expired sessions triggered");
        await this.checkExpiredSessions();
    }

    /**
     * Get service status
     */
    public static getStatus(): {
        running: boolean;
        intervalId: NodeJS.Timeout | null;
    } {
        return {
            running: this.intervalId !== null,
            intervalId: this.intervalId,
        };
    }
}

/**
 * Quiz timeout constants and utilities
 */
export const QUIZ_TIMEOUT_CONFIG = {
    // Default check interval (1 minute)
    DEFAULT_CHECK_INTERVAL_MINUTES: 1,

    // Grace period after timeout before auto-submission (30 seconds)
    TIMEOUT_GRACE_PERIOD_SECONDS: 30,

    // Maximum time a session can be inactive before being considered abandoned (30 minutes)
    MAX_INACTIVE_MINUTES: 30,
};

/**
 * Utility functions for quiz timing
 */
export class QuizTimeUtils {
    /**
     * Check if a session is expired
     */
    public static isSessionExpired(expiresAt: Date | null): boolean {
        if (!expiresAt) {return false;}
        return new Date() > new Date(expiresAt);
    }

    /**
     * Calculate remaining time in seconds
     */
    public static getRemainingTimeSeconds(expiresAt: Date | null): number {
        if (!expiresAt) {return -1;} // No time limit

        const now = new Date();
        const expires = new Date(expiresAt);
        const remainingMs = expires.getTime() - now.getTime();

        return Math.max(0, Math.floor(remainingMs / 1000));
    }

    /**
     * Check if a session should be considered abandoned due to inactivity
     */
    public static isSessionAbandoned(lastActivityAt: Date): boolean {
        const now = new Date();
        const lastActivity = new Date(lastActivityAt);
        const inactiveMs = now.getTime() - lastActivity.getTime();
        const maxInactiveMs =
            QUIZ_TIMEOUT_CONFIG.MAX_INACTIVE_MINUTES * 60 * 1000;

        return inactiveMs > maxInactiveMs;
    }

    /**
     * Format time remaining for display
     */
    public static formatTimeRemaining(seconds: number): string {
        if (seconds < 0) {return "No time limit";}

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return hours > 0
            ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
            : `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
}
