const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const BASE_URL = 'http://localhost:3000/api/class-quiz';

// Test configuration
const TEST_CONFIG = {
    campus_id: 'campus_123',
    class_id: 'class_456',
    user_id: 'student_789',
    quiz_id: 'quiz_001',
    quiz_name: 'Test Quiz for Results Retrieval',
    auth_token: 'test_auth_token_123'
};

let sessionToken = null;

async function makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.auth_token}`,
        'x-campus-id': TEST_CONFIG.campus_id,
        'x-user-id': TEST_CONFIG.user_id,
        ...headers
    };

    let curlCommand = `curl -s -X ${method} "${BASE_URL}${endpoint}"`;
    
    // Add headers
    Object.entries(defaultHeaders).forEach(([key, value]) => {
        curlCommand += ` -H "${key}: ${value}"`;
    });
    
    // Add data for POST requests
    if (data && (method === 'POST' || method === 'PUT')) {
        curlCommand += ` -d '${JSON.stringify(data)}'`;
    }

    try {
        const { stdout, stderr } = await execPromise(curlCommand);
        if (stderr) {
            console.error('curl stderr:', stderr);
        }
        return JSON.parse(stdout);
    } catch (error) {
        console.error('Request failed:', error.message);
        console.error('Command:', curlCommand);
        throw error;
    }
}

async function runTest(testName, testFunc) {
    try {
        console.log(`\n🧪 Running: ${testName}`);
        await testFunc();
        console.log(`✅ ${testName} - PASSED`);
        return true;
    } catch (error) {
        console.log(`❌ ${testName} - FAILED`);
        console.error('Error:', error.message);
        return false;
    }
}

async function setupTestQuiz() {
    console.log('\n📝 Setting up test quiz...');
    
    // Create quiz
    const quizData = {
        quiz_name: TEST_CONFIG.quiz_name,
        quiz_description: 'Test quiz for session results testing',
        quiz_meta_data: {
            time_limit_minutes: 10,
            shuffle_questions: false,
            allow_review: true,
            show_results_immediately: true
        }
    };

    const createQuizResponse = await makeRequest(
        `/${TEST_CONFIG.class_id}`,
        'POST',
        quizData
    );

    if (createQuizResponse.success) {
        TEST_CONFIG.quiz_id = createQuizResponse.data.id;
        console.log(`✅ Quiz created with ID: ${TEST_CONFIG.quiz_id}`);
    } else {
        throw new Error('Failed to create test quiz');
    }

    // Add questions
    const questionsData = {
        questions: [
            {
                question_text: 'What is 2 + 2?',
                question_type: 'multiple_choice',
                options: {
                    A: '3',
                    B: '4',
                    C: '5',
                    D: '6'
                },
                correct_answer: 'B'
            },
            {
                question_text: 'What is the capital of France?',
                question_type: 'multiple_choice',
                options: {
                    A: 'London',
                    B: 'Berlin',
                    C: 'Paris',
                    D: 'Madrid'
                },
                correct_answer: 'C'
            }
        ]
    };

    const createQuestionsResponse = await makeRequest(
        `/${TEST_CONFIG.class_id}/${TEST_CONFIG.quiz_id}/questions`,
        'POST',
        questionsData
    );

    if (createQuestionsResponse.success) {
        console.log(`✅ Questions added to quiz`);
    } else {
        throw new Error('Failed to add questions to quiz');
    }
}

async function testCompleteQuizFlow() {
    console.log('\n🔄 Starting complete quiz flow to get session token...');
    
    // 1. Start quiz session
    const startResponse = await makeRequest(
        `/session/${TEST_CONFIG.class_id}/${TEST_CONFIG.quiz_id}/start`,
        'POST'
    );

    if (!startResponse.success) {
        throw new Error('Failed to start quiz session');
    }

    sessionToken = startResponse.data.session.session_token;
    console.log(`✅ Session started with token: ${sessionToken}`);

    // 2. Get current question
    const sessionResponse = await makeRequest(`/session/${sessionToken}`);
    if (!sessionResponse.success) {
        throw new Error('Failed to get session');
    }

    const questions = sessionResponse.data.questions || [];
    console.log(`✅ Retrieved ${questions.length} questions`);

    // 3. Answer questions
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const answer = question.correct_answer; // Answer correctly
        
        const answerResponse = await makeRequest(
            `/session/${sessionToken}/answer`,
            'POST',
            {
                question_id: question.id,
                answer: answer
            }
        );

        if (answerResponse.success) {
            console.log(`✅ Answered question ${i + 1}/${questions.length}`);
        } else {
            console.log(`⚠️ Failed to answer question ${i + 1}: ${answerResponse.message}`);
        }
    }

    // 4. Submit quiz
    const submitResponse = await makeRequest(
        `/session/${sessionToken}/submit`,
        'POST'
    );

    if (submitResponse.success) {
        console.log(`✅ Quiz submitted successfully`);
        console.log(`📊 Score: ${submitResponse.data.results.score}/${submitResponse.data.results.total_questions}`);
    } else {
        throw new Error('Failed to submit quiz');
    }
}

async function testGetQuizResultsBySession() {
    if (!sessionToken) {
        throw new Error('No session token available - need to complete quiz flow first');
    }

    const response = await makeRequest(`/session/${sessionToken}/results`);

    if (!response.success) {
        throw new Error(`Failed to get quiz results: ${response.message}`);
    }

    const { data } = response;

    // Validate response structure
    if (!data.session) {
        throw new Error('Missing session data in response');
    }
    if (!data.quiz) {
        throw new Error('Missing quiz data in response');
    }
    if (!data.results) {
        throw new Error('Missing results data in response');
    }
    if (!data.question_details || !Array.isArray(data.question_details)) {
        throw new Error('Missing or invalid question_details in response');
    }

    // Validate session data
    if (data.session.session_token !== sessionToken) {
        throw new Error('Session token mismatch in response');
    }
    if (data.session.status !== 'completed') {
        throw new Error(`Expected session status to be 'completed', got '${data.session.status}'`);
    }

    // Validate quiz data
    if (data.quiz.quiz_name !== TEST_CONFIG.quiz_name) {
        throw new Error('Quiz name mismatch in response');
    }

    // Validate results data
    if (typeof data.results.score !== 'number') {
        throw new Error('Invalid score in results');
    }
    if (typeof data.results.total_questions !== 'number') {
        throw new Error('Invalid total_questions in results');
    }
    if (typeof data.results.percentage !== 'number') {
        throw new Error('Invalid percentage in results');
    }

    // Validate question details
    if (data.question_details.length !== data.results.total_questions) {
        throw new Error('Question details count mismatch');
    }

    for (const questionDetail of data.question_details) {
        if (!questionDetail.question_id) {
            throw new Error('Missing question_id in question detail');
        }
        if (!questionDetail.question_text) {
            throw new Error('Missing question_text in question detail');
        }
        if (typeof questionDetail.is_correct !== 'boolean') {
            throw new Error('Invalid is_correct value in question detail');
        }
    }

    console.log(`📊 Quiz Results Retrieved Successfully:`);
    console.log(`   - Session: ${data.session.session_token} (${data.session.status})`);
    console.log(`   - Quiz: ${data.quiz.quiz_name}`);
    console.log(`   - Score: ${data.results.score}/${data.results.total_questions} (${data.results.percentage}%)`);
    console.log(`   - Correct: ${data.results.correct_answers}, Incorrect: ${data.results.incorrect_answers}`);
    console.log(`   - Time taken: ${data.results.time_taken_seconds} seconds`);
    console.log(`   - Auto-submitted: ${data.results.auto_submitted}`);
    console.log(`   - Questions analyzed: ${data.question_details.length}`);
}

async function testInvalidSessionToken() {
    const response = await makeRequest('/session/invalid_token_123/results');

    if (response.success) {
        throw new Error('Expected failure for invalid session token, but got success');
    }

    if (!response.message || !response.message.includes('Session not found')) {
        throw new Error('Expected "Session not found" error message');
    }

    console.log(`✅ Correctly rejected invalid session token: ${response.message}`);
}

async function testIncompleteSession() {
    // Start a new session but don't complete it
    const startResponse = await makeRequest(
        `/session/${TEST_CONFIG.class_id}/${TEST_CONFIG.quiz_id}/start`,
        'POST'
    );

    if (!startResponse.success) {
        throw new Error('Failed to start quiz session for incomplete test');
    }

    const incompleteSessionToken = startResponse.data.session.session_token;
    
    // Try to get results for incomplete session
    const response = await makeRequest(`/session/${incompleteSessionToken}/results`);

    if (response.success) {
        throw new Error('Expected failure for incomplete session, but got success');
    }

    if (!response.message || !response.message.includes('not completed yet')) {
        throw new Error('Expected "not completed yet" error message');
    }

    console.log(`✅ Correctly rejected incomplete session: ${response.message}`);
}

async function runAllTests() {
    console.log('🚀 Starting Quiz Results by Session API Tests');
    console.log('===============================================');

    let passed = 0;
    let total = 0;

    // Setup
    try {
        await setupTestQuiz();
        await testCompleteQuizFlow();
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }

    // Tests
    const tests = [
        ['Get Quiz Results by Session - Valid', testGetQuizResultsBySession],
        ['Get Quiz Results by Session - Invalid Token', testInvalidSessionToken],
        ['Get Quiz Results by Session - Incomplete Session', testIncompleteSession],
    ];

    for (const [testName, testFunc] of tests) {
        total++;
        if (await runTest(testName, testFunc)) {
            passed++;
        }
    }

    // Summary
    console.log('\n📋 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (passed === total) {
        console.log('\n🎉 All tests passed! The Get Quiz Results by Session API is working correctly.');
        process.exit(0);
    } else {
        console.log('\n⚠️ Some tests failed. Please check the implementation.');
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
});
