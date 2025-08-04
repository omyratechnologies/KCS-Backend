/**
 * Meeting error monitoring and logging
 */
export class MeetingErrorMonitor {
    private static errorCounts = new Map<string, number>();
    private static lastErrors = new Map<string, Date>();
    
    /**
     * Log and monitor meeting errors
     */
    public static logError(operation: string, error: Error, context?: any): void {
        const errorKey = `${operation}:${error.name}`;
        const currentCount = this.errorCounts.get(errorKey) || 0;
        
        this.errorCounts.set(errorKey, currentCount + 1);
        this.lastErrors.set(errorKey, new Date());
        
        // Enhanced error logging
        console.error(`[MEETING_ERROR] ${operation}:`, {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            context,
            count: currentCount + 1,
            timestamp: new Date().toISOString(),
        });
        
        // Alert on high error rates
        if (currentCount > 10) {
            this.sendAlert(operation, error, currentCount);
        }
    }
    
    /**
     * Get error statistics
     */
    public static getErrorStats(): {
        totalErrors: number;
        errorsByType: Record<string, number>;
        recentErrors: Record<string, Date>;
    } {
        const totalErrors = [...this.errorCounts.values()].reduce((sum, count) => sum + count, 0);
        const errorsByType = Object.fromEntries(this.errorCounts);
        const recentErrors = Object.fromEntries(this.lastErrors);
        
        return {
            totalErrors,
            errorsByType,
            recentErrors,
        };
    }
    
    /**
     * Send alert for critical errors
     */
    private static sendAlert(operation: string, error: Error, count: number): void {
        // In production, integrate with alerting system (e.g., Slack, PagerDuty)
        console.warn(`[MEETING_ALERT] High error rate detected: ${operation} - ${count} errors`);
    }
    
    /**
     * Clear old error stats (call periodically)
     */
    public static cleanup(): void {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        for (const [key, lastError] of this.lastErrors.entries()) {
            if (lastError < oneHourAgo) {
                this.errorCounts.delete(key);
                this.lastErrors.delete(key);
            }
        }
    }
}
