export interface PaymentAnalytics {
    overview: {
        total_revenue: number;
        pending_amount: number;
        overdue_amount: number;
        collection_rate: number;
        total_transactions: number;
        failed_transactions: number;
        success_rate: number;
    };
    monthly_trends: Array<{
        month: string;
        revenue: number;
        transactions: number;
        collection_rate: number;
    }>;
    fee_category_breakdown: Array<{
        category_name: string;
        total_amount: number;
        collected_amount: number;
        pending_amount: number;
        percentage: number;
    }>;
    payment_method_stats: Array<{
        method: string;
        count: number;
        amount: number;
        percentage: number;
    }>;
    class_wise_collection: Array<{
        class_name: string;
        total_students: number;
        paid_students: number;
        pending_students: number;
        collection_percentage: number;
        amount_collected: number;
        amount_pending: number;
    }>;
    overdue_analysis: {
        total_overdue_fees: number;
        total_overdue_amount: number;
        average_overdue_days: number;
        overdue_by_class: Array<{
            class_name: string;
            overdue_count: number;
            overdue_amount: number;
        }>;
    };
    recent_transactions: Array<{
        id: string;
        student_name: string;
        amount: number;
        status: string;
        payment_method: string;
        date: Date;
    }>;
}

export interface PaymentReport {
    report_type: "daily" | "weekly" | "monthly" | "custom";
    date_range: {
        start_date: Date;
        end_date: Date;
    };
    summary: {
        total_collections: number;
        total_transactions: number;
        average_transaction_amount: number;
        success_rate: number;
    };
    detailed_transactions: Array<{
        transaction_id: string;
        student_name: string;
        class_name: string;
        fee_category: string;
        amount: number;
        status: string;
        payment_method: string;
        gateway: string;
        date: Date;
    }>;
    charts_data: {
        daily_collections: Array<{ date: string; amount: number }>;
        payment_methods: Array<{
            method: string;
            count: number;
            amount: number;
        }>;
        fee_categories: Array<{ category: string; amount: number }>;
    };
}

export class PaymentAnalyticsService {
    /**
     * Get comprehensive payment analytics for dashboard
     */
    static async getPaymentAnalytics(
        campus_id: string,
        date_range?: { start_date: Date; end_date: Date }
    ): Promise<PaymentAnalytics> {
        try {
            const { Fee } = await import("@/models/fee.model");
            const { PaymentTransaction } = await import("@/models/payment_transaction.model");
            const { FeeCategory } = await import("@/models/fee_category.model");
            const { UserService } = await import("@/services/users.service");
            const { Class } = await import("@/models/class.model");

            const defaultDateRange = {
                start_date: new Date(new Date().getFullYear(), 0, 1), // Start of current year
                end_date: new Date(),
            };

            const range = date_range || defaultDateRange;

            // Get all fees for the campus
            const allFees = await Fee.find({ campus_id });
            const fees = allFees.rows || [];

            // Get all transactions for the period
            const allTransactions = await PaymentTransaction.find({
                campus_id,
                initiated_at: {
                    $gte: range.start_date,
                    $lte: range.end_date,
                },
            });
            const transactions = allTransactions.rows || [];

            // Calculate overview metrics
            const overview = await this.calculateOverview(fees, transactions);

            // Calculate monthly trends
            const monthlyTrends = await this.calculateMonthlyTrends(campus_id, range);

            // Calculate fee category breakdown
            const feeCategoryBreakdown = await this.calculateFeeCategoryBreakdown(campus_id, fees);

            // Calculate payment method stats
            const paymentMethodStats = await this.calculatePaymentMethodStats(transactions);

            // Calculate class-wise collection
            const classWiseCollection = await this.calculateClassWiseCollection(campus_id, fees);

            // Calculate overdue analysis
            const overdueAnalysis = await this.calculateOverdueAnalysis(campus_id, fees);

            // Get recent transactions
            const recentTransactions = await this.getRecentTransactions(campus_id, 10);

            return {
                overview,
                monthly_trends: monthlyTrends,
                fee_category_breakdown: feeCategoryBreakdown,
                payment_method_stats: paymentMethodStats,
                class_wise_collection: classWiseCollection,
                overdue_analysis: overdueAnalysis,
                recent_transactions: recentTransactions,
            };
        } catch (error) {
            throw new Error(`Failed to get payment analytics: ${error}`);
        }
    }

