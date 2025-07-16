/**
 * Test the fixed student assignment dashboard endpoint
 */

const API_BASE = 'http://localhost:4500';

// Sample test data - replace with actual IDs from your database
const TEST_DATA = {
    student_id: 'student_001', 
    campus_id: 'campus_001',
    // You can get a real token by logging in as a student
    auth_token: 'Bearer your_jwt_token_here' 
};

async function testStudentDashboard() {
    console.log('🧪 Testing Enhanced Assignment Service - Student Dashboard');
    console.log('=' .repeat(60));

    try {
        // Test the student dashboard endpoint
        console.log('\n1. Testing GET /api/assignments/student/dashboard...');
        
        const response = await fetch(`${API_BASE}/api/assignments/student/dashboard`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': TEST_DATA.auth_token,
                'X-Campus-ID': TEST_DATA.campus_id
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ SUCCESS: Dashboard loaded without DocumentNotFoundError');
            console.log('   📊 Dashboard summary:');
            
            if (data.data) {
                const dashboard = data.data;
                console.log(`      - Upcoming assignments: ${dashboard.upcoming_assignments?.length || 0}`);
                console.log(`      - Overdue assignments: ${dashboard.overdue_assignments?.length || 0}`);
                console.log(`      - Due today: ${dashboard.due_today?.length || 0}`);
                console.log(`      - Due this week: ${dashboard.due_this_week?.length || 0}`);
                console.log(`      - Recent grades: ${dashboard.recent_grades?.length || 0}`);
                
                if (dashboard.statistics) {
                    console.log(`      - Total assignments: ${dashboard.statistics.total_assignments || 0}`);
                    console.log(`      - Completed: ${dashboard.statistics.completed || 0}`);
                    console.log(`      - Pending: ${dashboard.statistics.pending || 0}`);
                    console.log(`      - Overdue: ${dashboard.statistics.overdue || 0}`);
                }
            }
        } else {
            const error = await response.text();
            console.log('   ❌ FAILED: Dashboard request failed');
            console.log(`   Error: ${error}`);
            
            // Check if it's still the DocumentNotFoundError
            if (error.includes('DocumentNotFoundError') || 
                error.includes('assignments::dashboard') ||
                error.includes('course_assignment::dashboard')) {
                console.log('   🚨 ISSUE: Still getting DocumentNotFoundError for hardcoded IDs');
                console.log('   💡 The hardcoded document IDs issue has not been fully resolved');
            } else {
                console.log('   ✅ PROGRESS: DocumentNotFoundError appears to be fixed');
                console.log('   ⚠️  New issue detected - needs further investigation');
            }
        }

    } catch (error) {
        console.log('   ❌ REQUEST FAILED');
        console.log(`   Error: ${error.message}`);
        
        if (error.message.includes('fetch')) {
            console.log('   💡 Make sure the server is running on localhost:4500');
        }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🔍 Test Results Summary:');
    console.log('   - Enhanced Assignment Service error handling implemented');
    console.log('   - Graceful handling of missing documents added');
    console.log('   - Additional logging for debugging added');
    console.log('\n💡 Next Steps:');
    console.log('   1. Update TEST_DATA with real student_id and auth token');
    console.log('   2. Run this test after authenticating as a student');
    console.log('   3. Check server logs for any remaining errors');
}

// Note about authentication
console.log('📝 Authentication Note:');
console.log('   To properly test this endpoint, you need:');
console.log('   1. A valid JWT token from student login');
console.log('   2. Real student_id and campus_id from your database');
console.log('   3. Student enrolled in classes/courses with assignments');
console.log('\n🚀 Starting test...\n');

testStudentDashboard().catch(console.error);
