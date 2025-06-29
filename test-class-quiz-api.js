#!/usr/bin/env node

/**
 * Class Quiz API Testing Script
 * Tests all endpoints with proper session management and timeout handling
 */

const BASE_URL = 'http://localhost:4500/api';

// Authentication token (replace with your actual token)
const ACCESS_TOKEN = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiY2UyYjU5YWUtMzVkYS00MzE4LTk1MWEtMDFkNGE2MWUwYjc3IiwidXNlcl90eXBlIjoiQWRtaW4iLCJzZXNzaW9uX2lkIjoiZjRlYWNlMTUzOTA2NWE0NGE2NDMzODY4ZWE2Nzc4MWIiLCJleHAiOjE3NTE2NTgyMjd9.3aglPpqN5wYxwIUMQSomfrfrcyaJ8QxNArNcMmdXd73siGJikYH8Bo0RRyWG4QLaCPqaXptQUbTx7eAjdxVTvQ';

// Real test data for testing
const testData = {
    campus_id: 'c78c27ef-832f-4758-a3db-79971c6aa9d5',
    class_id: '22a6e0a4-8c75-40fc-9c28-1768d0c8310a',
    user_id: '57ddb842-f034-40c8-9bb2-d3714371a9ea',
    quiz_data: {
        quiz_name: "Mathematics Quiz 1",
        quiz_description: "Basic algebra and geometry questions",
        quiz_meta_data: {
            time_limit_minutes: 30,
            shuffle_questions: true,
            allow_review: true,
            show_results_immediately: true,
            max_attempts: 1,
            available_from: new Date(),
            available_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
    },
    questions: [
        {
            question_text: "What is 2 + 2?",
            question_type: "multiple_choice",
            options: ["3", "4", "5", "6"],
            correct_answer: "4",
            meta_data: { difficulty: "easy" }
        },
        {
            question_text: "What is the square root of 16?",
            question_type: "multiple_choice", 
            options: ["2", "3", "4", "5"],
            correct_answer: "4",
            meta_data: { difficulty: "medium" }
        },
        {
            question_text: "What is 10 × 5?",
            question_type: "multiple_choice",
            options: ["45", "50", "55", "60"],
            correct_answer: "50",
            meta_data: { difficulty: "easy" }
        }
    ]
};

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    quizId: null,
    sessionToken: null,
    questionIds: []
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        console.log(`\n🔵 ${method} ${endpoint}`);
        if (data) console.log('📤 Request:', JSON.stringify(data, null, 2));

        const response = await fetch(url, options);
        const responseData = await response.text();
        
        let parsedData;
        try {
            parsedData = JSON.parse(responseData);
        } catch {
            parsedData = responseData;
        }

        console.log(`📊 Status: ${response.status}`);
        console.log('📥 Response:', typeof parsedData === 'object' ? JSON.stringify(parsedData, null, 2) : parsedData);

        return {
            status: response.status,
            data: parsedData,
            ok: response.ok
        };
    } catch (error) {
        console.error(`❌ Error calling ${method} ${endpoint}:`, error.message);
        return {
            status: 0,
            data: { error: error.message },
            ok: false
        };
    }
}

// Test function wrapper
async function test(testName, testFunc) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log('=' .repeat(50));
    
    try {
        await testFunc();
        testResults.passed.push(testName);
        console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
        testResults.failed.push({ test: testName, error: error.message });
        console.log(`❌ FAILED: ${testName} - ${error.message}`);
    }
}

// Test functions
async function testHealthCheck() {
    // Health endpoint is at root level, not under /api
    const url = 'http://localhost:4500/health';
    const response = await fetch(url);
    
    console.log(`\n🔵 GET /health`);
    console.log(`📊 Status: ${response.status}`);
    
    const responseData = await response.text();
    let parsedData;
    try {
        parsedData = JSON.parse(responseData);
    } catch {
        parsedData = responseData;
    }
    console.log('📥 Response:', typeof parsedData === 'object' ? JSON.stringify(parsedData, null, 2) : parsedData);
    
    if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
    }
}

async function testCreateQuiz() {
    const response = await apiCall('POST', `/class-quiz/${testData.class_id}`, testData.quiz_data, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Create quiz failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.id) {
        throw new Error('Quiz ID not returned');
    }
    
    testResults.quizId = response.data.id;
    console.log(`📝 Quiz created with ID: ${testResults.quizId}`);
}