    /**
     * Generate detailed payment report
     */
    static async generatePaymentReport(
        campus_id: string,
        report_type: "daily" | "weekly" | "monthly" | "custom",
        date_range?: { start_date: Date; end_date: Date }
    ): Promise<PaymentReport> {
        try {
            // Calculate date range based on report type
            const range = this.getDateRangeForReportType(report_type, date_range);

            // Get transactions for the period
            const { PaymentTransaction } = await import("@/models/payment_transaction.model");
            const allTransactions = await PaymentTransaction.find({
                campus_id,
                initiated_at: {
                    $gte: range.start_date,
                    $lte: range.end_date,
                },
            });
            const transactions = allTransactions.rows || [];

            // Calculate summary
            const summary = this.calculateReportSummary(transactions);

            // Get detailed transactions with student and fee info
            const detailedTransactions = await this.getDetailedTransactions(campus_id, transactions);

            // Generate charts data
            const chartsData = await this.generateChartsData(campus_id, transactions, range);

            return {
                report_type,
                date_range: range,
                summary,
                detailed_transactions: detailedTransactions,
                charts_data: chartsData,
            };
        } catch (error) {
            throw new Error(`Failed to generate payment report: ${error}`);
        }
    }

    /**
     * Get payment trends for specific period
     */
    static async getPaymentTrends(
        campus_id: string,
        period: "7d" | "30d" | "90d" | "1y"
    ): Promise<Array<{ date: string; amount: number; transactions: number }>> {
        try {
            const { PaymentTransaction } = await import("@/models/payment_transaction.model");

            const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const transactions = await PaymentTransaction.find({
                campus_id,
                status: "success",
                completed_at: {
                    $gte: startDate,
                    $lte: new Date(),
                },
            });

            // Group by date
            const trendsMap = new Map<string, { amount: number; transactions: number }>();

            for (const transaction of transactions.rows || []) {
                const date = transaction.completed_at?.toISOString().split("T")[0] || "";
                const existing = trendsMap.get(date) || {
                    amount: 0,
                    transactions: 0,
                };
                trendsMap.set(date, {
                    amount: existing.amount + transaction.amount,
                    transactions: existing.transactions + 1,
                });
            }

            // Convert to array and sort by date
            return [...trendsMap.entries()]
                .map(([date, data]) => ({
                    date,
                    amount: data.amount,
                    transactions: data.transactions,
                }))
                .sort((a, b) => a.date.localeCompare(b.date));
        } catch (error) {
            throw new Error(`Failed to get payment trends: ${error}`);
        }
    }

    /**
     * Get top paying students
     */
    static async getTopPayingStudents(
        campus_id: string,
        limit: number = 10
    ): Promise<
        Array<{
            student_id: string;
            student_name: string;
            class_name: string;
            total_paid: number;
            transaction_count: number;
        }>
    > {
        try {
            const { Fee } = await import("@/models/fee.model");
            const { UserService } = await import("@/services/users.service");
            const { Class } = await import("@/models/class.model");

            const fees = await Fee.find({
                campus_id,
                payment_status: "paid",
            });

            // Group by student and calculate totals
            const studentPayments = new Map<string, { total_paid: number; transaction_count: number }>();

            for (const fee of fees.rows || []) {
                const existing = studentPayments.get(fee.user_id) || {
                    total_paid: 0,
                    transaction_count: 0,
                };
                studentPayments.set(fee.user_id, {
                    total_paid: existing.total_paid + fee.paid_amount,
                    transaction_count: existing.transaction_count + 1,
                });
            }

            // Get student details and sort by total paid
            const topStudents: Array<{
                student_id: string;
                student_name: string;
                class_name: string;
                total_paid: number;
                transaction_count: number;
            }> = [];

            for (const [student_id, payment_data] of studentPayments.entries()) {
                try {
                    const student = await UserService.getUser(student_id);

                    // Get student's class - need to find which class this student belongs to
                    const { Class } = await import("@/models/class.model");
                    const classesResult = await Class.find({ campus_id });
                    const studentClass = (classesResult.rows || []).find(
                        (cls) => cls.student_ids && cls.student_ids.includes(student_id)
                    );

                    topStudents.push({
                        student_id,
                        student_name: `${student.first_name} ${student.last_name}`,
                        class_name: studentClass?.name || "Unknown",
                        total_paid: payment_data.total_paid,
                        transaction_count: payment_data.transaction_count,
                    });
                } catch {
                    // Skip if student data not found
                    console.warn(`Student data not found for ID: ${student_id}`);
                }
            }

            return topStudents.sort((a, b) => b.total_paid - a.total_paid).slice(0, limit);
        } catch (error) {
            throw new Error(`Failed to get top paying students: ${error}`);
        }
    }

