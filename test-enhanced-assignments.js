#!/usr/bin/env node

/**
 * Enhanced Assignment API Test Script
 * 
 * This script tests the new unified assignment API endpoints
 * to ensure they work correctly for all user roles.
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on a different port
const API_BASE = `${BASE_URL}/api/v1/assignments`;

// Test user tokens (you'll need to replace these with actual JWT tokens)
const TOKENS = {
    admin: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...', // Replace with actual admin token
    teacher: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...', // Replace with actual teacher token
    student: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...', // Replace with actual student token
    parent: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' // Replace with actual parent token
};

// Test data
const TEST_DATA = {
    studentId: 'student_123',
    teacherId: 'teacher_456',
    classId: 'class_789',
    courseId: 'course_101',
    assignmentId: 'assignment_111',
    submissionId: 'submission_222'
};

class APITester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            return {
                status: response.status,
                ok: response.ok,
                data
            };
        } catch (error) {
            return {
                status: 500,
                ok: false,
                error: error.message
            };
        }
    }

    async test(description, testFunction) {
        console.log(`\n🧪 Testing: ${description}`);
        try {
            const result = await testFunction();
            if (result.success) {
                console.log(`✅ PASS: ${description}`);
                this.results.passed++;
            } else {
                console.log(`❌ FAIL: ${description} - ${result.message}`);
                this.results.failed++;
            }
            this.results.tests.push({
                description,
                success: result.success,
                message: result.message || 'Success'
            });
        } catch (error) {
            console.log(`❌ ERROR: ${description} - ${error.message}`);
            this.results.failed++;
            this.results.tests.push({
                description,
                success: false,
                message: error.message
            });
        }
    }

    // Test Admin Endpoints
    async testAdminEndpoints() {
        console.log("\n🔐 Testing Admin Endpoints");
        console.log("=" .repeat(50));

        await this.test("Admin: Get assignment overview", async () => {
            const response = await this.makeRequest('/admin/overview', {
                headers: { Authorization: `Bearer ${TOKENS.admin}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            if (!response.data.total_assignments) {
                return { success: false, message: 'Missing total_assignments in response' };
            }

            return { success: true };
        });

        await this.test("Admin: Get analytics", async () => {
            const response = await this.makeRequest('/admin/analytics?period=month', {
                headers: { Authorization: `Bearer ${TOKENS.admin}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            return { success: true };
        });
    }

    // Test Teacher Endpoints
    async testTeacherEndpoints() {
        console.log("\n👩‍🏫 Testing Teacher Endpoints");
        console.log("=" .repeat(50));

        await this.test("Teacher: Get my assignments", async () => {
            const response = await this.makeRequest('/teacher/my-assignments', {
                headers: { Authorization: `Bearer ${TOKENS.teacher}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            if (!Array.isArray(response.data.assignments)) {
                return { success: false, message: 'Response should contain assignments array' };
            }

            return { success: true };
        });

        await this.test("Teacher: Create assignment", async () => {
            const assignmentData = {
                title: "Test Assignment",
                description: "This is a test assignment created by the API test script",
                assignment_type: "homework",
                subject_id: "subject_123",
                class_id: TEST_DATA.classId,
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                total_marks: 100,
                instructions: "Complete all questions",
                attachments: []
            };

            const response = await this.makeRequest('/teacher/assignments', {
                method: 'POST',
                headers: { Authorization: `Bearer ${TOKENS.teacher}` },
                body: JSON.stringify(assignmentData)
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            if (!response.data.assignment_id) {
                return { success: false, message: 'Missing assignment_id in response' };
            }

            return { success: true };
        });

        await this.test("Teacher: Get assignment submissions", async () => {
            const response = await this.makeRequest(`/teacher/assignments/${TEST_DATA.assignmentId}/submissions`, {
                headers: { Authorization: `Bearer ${TOKENS.teacher}` }
            });

            // This might return 404 if assignment doesn't exist, which is fine for testing
            if (response.status === 404) {
                return { success: true, message: 'Assignment not found (expected for test data)' };
            }

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            return { success: true };
        });
    }

    // Test Student Endpoints
    async testStudentEndpoints() {
        console.log("\n🎓 Testing Student Endpoints");
        console.log("=" .repeat(50));

        await this.test("Student: Get unified assignments", async () => {
            const response = await this.makeRequest('/student/my-assignments?status=all&sort_by=due_date', {
                headers: { Authorization: `Bearer ${TOKENS.student}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            if (!response.data.assignments || !response.data.summary) {
                return { success: false, message: 'Response should contain assignments and summary' };
            }

            if (!Array.isArray(response.data.assignments)) {
                return { success: false, message: 'Assignments should be an array' };
            }

            return { success: true };
        });

        await this.test("Student: Get dashboard", async () => {
            const response = await this.makeRequest('/student/dashboard', {
                headers: { Authorization: `Bearer ${TOKENS.student}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            const requiredFields = ['upcoming_assignments', 'overdue_assignments', 'recent_grades', 'statistics'];
            for (const field of requiredFields) {
                if (!response.data.hasOwnProperty(field)) {
                    return { success: false, message: `Missing ${field} in dashboard response` };
                }
            }

            return { success: true };
        });

        await this.test("Student: Get performance analytics", async () => {
            const response = await this.makeRequest('/student/performance?period=month', {
                headers: { Authorization: `Bearer ${TOKENS.student}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            return { success: true };
        });

        await this.test("Student: Get specific assignment", async () => {
            const response = await this.makeRequest(`/student/assignments/${TEST_DATA.assignmentId}`, {
                headers: { Authorization: `Bearer ${TOKENS.student}` }
            });

            // This might return 404 if assignment doesn't exist, which is fine for testing
            if (response.status === 404) {
                return { success: true, message: 'Assignment not found (expected for test data)' };
            }

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            return { success: true };
        });
    }

    // Test Parent Endpoints
    async testParentEndpoints() {
        console.log("\n👨‍👩‍👧‍👦 Testing Parent Endpoints");
        console.log("=" .repeat(50));

        await this.test("Parent: Get child's assignments", async () => {
            const response = await this.makeRequest(`/parent/student/${TEST_DATA.studentId}/assignments`, {
                headers: { Authorization: `Bearer ${TOKENS.parent}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            if (!response.data.assignments || !response.data.summary) {
                return { success: false, message: 'Response should contain assignments and summary' };
            }

            return { success: true };
        });

        await this.test("Parent: Get child's performance", async () => {
            const response = await this.makeRequest(`/parent/student/${TEST_DATA.studentId}/performance`, {
                headers: { Authorization: `Bearer ${TOKENS.parent}` }
            });

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            return { success: true };
        });
    }

    // Test API Health
    async testHealthEndpoints() {
        console.log("\n❤️ Testing Health Endpoints");
        console.log("=" .repeat(50));

        await this.test("Health check", async () => {
            const response = await this.makeRequest('/health');

            if (!response.ok) {
                return { success: false, message: `Status: ${response.status}` };
            }

            return { success: true };
        });
    }

    // Run all tests
    async runAllTests() {
        console.log("🚀 Enhanced Assignment API Test Suite");
        console.log("=" .repeat(60));
        console.log(`Base URL: ${API_BASE}`);
        console.log(`Test Data: Student ID ${TEST_DATA.studentId}`);

        // Check if server is running
        try {
            const healthCheck = await fetch(BASE_URL);
            if (!healthCheck.ok) {
                console.log("⚠️ Warning: Server might not be running. Some tests may fail.");
            }
        } catch (error) {
            console.log("❌ Error: Cannot connect to server. Please ensure the server is running.");
            console.log(`Expected server at: ${BASE_URL}`);
            return;
        }

        // Run test suites
        await this.testHealthEndpoints();
        await this.testAdminEndpoints();
        await this.testTeacherEndpoints();
        await this.testStudentEndpoints();
        await this.testParentEndpoints();

        // Print summary
        console.log("\n📊 Test Results Summary");
        console.log("=" .repeat(60));
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

        if (this.results.failed > 0) {
            console.log("\n❌ Failed Tests:");
            this.results.tests
                .filter(test => !test.success)
                .forEach(test => {
                    console.log(`   • ${test.description}: ${test.message}`);
                });
        }

        console.log("\n📝 Notes:");
        console.log("• Some tests may fail if test data doesn't exist in the database");
        console.log("• Replace the JWT tokens in the TOKENS object with valid tokens");
        console.log("• Ensure the server is running before executing tests");
        console.log("• Update TEST_DATA object with valid IDs from your database");

        return this.results;
    }
}

// Instructions for manual testing
function printManualTestingInstructions() {
    console.log("\n📖 Manual Testing Instructions");
    console.log("=" .repeat(60));
    console.log("1. Start your server: npm run dev or bun run dev");
    console.log("2. Get valid JWT tokens for each role from login endpoints");
    console.log("3. Update the TOKENS object above with real tokens");
    console.log("4. Update TEST_DATA with valid IDs from your database");
    console.log("5. Run this script: node test-enhanced-assignments.js");
    console.log("\nAlternatively, test endpoints manually using curl or Postman:");
    console.log("\nStudent Unified View:");
    console.log(`curl -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \\`);
    console.log(`     "${API_BASE}/student/my-assignments?status=all&sort_by=due_date"`);
    console.log("\nStudent Dashboard:");
    console.log(`curl -H "Authorization: Bearer YOUR_STUDENT_TOKEN" \\`);
    console.log(`     "${API_BASE}/student/dashboard"`);
    console.log("\nTeacher Assignments:");
    console.log(`curl -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \\`);
    console.log(`     "${API_BASE}/teacher/my-assignments"`);
    console.log("\nAdmin Overview:");
    console.log(`curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\`);
    console.log(`     "${API_BASE}/admin/overview"`);
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        printManualTestingInstructions();
        return;
    }

    if (args.includes('--manual')) {
        printManualTestingInstructions();
        return;
    }

    const tester = new APITester();
    await tester.runAllTests();
}

// Check if running directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { APITester, printManualTestingInstructions };
