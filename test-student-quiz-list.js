#!/usr/bin/env node

/**
 * Student Quiz List API Test
 * Tests the new endpoint that shows quiz status for students
 */

const BASE_URL = 'http://localhost:4500/api';

// Test data - replace with your actual data
const testData = {
    class_id: '22a6e0a4-8c75-40fc-9c28-1768d0c8310a',
    student_id: '57ddb842-f034-40c8-9bb2-d3714371a9ea',
    access_token: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiY2UyYjU5YWUtMzVkYS00MzE4LTk1MWEtMDFkNGE2MWUwYjc3IiwidXNlcl90eXBlIjoiQWRtaW4iLCJzZXNzaW9uX2lkIjoiZjRlYWNlMTUzOTA2NWE0NGE2NDMzODY4ZWE2Nzc4MWIiLCJleHAiOjE3NTE2NTgyMjd9.3aglPpqN5wYxwIUMQSomfrfrcyaJ8QxNArNcMmdXd73siGJikYH8Bo0RRyWG4QLaCPqaXptQUbTx7eAjdxVTvQ'
};

async function testStudentQuizList() {
    console.log('🎯 Testing Student Quiz List API');
    console.log('====================================\n');

    try {
        // Test the new endpoint
        const url = `${BASE_URL}/class-quiz/class/${testData.class_id}/student-status?user_id=${testData.student_id}`;
        
        console.log(`📡 GET ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${testData.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success && data.data) {
            console.log('\n📈 Quiz Status Summary:');
            console.log('========================');
            
            data.data.forEach((quiz, index) => {
                const status = quiz.student_status;
                console.log(`\n${index + 1}. ${quiz.quiz_name}`);
                console.log(`   Status: ${status.status}`);
                console.log(`   Availability: ${status.availability_status}`);
                console.log(`   Can Attempt: ${status.can_attempt ? 'Yes' : 'No'}`);
                console.log(`   Attempts: ${status.attempts_made}/${status.max_attempts}`);
                
                if (status.attempt_data) {
                    console.log(`   ✅ Completed - Score: ${status.attempt_data.score}`);
                    console.log(`   📅 Submitted: ${new Date(status.attempt_data.submission_date).toLocaleString()}`);
                }
                
                if (status.session_data) {
                    console.log(`   🚀 In Progress - ${status.session_data.answers_count}/${status.session_data.total_questions} answered`);
                    if (status.session_data.time_remaining_seconds > 0) {
                        const minutes = Math.floor(status.session_data.time_remaining_seconds / 60);
                        console.log(`   ⏰ Time Remaining: ${minutes} minutes`);
                    }
                }
                
                console.log(`   📝 Description: ${quiz.quiz_description}`);
            });

            // Count quiz statuses
            const statusCounts = data.data.reduce((acc, quiz) => {
                const status = quiz.student_status.status;
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            console.log('\n📊 Status Overview:');
            console.log('===================');
            Object.entries(statusCounts).forEach(([status, count]) => {
                const emoji = {
                    'not_attempted': '⭕',
                    'in_progress': '🚀',
                    'completed': '✅',
                    'expired': '⏰'
                }[status] || '❓';
                console.log(`${emoji} ${status.replace('_', ' ').toUpperCase()}: ${count}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Also test the regular endpoint for comparison
async function testRegularQuizList() {
    console.log('\n\n🔄 Testing Regular Quiz List (for comparison)');
    console.log('=============================================\n');

    try {
        const url = `${BASE_URL}/class-quiz/class/${testData.class_id}`;
        
        console.log(`📡 GET ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${testData.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📋 Found ${Array.isArray(data) ? data.length : 0} quizzes (without student status)`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run tests
async function runTests() {
    await testStudentQuizList();
    await testRegularQuizList();
    
    console.log('\n\n📚 API Usage Examples:');
    console.log('======================');
    console.log('');
    console.log('1. For current logged-in student:');
    console.log(`   GET /api/class-quiz/class/{class_id}/student-status`);
    console.log('');
    console.log('2. For specific student (admin/teacher view):');
    console.log(`   GET /api/class-quiz/class/{class_id}/student-status?user_id={student_id}`);
    console.log('');
    console.log('3. Regular quiz list (no student status):');
    console.log(`   GET /api/class-quiz/class/{class_id}`);
    console.log('');
    
    console.log('✨ Test completed!');
}

runTests().catch(console.error);