    // ========================= HELPER METHODS =========================

    private static async calculateOverview(fees: any[], transactions: any[]): Promise<any> {
        const totalRevenue = transactions.filter((t) => t.status === "success").reduce((sum, t) => sum + t.amount, 0);

        const pendingAmount = fees
            .filter((f) => f.payment_status === "unpaid")
            .reduce((sum, f) => sum + f.due_amount, 0);

        const overdueAmount = fees
            .filter((f) => f.payment_status === "overdue")
            .reduce((sum, f) => sum + f.due_amount, 0);

        const totalFeeAmount = fees.reduce((sum, f) => sum + f.total_amount, 0);
        const collectionRate = totalFeeAmount > 0 ? (totalRevenue / totalFeeAmount) * 100 : 0;

        const failedTransactions = transactions.filter((t) => t.status === "failed").length;
        const successRate =
            transactions.length > 0 ? ((transactions.length - failedTransactions) / transactions.length) * 100 : 0;

        return {
            total_revenue: totalRevenue,
            pending_amount: pendingAmount,
            overdue_amount: overdueAmount,
            collection_rate: Math.round(collectionRate * 100) / 100,
            total_transactions: transactions.length,
            failed_transactions: failedTransactions,
            success_rate: Math.round(successRate * 100) / 100,
        };
    }

