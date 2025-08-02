/**
 * Email Test Script
 * 
 * This script demonstrates how to test the email functionality.
 * Run this in your development environment to verify email setup.
 */

import { sendWelcomeEmail } from "@/libs/mailer";
import { sendEmailWithNodemailer } from "@/libs/mailer/nodemailer.config";

// Test welcome email
async function testWelcomeEmail() {
    try {
        console.log("Testing welcome email...");
        
        await sendWelcomeEmail("test@example.com", {
            first_name: "John",
            last_name: "Doe",
            email: "test@example.com", 
            user_type: "Student",
            user_id: "TEST123456",
            campus_name: "Test Campus"
        });
        
        console.log("✅ Welcome email sent successfully!");
    } catch (error) {
        console.error("❌ Welcome email failed:", error);
    }
}

// Test nodemailer directly
async function testNodemailer() {
    try {
        console.log("Testing nodemailer directly...");
        
        await sendEmailWithNodemailer({
            to: "test@example.com",
            subject: "Test Email from KCS",
            text: "This is a test email from the KCS platform.",
            html: `
                <h2>Test Email</h2>
                <p>This is a test email from the KCS platform.</p>
                <p>If you receive this, your email configuration is working correctly!</p>
            `
        });
        
        console.log("✅ Nodemailer test email sent successfully!");
    } catch (error) {
        console.error("❌ Nodemailer test failed:", error);
    }
}

// Run tests
async function runEmailTests() {
    console.log("🚀 Starting email tests...\n");
    
    // Test 1: Welcome Email
    await testWelcomeEmail();
    console.log("");
    
    // Test 2: Direct Nodemailer
    await testNodemailer();
    console.log("");
    
    console.log("📧 Email tests completed!");
}

// Export for manual testing
export { runEmailTests, testNodemailer, testWelcomeEmail };

// Uncomment to run when this file is executed directly
// runEmailTests().catch(console.error);