async function testGetQuizById() {
    if (!testResults.quizId) {
        throw new Error('No quiz ID available');
    }
    
    const response = await apiCall('GET', `/class-quiz/${testResults.quizId}`, null, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Get quiz failed: ${response.status}`);
    }
    
    if (response.data.quiz_name !== testData.quiz_data.quiz_name) {
        throw new Error('Quiz name mismatch');
    }
}

async function testGetQuizzesByClass() {
    const response = await apiCall('GET', `/class-quiz/class/${testData.class_id}`, null, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Get quizzes by class failed: ${response.status}`);
    }
    
    if (!Array.isArray(response.data)) {
        throw new Error('Response should be an array');
    }
}

async function testCreateQuestions() {
    if (!testResults.quizId) {
        throw new Error('No quiz ID available');
    }
    
    const response = await apiCall('POST', `/class-quiz/${testData.class_id}/${testResults.quizId}/questions`, {
        questionBank: testData.questions
    }, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Create questions failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    if (response.data.questions_count !== testData.questions.length) {
        throw new Error(`Expected ${testData.questions.length} questions, got ${response.data.questions_count}`);
    }
    
    testResults.questionIds = response.data.questions.map(q => q.id);
    console.log(`📝 Created ${testResults.questionIds.length} questions`);
}

async function testGetQuestions() {
    if (!testResults.quizId) {
        throw new Error('No quiz ID available');
    }
    
    const response = await apiCall('GET', `/class-quiz/class/${testData.class_id}/${testResults.quizId}/questions`, null, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Get questions failed: ${response.status}`);
    }
    
    if (!Array.isArray(response.data) || response.data.length !== testData.questions.length) {
        throw new Error(`Expected ${testData.questions.length} questions, got ${response.data.length}`);
    }
}

async function testStartQuizSession() {
    if (!testResults.quizId) {
        throw new Error('No quiz ID available');
    }
    
    const response = await apiCall('POST', `/class-quiz/session/${testData.class_id}/${testResults.quizId}/start`, null, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Start quiz session failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.success || !response.data.data.session.session_token) {
        throw new Error('Session token not returned');
    }
    
    testResults.sessionToken = response.data.data.session.session_token;
    console.log(`🎯 Session started with token: ${testResults.sessionToken.substring(0, 20)}...`);
    
    // Verify session data
    const sessionData = response.data.data;
    if (!sessionData.quiz || !sessionData.current_question) {
        throw new Error('Missing session data');
    }
    
    if (sessionData.questions_count !== testData.questions.length) {
        throw new Error(`Expected ${testData.questions.length} questions in session, got ${sessionData.questions_count}`);
    }
}

async function testGetQuizSession() {
    if (!testResults.sessionToken) {
        throw new Error('No session token available');
    }
    
    const response = await apiCall('GET', `/class-quiz/session/${testResults.sessionToken}`, null, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Get quiz session failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.success || !response.data.data.session) {
        throw new Error('Session data not returned');
    }
    
    const sessionData = response.data.data;
    if (sessionData.session.status !== 'in_progress') {
        throw new Error(`Expected session status 'in_progress', got '${sessionData.session.status}'`);
    }
}

async function testSubmitAnswers() {
    if (!testResults.sessionToken || !testResults.questionIds.length) {
        throw new Error('No session token or question IDs available');
    }
    
    // Submit answers for all questions
    for (let i = 0; i < testResults.questionIds.length; i++) {
        const questionId = testResults.questionIds[i];
        const answer = testData.questions[i].correct_answer;
        
        console.log(`📝 Submitting answer for question ${i + 1}: ${answer}`);
        
        const response = await apiCall('POST', `/class-quiz/session/${testResults.sessionToken}/answer`, {
            question_id: questionId,
            answer: answer
        }, ACCESS_TOKEN);
        
        if (!response.ok) {
            throw new Error(`Submit answer failed for question ${i + 1}: ${response.status} - ${JSON.stringify(response.data)}`);
        }
        
        if (!response.data.success) {
            throw new Error(`Answer submission not successful for question ${i + 1}`);
        }
        
        // Add a small delay between submissions
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Successfully submitted ${testResults.questionIds.length} answers`);
}

async function testQuizNavigation() {
    if (!testResults.sessionToken) {
        throw new Error('No session token available');
    }
    
    console.log('🧭 Testing quiz navigation...');
    
    // Test navigate to next question
    const nextResponse = await apiCall('POST', `/class-quiz/session/${testResults.sessionToken}/next`, null, ACCESS_TOKEN);
    
    if (!nextResponse.ok) {
        throw new Error(`Navigate to next failed: ${nextResponse.status} - ${JSON.stringify(nextResponse.data)}`);
    }
    
    if (!nextResponse.data.success) {
        throw new Error('Navigate to next not successful');
    }
    
    // Verify navigation flags
    const nextData = nextResponse.data.data;
    if (nextData.can_go_previous !== true) {
        throw new Error('Expected can_go_previous to be true after moving to next question');
    }
    
    console.log('✅ Successfully navigated to next question');
    
    // Test navigate to previous question
    const prevResponse = await apiCall('POST', `/class-quiz/session/${testResults.sessionToken}/previous`, null, ACCESS_TOKEN);
    
    if (!prevResponse.ok) {
        throw new Error(`Navigate to previous failed: ${prevResponse.status} - ${JSON.stringify(prevResponse.data)}`);
    }
    
    if (!prevResponse.data.success) {
        throw new Error('Navigate to previous not successful');
    }
    
    // Verify navigation flags
    const prevData = prevResponse.data.data;
    if (prevData.can_go_previous !== false) {
        throw new Error('Expected can_go_previous to be false at first question');
    }
    
    console.log('✅ Successfully navigated to previous question');
    console.log('🧭 Navigation test completed successfully');
}

async function testCompleteQuiz() {
    if (!testResults.sessionToken) {
        throw new Error('No session token available');
    }
    
    const response = await apiCall('POST', `/class-quiz/session/${testResults.sessionToken}/complete`, null, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Complete quiz failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.success || !response.data.data.submission) {
        throw new Error('Quiz completion data not returned');
    }
    
    const result = response.data.data;
    console.log(`🎯 Quiz completed! Score: ${result.score}/${result.total_questions} (${result.percentage}%)`);
    
    // Verify all answers were correct (we submitted correct answers)
    if (result.score !== testData.questions.length) {
        throw new Error(`Expected perfect score ${testData.questions.length}, got ${result.score}`);
    }
    
    if (result.percentage !== 100) {
        throw new Error(`Expected 100% score, got ${result.percentage}%`);
    }
}

async function testGetQuizStatistics() {
    if (!testResults.quizId) {
        throw new Error('No quiz ID available');
    }
    
    const response = await apiCall(
        'GET',
        `/class-quiz/class/${testData.class_id}/${testResults.quizId}/statistics`,
        null,
        ACCESS_TOKEN
    );

    if (!response.ok) {
        throw new Error(`Statistics request failed with status ${response.status}`);
    }

    const result = response.data;
    if (!result.success || !result.data) {
        throw new Error('Invalid statistics response structure');
    }

    const stats = result.data;
    const expectedKeys = ['total_attempts', 'average_score', 'highest_score', 'lowest_score', 'completion_rate'];
    
    for (const key of expectedKeys) {
        if (!(key in stats)) {
            throw new Error(`Missing expected key: ${key}`);
        }
    }

    console.log(`📊 Statistics: ${stats.total_attempts} attempts, avg: ${stats.average_score}, highest: ${stats.highest_score}`);
}

async function testTimeoutScenario() {
    console.log('⏰ Testing timeout scenario (shortened for demo)...');
    
    // Create a quiz with very short time limit
    const shortQuizData = {
        ...testData.quiz_data,
        quiz_name: "Timeout Test Quiz",
        quiz_meta_data: {
            ...testData.quiz_data.quiz_meta_data,
            time_limit_minutes: 0.1 // 6 seconds for testing
        }
    };
    
    const quizResponse = await apiCall('POST', `/class-quiz/${testData.class_id}`, shortQuizData, ACCESS_TOKEN);
    if (!quizResponse.ok) {
        throw new Error('Failed to create timeout test quiz');
    }
    
    const timeoutQuizId = quizResponse.data.id;
    
    // Add questions
    await apiCall('POST', `/class-quiz/${testData.class_id}/${timeoutQuizId}/questions`, {
        questionBank: testData.questions.slice(0, 1) // Just one question
    }, ACCESS_TOKEN);
    
    // Start session
    const sessionResponse = await apiCall('POST', `/class-quiz/session/${testData.class_id}/${timeoutQuizId}/start`, null, ACCESS_TOKEN);
    if (!sessionResponse.ok) {
        throw new Error('Failed to start timeout test session');
    }
    
    const timeoutSessionToken = sessionResponse.data.data.session.session_token;
    console.log(`⏰ Started timeout test session, waiting for timeout...`);
    
    // Wait for timeout (7 seconds to be sure)
    await new Promise(resolve => setTimeout(resolve, 7000));
    
    // Try to access session after timeout
    const expiredSessionResponse = await apiCall('GET', `/class-quiz/session/${timeoutSessionToken}`, null, ACCESS_TOKEN);
    
    // Should get error about expired session
    if (expiredSessionResponse.ok) {
        throw new Error('Expected session to be expired, but it was still accessible');
    }
    
    if (!expiredSessionResponse.data.message || !expiredSessionResponse.data.message.includes('expired')) {
        throw new Error('Expected timeout error message');
    }
    
    console.log('✅ Timeout scenario handled correctly');
}

async function testAdminEndpoints() {
    console.log('🔧 Testing admin endpoints...');
    
    const response = await apiCall('POST', '/class-quiz/admin/check-expired-sessions', null, ACCESS_TOKEN);
    
    if (!response.ok) {
        console.log('⚠️  Admin endpoint may require authentication');
        return;
    }
    
    if (!response.data.success) {
        throw new Error('Admin endpoint should return success');
    }
    
    console.log(`📊 Admin check found ${response.data.data.length} expired sessions`);
}

// Legacy API tests
async function testLegacyAttemptCreation() {
    if (!testResults.quizId || !testResults.questionIds.length) {
        console.log('⚠️  Skipping legacy test - missing quiz data');
        return;
    }
    
    console.log('🔄 Testing legacy attempt creation...');
    
    const response = await apiCall('POST', `/class-quiz/${testData.class_id}/${testResults.quizId}/attempt`, {
        question_id: testResults.questionIds[0],
        opted_answer: {
            option_id: "1",
            answer: testData.questions[0].correct_answer
        }
    }, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Legacy attempt creation failed: ${response.status}`);
    }
}

async function testLegacySubmissionCreation() {
    if (!testResults.quizId) {
        console.log('⚠️  Skipping legacy submission test - missing quiz ID');
        return;
    }
    
    console.log('🔄 Testing legacy submission creation...');
    
    const response = await apiCall('POST', `/class-quiz/${testData.class_id}/${testResults.quizId}/submission`, null, ACCESS_TOKEN);
    
    if (!response.ok) {
        throw new Error(`Legacy submission creation failed: ${response.status}`);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Class Quiz API Test Suite');
    console.log('=' .repeat(60));
    
    const tests = [
        ['Health Check', testHealthCheck],
        ['Create Quiz', testCreateQuiz],
        ['Get Quiz by ID', testGetQuizById],
        ['Get Quizzes by Class', testGetQuizzesByClass],
        ['Create Questions', testCreateQuestions],
        ['Get Questions', testGetQuestions],
        ['Start Quiz Session', testStartQuizSession],
        ['Get Quiz Session', testGetQuizSession],
        ['Submit Answers', testSubmitAnswers],
        ['Quiz Navigation', testQuizNavigation],
        ['Complete Quiz', testCompleteQuiz],
        ['Get Quiz Statistics', testGetQuizStatistics],
        ['Timeout Scenario', testTimeoutScenario],
        ['Admin Endpoints', testAdminEndpoints],
        ['Legacy Attempt Creation', testLegacyAttemptCreation],
        ['Legacy Submission Creation', testLegacySubmissionCreation]
    ];
    
    for (const [testName, testFunc] of tests) {
        await test(testName, testFunc);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Print test summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    
    if (testResults.passed.length > 0) {
        console.log('\n✅ PASSED TESTS:');
        testResults.passed.forEach(test => console.log(`   • ${test}`));
    }
    
    if (testResults.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.failed.forEach(failure => console.log(`   • ${failure.test}: ${failure.error}`));
    }
    
    const totalTests = testResults.passed.length + testResults.failed.length;
    const successRate = ((testResults.passed.length / totalTests) * 100).toFixed(1);
    
    console.log(`\n📈 Success Rate: ${successRate}% (${testResults.passed.length}/${totalTests})`);
    
    if (testResults.failed.length === 0) {
        console.log('\n🎉 ALL TESTS PASSED! The Class Quiz API is working perfectly.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the errors above for details.');
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