    private static async calculateMonthlyTrends(campus_id: string, range: any): Promise<any[]> {
        try {
            const { PaymentTransaction } = await import("@/models/payment_transaction.model");

            const trends: Array<{
                month: string;
                revenue: number;
                transactions: number;
                collection_rate: number;
            }> = [];

            const currentDate = new Date(range.start_date);

            while (currentDate <= range.end_date) {
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

                const monthTransactions = await PaymentTransaction.find({
                    campus_id,
                    status: "success",
                    completed_at: {
                        $gte: monthStart,
                        $lte: monthEnd,
                    },
                });

                const revenue = (monthTransactions.rows || []).reduce((sum, t) => sum + t.amount, 0);
                const transactionCount = monthTransactions.rows?.length || 0;

                trends.push({
                    month: monthStart.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                    }),
                    revenue,
                    transactions: transactionCount,
                    collection_rate: 0, // Calculate based on fees if needed
                });

                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            return trends;
        } catch (error) {
            console.error("Error calculating monthly trends:", error);
            return [];
        }
    }

    private static async calculateFeeCategoryBreakdown(campus_id: string, fees: any[]): Promise<any[]> {
        try {
            const { FeeCategory } = await import("@/models/fee_category.model");

            const categories = await FeeCategory.find({ campus_id });
            const breakdown: Array<{
                category_name: string;
                total_amount: number;
                collected_amount: number;
                pending_amount: number;
                percentage: number;
            }> = [];

            for (const category of categories.rows || []) {
                let totalAmount = 0;
                let collectedAmount = 0;

                for (const fee of fees) {
                    const categoryItems = fee.items?.filter((item: any) => item.category_id === category.id) || [];
                    for (const item of categoryItems) {
                        totalAmount += item.amount;
                        if (fee.payment_status === "paid") {
                            collectedAmount += item.amount;
                        }
                    }
                }

                const pendingAmount = totalAmount - collectedAmount;
                const percentage = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;

                breakdown.push({
                    category_name: category.name,
                    total_amount: totalAmount,
                    collected_amount: collectedAmount,
                    pending_amount: pendingAmount,
                    percentage: Math.round(percentage * 100) / 100,
                });
            }

            return breakdown;
        } catch (error) {
            console.error("Error calculating fee category breakdown:", error);
            return [];
        }
    }

    private static calculatePaymentMethodStats(transactions: any[]): any[] {
        const methodStats = new Map<string, { count: number; amount: number }>();

        for (const transaction of transactions) {
            if (transaction.status === "success") {
                const method = transaction.payment_method || "Unknown";
                const existing = methodStats.get(method) || {
                    count: 0,
                    amount: 0,
                };
                methodStats.set(method, {
                    count: existing.count + 1,
                    amount: existing.amount + transaction.amount,
                });
            }
        }

        const totalAmount = [...methodStats.values()].reduce((sum, stat) => sum + stat.amount, 0);

        return [...methodStats.entries()].map(([method, stats]) => ({
            method,
            count: stats.count,
            amount: stats.amount,
            percentage: totalAmount > 0 ? Math.round((stats.amount / totalAmount) * 10_000) / 100 : 0,
        }));
    }

    private static async calculateClassWiseCollection(campus_id: string, fees: any[]): Promise<any[]> {
        try {
            const { Class } = await import("@/models/class.model");

            const classes = await Class.find({ campus_id });
            const collection: Array<{
                class_name: string;
                total_students: number;
                paid_students: number;
                pending_students: number;
                collection_percentage: number;
                amount_collected: number;
                amount_pending: number;
            }> = [];

            for (const classData of classes.rows || []) {
                const classFees = fees.filter((f) => f.class_id === classData.id);

                const totalStudents = classData.student_ids?.length || 0;
                const paidStudents = classFees.filter((f) => f.payment_status === "paid").length;
                const pendingStudents = totalStudents - paidStudents;

                const amountCollected = classFees
                    .filter((f) => f.payment_status === "paid")
                    .reduce((sum, f) => sum + f.paid_amount, 0);

                const amountPending = classFees
                    .filter((f) => f.payment_status !== "paid")
                    .reduce((sum, f) => sum + f.due_amount, 0);

                const collectionPercentage = totalStudents > 0 ? (paidStudents / totalStudents) * 100 : 0;

                collection.push({
                    class_name: classData.name,
                    total_students: totalStudents,
                    paid_students: paidStudents,
                    pending_students: pendingStudents,
                    collection_percentage: Math.round(collectionPercentage * 100) / 100,
                    amount_collected: amountCollected,
                    amount_pending: amountPending,
                });
            }

            return collection;
        } catch (error) {
            console.error("Error calculating class-wise collection:", error);
            return [];
        }
    }

    private static async calculateOverdueAnalysis(campus_id: string, fees: any[]): Promise<any> {
        const overdueFees = fees.filter((f) => f.payment_status === "overdue");

        const totalOverdueFees = overdueFees.length;
        const totalOverdueAmount = overdueFees.reduce((sum, f) => sum + f.due_amount, 0);

        // Calculate average overdue days
        const today = new Date();
        let totalOverdueDays = 0;

        for (const fee of overdueFees) {
            const dueDate = new Date(fee.items[0]?.due_date || today);
            const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            totalOverdueDays += Math.max(0, daysDiff);
        }

        const averageOverdueDays = totalOverdueFees > 0 ? totalOverdueDays / totalOverdueFees : 0;

        // Group overdue by class
        const overdueByClass = new Map<string, { count: number; amount: number }>();

        for (const fee of overdueFees) {
            const existing = overdueByClass.get(fee.class_id) || {
                count: 0,
                amount: 0,
            };
            overdueByClass.set(fee.class_id, {
                count: existing.count + 1,
                amount: existing.amount + fee.due_amount,
            });
        }

        const overdueByClassArray = [...overdueByClass.entries()].map(([classId, data]) => ({
            class_name: classId, // You might want to resolve class name
            overdue_count: data.count,
            overdue_amount: data.amount,
        }));

        return {
            total_overdue_fees: totalOverdueFees,
            total_overdue_amount: totalOverdueAmount,
            average_overdue_days: Math.round(averageOverdueDays * 100) / 100,
            overdue_by_class: overdueByClassArray,
        };
    }

    private static async getRecentTransactions(campus_id: string, limit: number): Promise<any[]> {
        try {
            const { PaymentTransaction } = await import("@/models/payment_transaction.model");
            const { UserService } = await import("@/services/users.service");

            const transactions = await PaymentTransaction.find(
                { campus_id },
                {
                    sort: { initiated_at: "DESC" },
                    limit,
                }
            );

            const recentTransactions: Array<{
                id: string;
                student_name: string;
                amount: number;
                status: string;
                payment_method: string;
                date: Date;
            }> = [];

            for (const transaction of transactions.rows || []) {
                try {
                    const student = await UserService.getUser(transaction.student_id);
                    recentTransactions.push({
                        id: transaction.id,
                        student_name: `${student.first_name} ${student.last_name}`,
                        amount: transaction.amount,
                        status: transaction.status,
                        payment_method: transaction.payment_method || "Unknown",
                        date: transaction.initiated_at,
                    });
                } catch {
                    // Skip if student not found
                    console.warn(`Student not found for transaction: ${transaction.id}`);
                }
            }

            return recentTransactions;
        } catch (error) {
            console.error("Error getting recent transactions:", error);
            return [];
        }
    }

    private static getDateRangeForReportType(
        type: "daily" | "weekly" | "monthly" | "custom",
        customRange?: { start_date: Date; end_date: Date }
    ): { start_date: Date; end_date: Date } {
        const today = new Date();

        switch (type) {
            case "daily": {
                return {
                    start_date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    end_date: today,
                };
            }
            case "weekly": {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - 7);
                return {
                    start_date: weekStart,
                    end_date: today,
                };
            }
            case "monthly": {
                return {
                    start_date: new Date(today.getFullYear(), today.getMonth(), 1),
                    end_date: today,
                };
            }
            case "custom": {
                return customRange || { start_date: today, end_date: today };
            }
            default: {
                return { start_date: today, end_date: today };
            }
        }
    }

    private static calculateReportSummary(transactions: any[]): any {
        const successfulTransactions = transactions.filter((t) => t.status === "success");
        const totalCollections = successfulTransactions.reduce((sum, t) => sum + t.amount, 0);
        const averageAmount = successfulTransactions.length > 0 ? totalCollections / successfulTransactions.length : 0;
        const successRate = transactions.length > 0 ? (successfulTransactions.length / transactions.length) * 100 : 0;

        return {
            total_collections: totalCollections,
            total_transactions: transactions.length,
            average_transaction_amount: Math.round(averageAmount * 100) / 100,
            success_rate: Math.round(successRate * 100) / 100,
        };
    }

    private static async getDetailedTransactions(campus_id: string, transactions: any[]): Promise<any[]> {
        const detailed: Array<{
            transaction_id: string;
            student_name: string;
            class_name: string;
            fee_category: string;
            amount: number;
            status: string;
            payment_method: string;
            gateway: string;
            date: Date;
        }> = [];

        for (const transaction of transactions) {
            try {
                const { UserService } = await import("@/services/users.service");
                const { Fee } = await import("@/models/fee.model");
                const { Class } = await import("@/models/class.model");

                const student = await UserService.getUser(transaction.student_id);
                const fee = await Fee.findById(transaction.fee_id);
                const classData = await Class.findById(fee?.class_id || "");

                detailed.push({
                    transaction_id: transaction.id,
                    student_name: `${student.first_name} ${student.last_name}`,
                    class_name: classData?.name || "Unknown",
                    fee_category: fee?.items[0]?.name || "Unknown",
                    amount: transaction.amount,
                    status: transaction.status,
                    payment_method: transaction.payment_method || "Unknown",
                    gateway: transaction.payment_gateway,
                    date: transaction.initiated_at,
                });
            } catch {
                // Skip if data not found
                console.warn(`Error getting details for transaction: ${transaction.id}`);
            }
        }

        return detailed;
    }

    private static async generateChartsData(campus_id: string, transactions: any[], range: any): Promise<any> {
        // Daily collections chart
        const dailyCollections = new Map<string, number>();

        for (const transaction of transactions.filter((t) => t.status === "success")) {
            const date = transaction.completed_at?.toISOString().split("T")[0] || "";
            dailyCollections.set(date, (dailyCollections.get(date) || 0) + transaction.amount);
        }

        const dailyCollectionsArray = [...dailyCollections.entries()]
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Payment methods chart
        const paymentMethods = this.calculatePaymentMethodStats(transactions);

        // Fee categories chart (simplified)
        const feeCategories = [
            { category: "Tuition", amount: 0 },
            { category: "Transport", amount: 0 },
            { category: "Activity", amount: 0 },
            { category: "Other", amount: 0 },
        ];

        return {
            daily_collections: dailyCollectionsArray,
            payment_methods: paymentMethods,
            fee_categories: feeCategories,
        };
    }
}
