import { Hono } from "hono";

import { PaymentController } from "@/controllers/payment.controller";

const paymentRoutes = new Hono();

// ========================= SCHOOL BANK DETAILS =========================
paymentRoutes.post(
    "/school-bank-details",
    PaymentController.createOrUpdateBankDetails
);
paymentRoutes.get("/school-bank-details", PaymentController.getBankDetails);

// ========================= FEE CATEGORIES =========================
paymentRoutes.post("/fee-categories", PaymentController.createFeeCategory);
paymentRoutes.get("/fee-categories", PaymentController.getFeeCategories);
paymentRoutes.put("/fee-categories/:id", PaymentController.updateFeeCategory);

// ========================= FEE TEMPLATES =========================
paymentRoutes.post("/fee-templates", PaymentController.createFeeTemplate);
paymentRoutes.get("/fee-templates", PaymentController.getFeeTemplates);
paymentRoutes.post(
    "/fee-templates/:template_id/generate",
    PaymentController.generateFeesFromTemplate
);

// ========================= PAYMENT PROCESSING =========================
paymentRoutes.post("/initiate-payment", PaymentController.initiatePayment);
paymentRoutes.post(
    "/verify-payment/:transaction_id",
    PaymentController.verifyPayment
);
paymentRoutes.get("/payment-history", PaymentController.getPaymentHistory);
paymentRoutes.get("/student-fees", PaymentController.getStudentFees);
paymentRoutes.get(
    "/available-gateways",
    PaymentController.getAvailableGateways
);
paymentRoutes.get(
    "/invoices/:invoice_id/download",
    PaymentController.downloadInvoice
);

// ========================= SECURE CREDENTIAL MANAGEMENT =========================
paymentRoutes.post(
    "/secure-credentials",
    PaymentController.configureSecureCredentials
);
paymentRoutes.post(
    "/test-gateway/:gateway",
    PaymentController.testGatewayConfiguration
);
paymentRoutes.put("/toggle-gateway/:gateway", PaymentController.toggleGateway);
paymentRoutes.get(
    "/credentials/masked",
    PaymentController.getMaskedCredentials
);
paymentRoutes.post(
    "/migrate-credentials",
    PaymentController.migrateLegacyCredentials
);
paymentRoutes.get("/security-status", PaymentController.getSecurityStatus);
paymentRoutes.post("/rotate-encryption", PaymentController.rotateEncryption);
paymentRoutes.get("/validate-encryption", PaymentController.validateEncryption);

// ========================= PAYMENT NOTIFICATIONS =========================
paymentRoutes.post(
    "/bulk-reminders",
    PaymentController.sendBulkPaymentReminders
);
paymentRoutes.post("/reminder/:fee_id", PaymentController.sendPaymentReminder);
paymentRoutes.post(
    "/schedule-reminders",
    PaymentController.schedulePaymentReminders
);

// ========================= PAYMENT ANALYTICS =========================
paymentRoutes.get("/analytics", PaymentController.getPaymentAnalytics);
paymentRoutes.get("/reports", PaymentController.generatePaymentReport);
paymentRoutes.get("/trends", PaymentController.getPaymentTrends);
paymentRoutes.get("/top-students", PaymentController.getTopPayingStudents);

// ========================= DISCOUNT MANAGEMENT =========================
paymentRoutes.post("/discounts/rules", PaymentController.createDiscountRule);
paymentRoutes.get("/discounts/rules", PaymentController.getDiscountRules);
paymentRoutes.get(
    "/discounts/eligibility/:fee_id/:student_id",
    PaymentController.checkDiscountEligibility
);
paymentRoutes.post("/discounts/apply", PaymentController.applyDiscount);
paymentRoutes.get("/discounts/summary", PaymentController.getDiscountSummary);

// ========================= BULK OPERATIONS =========================
paymentRoutes.post("/bulk/generate-fees", PaymentController.generateBulkFees);
paymentRoutes.post(
    "/bulk/process-payments",
    PaymentController.processBulkPayments
);
paymentRoutes.post("/bulk/update-fees", PaymentController.updateBulkFees);

export { paymentRoutes };
