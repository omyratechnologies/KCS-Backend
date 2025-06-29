// Test file for Student Performance API
// This file contains test scenarios for the student performance endpoints

const API_BASE = 'http://localhost:3000/api';
const studentPerformanceEndpoints = {
    // Student endpoints
    getMyPerformance: `${API_BASE}/student-performance/my-performance`,
    getMyPerformanceSummary: `${API_BASE}/student-performance/my-performance/summary`,
    
    // Admin/Teacher endpoints
    createPerformance: `${API_BASE}/student-performance/`,
    calculatePerformance: `${API_BASE}/student-performance/calculate`,
    getStudentPerformanceBySemester: `${API_BASE}/student-performance/:student_id/semester/:semester`,
    getStudentPerformanceByYear: `${API_BASE}/student-performance/:student_id/academic-year/:academic_year`,
    getAllStudentPerformance: `${API_BASE}/student-performance/:student_id`,
    getStudentPerformanceSummary: `${API_BASE}/student-performance/:student_id/summary`,
};

// Test data
const samplePerformanceData = {
    student_id: "student_001",
    academic_year: "2024-25",
    semester: "Fall",
    class_id: "class_001",
    performance_data: {
        exam_term_id: "term_001",
        exam_term_name: "Fall 2024 Final Exams",
        subjects: [
            {
                subject_id: "math_001",
                subject_name: "Mathematics",
                marks_obtained: 85,
                total_marks: 100,
                percentage: 85.0,
                grade: "A",
                grade_points: 3.5,
                examination_id: "exam_001",
                examination_name: "Final Exam"
            },
            {
                subject_id: "english_001",
                subject_name: "English",
                marks_obtained: 78,
                total_marks: 100,
                percentage: 78.0,
                grade: "B+",
                grade_points: 3.0,
                examination_id: "exam_002",
                examination_name: "Final Exam"
            }
        ],
        total_marks_obtained: 425,
        total_marks_possible: 500,
        overall_percentage: 85.0,
        overall_grade: "A",
        overall_gpa: 3.5,
        rank: 5,
        total_students: 30
    },
    attendance: {
        total_days: 90,
        days_present: 85,
        days_absent: 5,
        attendance_percentage: 94.4
    },
    quiz_performance: {
        total_quizzes: 10,
        quizzes_attempted: 9,
        average_score: 82.5,
        best_score: 95,
        total_marks_obtained: 165,
        total_marks_possible: 200
    },
    assignment_performance: {
        total_assignments: 8,
        assignments_submitted: 8,
        submission_percentage: 100.0,
        average_score: 88.5,
        total_marks_obtained: 177,
        total_marks_possible: 200
    }
};

// Test functions
async function testCreatePerformance(authToken) {
    console.log('Testing: Create Performance');
    
    try {
        const response = await fetch(studentPerformanceEndpoints.createPerformance, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(samplePerformanceData)
        });
        
        const data = await response.json();
        console.log('Create Performance Response:', data);
        return data;
    } catch (error) {
        console.error('Error testing create performance:', error);
    }
}

async function testGetMyPerformance(authToken) {
    console.log('Testing: Get My Performance');
    
    try {
        const response = await fetch(studentPerformanceEndpoints.getMyPerformance, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        const data = await response.json();
        console.log('Get My Performance Response:', data);
        return data;
    } catch (error) {
        console.error('Error testing get my performance:', error);
    }
}

async function testGetMyPerformanceBySemester(authToken, semester, academicYear) {
    console.log('Testing: Get My Performance by Semester');
    
    const url = `${studentPerformanceEndpoints.getMyPerformance}?semester=${semester}&academic_year=${academicYear}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        const data = await response.json();
        console.log('Get My Performance by Semester Response:', data);
        return data;
    } catch (error) {
        console.error('Error testing get my performance by semester:', error);
    }
}

async function testGetMyPerformanceSummary(authToken) {
    console.log('Testing: Get My Performance Summary');
    
    try {
        const response = await fetch(studentPerformanceEndpoints.getMyPerformanceSummary, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        const data = await response.json();
        console.log('Get My Performance Summary Response:', data);
        return data;
    } catch (error) {
        console.error('Error testing get my performance summary:', error);
    }
}

async function testCalculatePerformance(authToken) {
    console.log('Testing: Calculate Performance');
    
    const calculateData = {
        student_id: "student_001",
        semester: "Fall",
        academic_year: "2024-25",
        class_id: "class_001"
    };
    
    try {
        const response = await fetch(studentPerformanceEndpoints.calculatePerformance, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(calculateData)
        });
        
        const data = await response.json();
        console.log('Calculate Performance Response:', data);
        return data;
    } catch (error) {
        console.error('Error testing calculate performance:', error);
    }
}

async function testGetStudentPerformanceBySemester(authToken, studentId, semester, academicYear) {
    console.log('Testing: Get Student Performance by Semester (Admin)');
    
    const url = `${API_BASE}/student-performance/${studentId}/semester/${semester}?academic_year=${academicYear}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        const data = await response.json();
        console.log('Get Student Performance by Semester (Admin) Response:', data);
        return data;
    } catch (error) {
        console.error('Error testing get student performance by semester:', error);
    }
}

async function testGetStudentPerformanceSummary(authToken, studentId) {
    console.log('Testing: Get Student Performance Summary (Admin)');
    
    const url = `${API_BASE}/student-performance/${studentId}/summary`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            }
        });
        
        const data = await response.json();
        console.log('Get Student Performance Summary (Admin) Response:', data);
        return data;
    } catch (error) {
        console.error('Error testing get student performance summary:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('=== Student Performance API Tests ===');
    
    // You'll need to get a valid auth token first
    const authToken = 'your-jwt-token-here';
    
    if (!authToken || authToken === 'your-jwt-token-here') {
        console.log('Please set a valid auth token before running tests');
        return;
    }
    
    // Test student endpoints
    console.log('\n--- Student Endpoints ---');
    await testGetMyPerformance(authToken);
    await testGetMyPerformanceBySemester(authToken, 'Fall', '2024-25');
    await testGetMyPerformanceSummary(authToken);
    
    // Test admin/teacher endpoints
    console.log('\n--- Admin/Teacher Endpoints ---');
    await testCreatePerformance(authToken);
    await testCalculatePerformance(authToken);
    await testGetStudentPerformanceBySemester(authToken, 'student_001', 'Fall', '2024-25');
    await testGetStudentPerformanceSummary(authToken, 'student_001');
    
    console.log('\n=== Tests Completed ===');
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        studentPerformanceEndpoints,
        samplePerformanceData,
        testCreatePerformance,
        testGetMyPerformance,
        testGetMyPerformanceBySemester,
        testGetMyPerformanceSummary,
        testCalculatePerformance,
        testGetStudentPerformanceBySemester,
        testGetStudentPerformanceSummary,
        runAllTests
    };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runAllTests();
}
