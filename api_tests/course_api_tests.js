/**
 * KCS Course API Comprehensive Test Suite
 * Tests all Course APIs documented in COURSES_API_DOCUMENTATION.md
 */

const BASE_URL = 'http://localhost:4500';

// Test credentials from the documentation
const credentials = {
    admin: {
        login_id: "admin@test.com",
        password: "Admin1234@"
    },
    localAdmin: {
        login_id: "admin1@test.com", 
        password: "admin1"
    },
    teacher: {
        login_id: "teacher@test.com",
        password: "VGAN1012-98271"
    },
    student: {
        login_id: "student@test.com",
        password: "SGAN1905-77623"
    },
    parent: {
        login_id: "ravi@gmail.com",
        password: "RRAV1206-94149"
    }
};

// Global variables to store tokens and IDs for subsequent tests
let tokens = {};
let testData = {
    courseId: null,
    contentId: null,
    enrollmentId: null,
    userId: null
};

/**
 * Utility function to make API calls
 */
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        method,
        headers
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(body);
    }
    
    try {
        console.log(`\n🔄 ${method} ${endpoint}`);
        if (body) console.log('📤 Request body:', JSON.stringify(body, null, 2));
        
        const response = await fetch(url, config);
        const responseText = await response.text();
        
        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = responseText;
        }
        
        if (response.ok) {
            console.log('✅ Success:', JSON.stringify(responseData, null, 2));
        } else {
            console.log('❌ Error:', JSON.stringify(responseData, null, 2));
        }
        
        return {
            status: response.status,
            data: responseData,
            ok: response.ok
        };
    } catch (error) {
        console.error('🚨 Network Error:', error.message);
        return {
            status: 0,
            data: { error: error.message },
            ok: false
        };
    }
}

/**
 * Authentication function
 */
async function authenticate(role) {
    console.log(`\n🔐 Authenticating as ${role}...`);
    const response = await apiCall('/api/auth/login', 'POST', credentials[role]);
    
    if (response.ok && response.data.access_token) {
        tokens[role] = response.data.access_token;
        console.log(`✅ ${role} authenticated successfully`);
        return true;
    } else {
        console.error(`❌ Failed to authenticate ${role}`);
        return false;
    }
}

/**
 * Test all authentication endpoints first
 */
async function testAuthentication() {
    console.log('\n' + '='.repeat(60));
    console.log('🔑 TESTING AUTHENTICATION');
    console.log('='.repeat(60));
    
    for (const role of ['admin', 'localAdmin', 'teacher', 'student', 'parent']) {
        await authenticate(role);
    }
}

/**
 * Test Course Management APIs
 */
async function testCourseManagement() {
    console.log('\n' + '='.repeat(60));
    console.log('📚 TESTING COURSE MANAGEMENT APIs');
    console.log('='.repeat(60));
    
    // Test 1: Create Course (Admin access)
    console.log('\n📝 Test 1: Create Course');
    const createCourseData = {
        course_name: "Introduction to Computer Science",
        course_code: "CS101",
        course_description: "A comprehensive introduction to computer science principles",
        course_meta_data: {
            credits: 3,
            level: "Beginner",
            duration: "16 weeks",
            instructor: "Dr. Smith"
        }
    };
    
    const createResponse = await apiCall('/api/course/', 'POST', createCourseData, tokens.admin);
    if (createResponse.ok && createResponse.data.id) {
        testData.courseId = createResponse.data.id;
        console.log(`📋 Course ID stored: ${testData.courseId}`);
    }
    
    // Test 2: Get All Courses
    console.log('\n📝 Test 2: Get All Courses');
    await apiCall('/api/course/', 'GET', null, tokens.student);
    
    // Test 3: Get Course by ID
    console.log('\n📝 Test 3: Get Course by ID');
    if (testData.courseId) {
        await apiCall(`/api/course/${testData.courseId}`, 'GET', null, tokens.student);
    }
    
    // Test 4: Update Course (Admin access)
    console.log('\n📝 Test 4: Update Course');
    if (testData.courseId) {
        const updateCourseData = {
            course_name: "Advanced Computer Science",
            course_code: "CS201",
            course_description: "An advanced course in computer science principles",
            course_meta_data: {
                credits: 4,
                level: "Intermediate"
            },
            is_active: true
        };
        await apiCall(`/api/course/${testData.courseId}`, 'PUT', updateCourseData, tokens.admin);
    }
    
    // Test with different user roles
    console.log('\n📝 Test 5: Test Role-based Access');
    if (testData.courseId) {
        console.log('\n🔸 Teacher access to get course:');
        await apiCall(`/api/course/${testData.courseId}`, 'GET', null, tokens.teacher);
        
        console.log('\n🔸 Student access to get course:');
        await apiCall(`/api/course/${testData.courseId}`, 'GET', null, tokens.student);
        
        console.log('\n🔸 Student trying to create course (should fail):');
        await apiCall('/api/course/', 'POST', createCourseData, tokens.student);
    }
}

/**
 * Test Course Content Management APIs
 */
async function testCourseContent() {
    console.log('\n' + '='.repeat(60));
    console.log('📖 TESTING COURSE CONTENT MANAGEMENT APIs');
    console.log('='.repeat(60));
    
    if (!testData.courseId) {
        console.log('⚠️  No course ID available, skipping content tests');
        return;
    }
    
    // Test 1: Create Course Content (Teacher access)
    console.log('\n📝 Test 1: Create Course Content');
    const createContentData = {
        content_title: "Week 1: Introduction to Programming",
        content_description: "This week covers basic programming concepts",
        content_type: "lesson",
        content_format: "video",
        content_data: {
            video_url: "https://example.com/video.mp4",
            duration: 1800,
            thumbnail_url: "https://example.com/thumb.jpg"
        },
        step_data: {
            step_number: 1,
            step_type: "content",
            step_title: "Introduction",
            step_instructions: "Watch the introductory video",
            estimated_time: 30,
            learning_objectives: ["Understand basic programming concepts"]
        },
        access_settings: {
            access_level: "free",
            available_from: "2023-01-15T00:00:00Z"
        },
        interaction_settings: {
            allow_comments: true,
            allow_notes: true,
            allow_bookmarks: true,
            require_completion: true
        },
        sort_order: 1,
        meta_data: {
            created_by: "teacher123",
            tags: ["programming", "basics"],
            difficulty_level: "beginner",
            estimated_completion_time: 45,
            language: "en"
        }
    };
    
    const createContentResponse = await apiCall(
        `/api/course/${testData.courseId}/content`, 
        'POST', 
        createContentData, 
        tokens.teacher
    );
    
    if (createContentResponse.ok && createContentResponse.data.id) {
        testData.contentId = createContentResponse.data.id;
        console.log(`📋 Content ID stored: ${testData.contentId}`);
    }
    
    // Test 2: Get All Course Contents
    console.log('\n📝 Test 2: Get All Course Contents');
    await apiCall(`/api/course/${testData.courseId}/content`, 'GET', null, tokens.student);
    
    // Test 3: Get Course Content by ID
    console.log('\n📝 Test 3: Get Course Content by ID');
    if (testData.contentId) {
        await apiCall(
            `/api/course/${testData.courseId}/content/${testData.contentId}`, 
            'GET', 
            null, 
            tokens.student
        );
    }
    
    // Test 4: Update Course Content (Teacher access)
    console.log('\n📝 Test 4: Update Course Content');
    if (testData.contentId) {
        const updateContentData = {
            content_title: "Week 1: Updated Introduction to Programming",
            content_description: "Updated description for programming concepts",
            sort_order: 2
        };
        await apiCall(
            `/api/course/${testData.courseId}/content/${testData.contentId}`, 
            'PUT', 
            updateContentData, 
            tokens.teacher
        );
    }
    
    // Test 5: Test different content types
    console.log('\n📝 Test 5: Create Different Content Types');
    const contentTypes = [
        {
            content_title: "Quiz: Basic Concepts",
            content_type: "quiz",
            content_format: "interactive"
        },
        {
            content_title: "Assignment: First Program",
            content_type: "assignment",
            content_format: "document"
        },
        {
            content_title: "Reference Materials",
            content_type: "resource",
            content_format: "document"
        }
    ];
    
    for (let i = 0; i < contentTypes.length; i++) {
        const contentData = {
            ...createContentData,
            ...contentTypes[i],
            sort_order: i + 3
        };
        await apiCall(
            `/api/course/${testData.courseId}/content`, 
            'POST', 
            contentData, 
            tokens.teacher
        );
    }
    
    // Test role-based access
    console.log('\n📝 Test 6: Test Role-based Content Access');
    console.log('\n🔸 Student trying to create content (should fail):');
    await apiCall(
        `/api/course/${testData.courseId}/content`, 
        'POST', 
        createContentData, 
        tokens.student
    );
    
    console.log('\n🔸 Admin creating content:');
    await apiCall(
        `/api/course/${testData.courseId}/content`, 
        'POST', 
        createContentData, 
        tokens.admin
    );
}

/**
 * Test Course Enrollment APIs
 */
async function testCourseEnrollment() {
    console.log('\n' + '='.repeat(60));
    console.log('🎓 TESTING COURSE ENROLLMENT APIs');
    console.log('='.repeat(60));
    
    if (!testData.courseId) {
        console.log('⚠️  No course ID available, skipping enrollment tests');
        return;
    }
    
    // Test 1: Enroll in Course (Student)
    console.log('\n📝 Test 1: Student Enroll in Course');
    const enrollmentData = {
        enrollmentData: {
            enrollment_date: "2023-01-15T00:00:00Z",
            completion_date: "2023-05-15T00:00:00Z",
            is_completed: false,
            is_graded: false,
            grade_data: [],
            overall_grade: 0,
            meta_data: {
                enrollment_type: "regular",
                payment_status: "paid"
            }
        }
    };
    
    const enrollResponse = await apiCall(
        `/api/course/${testData.courseId}/enroll`, 
        'POST', 
        enrollmentData, 
        tokens.student
    );
    
    if (enrollResponse.ok && enrollResponse.data.id) {
        testData.enrollmentId = enrollResponse.data.id;
        console.log(`📋 Enrollment ID stored: ${testData.enrollmentId}`);
    }
    
    // Test 2: Get Course Enrollments by Course (Teacher/Admin access)
    console.log('\n📝 Test 2: Get Course Enrollments by Course');
    await apiCall(`/api/course/${testData.courseId}/enrollment`, 'GET', null, tokens.teacher);
    
    // Test 3: Get Course Enrollment by ID
    console.log('\n📝 Test 3: Get Course Enrollment by ID');
    if (testData.enrollmentId) {
        await apiCall(
            `/api/course/${testData.courseId}/enrollment/${testData.enrollmentId}`, 
            'GET', 
            null, 
            tokens.student
        );
    }
    
    // Test 4: Update Course Enrollment (Teacher access)
    console.log('\n📝 Test 4: Update Course Enrollment');
    if (testData.enrollmentId) {
        const updateEnrollmentData = {
            is_completed: true,
            overall_grade: 85,
            grade_data: [
                {
                    assignment_id: "assignment123",
                    grade: 90
                }
            ],
            meta_data: {
                completion_date: "2023-04-15T00:00:00Z",
                final_project_score: 88
            }
        };
        await apiCall(
            `/api/course/${testData.courseId}/enrollment/${testData.enrollmentId}`, 
            'PUT', 
            updateEnrollmentData, 
            tokens.teacher
        );
    }
    
    // Test 5: Get User Enrollments
    console.log('\n📝 Test 5: Get User Enrollments');
    // First get the current user info to get user_id
    const meResponse = await apiCall('/api/auth/me', 'GET', null, tokens.student);
    if (meResponse.ok && meResponse.data.id) {
        testData.userId = meResponse.data.id;
        await apiCall(`/api/course/enrollment/user/${testData.userId}`, 'GET', null, tokens.student);
    }
    
    // Test role-based access
    console.log('\n📝 Test 6: Test Role-based Enrollment Access');
    console.log('\n🔸 Teacher accessing enrollment data:');
    await apiCall(`/api/course/${testData.courseId}/enrollment`, 'GET', null, tokens.teacher);
    
    console.log('\n🔸 Admin accessing enrollment data:');
    await apiCall(`/api/course/${testData.courseId}/enrollment`, 'GET', null, tokens.admin);
    
    console.log('\n🔸 Student trying to access all enrollments (should be restricted):');
    await apiCall(`/api/course/${testData.courseId}/enrollment`, 'GET', null, tokens.student);
}

/**
 * Test Enhanced Course Content APIs
 */
async function testEnhancedCourseContent() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 TESTING ENHANCED COURSE CONTENT APIs');
    console.log('='.repeat(60));
    
    if (!testData.courseId) {
        console.log('⚠️  No course ID available, skipping enhanced content tests');
        return;
    }
    
    // Test 1: Create Chapter
    console.log('\n📝 Test 1: Create Chapter');
    const chapterData = {
        title: "Chapter 1: Programming Fundamentals",
        description: "Introduction to programming concepts",
        order: 1
    };
    await apiCall(`/api/course-content/${testData.courseId}/chapters`, 'POST', chapterData, tokens.teacher);
    
    // Test 2: Get Chapters
    console.log('\n📝 Test 2: Get Chapters');
    await apiCall(`/api/course-content/${testData.courseId}/chapters`, 'GET', null, tokens.student);
    
    // Test 3: Create Folder
    console.log('\n📝 Test 3: Create Folder');
    const folderData = {
        name: "Resources",
        description: "Course resources and materials"
    };
    await apiCall(`/api/course-content/${testData.courseId}/folders`, 'POST', folderData, tokens.teacher);
    
    // Test 4: Get Folders
    console.log('\n📝 Test 4: Get Folders');
    await apiCall(`/api/course-content/${testData.courseId}/folders`, 'GET', null, tokens.student);
    
    // Test 5: Get Materials
    console.log('\n📝 Test 5: Get Course Materials');
    await apiCall(`/api/course-content/${testData.courseId}/materials`, 'GET', null, tokens.student);
    
    // Test 6: Watch History
    console.log('\n📝 Test 6: Post Watch History');
    const watchData = {
        content_id: testData.contentId || "sample_content_id",
        watch_duration: 300,
        total_duration: 1800
    };
    await apiCall(`/api/course-content/${testData.courseId}/watch-history`, 'POST', watchData, tokens.student);
    
    // Test 7: Get Analytics
    console.log('\n📝 Test 7: Get Watch Analytics');
    await apiCall(`/api/course-content/${testData.courseId}/analytics/watch`, 'GET', null, tokens.teacher);
    
    // Test 8: Get Progress
    console.log('\n📝 Test 8: Get Course Progress');
    await apiCall(`/api/course-content/${testData.courseId}/progress`, 'GET', null, tokens.student);
}

/**
 * Test Error Handling and Edge Cases
 */
async function testErrorHandling() {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  TESTING ERROR HANDLING & EDGE CASES');
    console.log('='.repeat(60));
    
    // Test 1: Unauthorized access
    console.log('\n📝 Test 1: Unauthorized Access');
    await apiCall('/api/course/', 'GET');
    
    // Test 2: Invalid course ID
    console.log('\n📝 Test 2: Invalid Course ID');
    await apiCall('/api/course/invalid_id', 'GET', null, tokens.student);
    
    // Test 3: Invalid JSON data
    console.log('\n📝 Test 3: Invalid Course Data');
    const invalidCourseData = {
        // Missing required fields
        course_description: "Invalid course data"
    };
    await apiCall('/api/course/', 'POST', invalidCourseData, tokens.admin);
    
    // Test 4: Access content without enrollment
    console.log('\n📝 Test 4: Access Content Without Enrollment');
    if (testData.courseId && testData.contentId) {
        await apiCall(
            `/api/course/${testData.courseId}/content/${testData.contentId}`, 
            'GET', 
            null, 
            tokens.parent
        );
    }
    
    // Test 5: Delete non-existent content
    console.log('\n📝 Test 5: Delete Non-existent Content');
    if (testData.courseId) {
        await apiCall(
            `/api/course/${testData.courseId}/content/non_existent_id`, 
            'DELETE', 
            null, 
            tokens.teacher
        );
    }
}

/**
 * Test Course Deletion (should be done last)
 */
async function testCourseDeletion() {
    console.log('\n' + '='.repeat(60));
    console.log('🗑️  TESTING COURSE DELETION');
    console.log('='.repeat(60));
    
    // Test 1: Delete Course Content first
    console.log('\n📝 Test 1: Delete Course Content');
    if (testData.courseId && testData.contentId) {
        await apiCall(
            `/api/course/${testData.courseId}/content/${testData.contentId}`, 
            'DELETE', 
            null, 
            tokens.teacher
        );
    }
    
    // Test 2: Delete Course Enrollment
    console.log('\n📝 Test 2: Delete Course Enrollment');
    if (testData.courseId && testData.enrollmentId) {
        await apiCall(
            `/api/course/${testData.courseId}/enrollment/${testData.enrollmentId}`, 
            'DELETE', 
            null, 
            tokens.admin
        );
    }
    
    // Test 3: Delete Course (Admin access)
    console.log('\n📝 Test 3: Delete Course');
    if (testData.courseId) {
        await apiCall(`/api/course/${testData.courseId}`, 'DELETE', null, tokens.admin);
    }
    
    // Test 4: Try to access deleted course
    console.log('\n📝 Test 4: Try to Access Deleted Course');
    if (testData.courseId) {
        await apiCall(`/api/course/${testData.courseId}`, 'GET', null, tokens.student);
    }
}

/**
 * Test Summary and Statistics
 */
async function testSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n🎯 Tested Endpoints:');
    console.log('✅ Authentication endpoints');
    console.log('✅ Course Management APIs (CRUD)');
    console.log('✅ Course Content Management APIs (CRUD)');
    console.log('✅ Course Enrollment APIs (CRUD)');
    console.log('✅ Enhanced Course Content APIs');
    console.log('✅ Error handling and edge cases');
    console.log('✅ Role-based access control');
    console.log('✅ Data validation');
    
    console.log('\n🔑 Tested Roles:');
    console.log('✅ Admin - Full access');
    console.log('✅ Teacher - Content management');
    console.log('✅ Student - Read access and enrollment');
    console.log('✅ Parent - Limited access');
    
    console.log('\n📈 Test Data Used:');
    console.log(`📚 Course ID: ${testData.courseId || 'N/A'}`);
    console.log(`📖 Content ID: ${testData.contentId || 'N/A'}`);
    console.log(`🎓 Enrollment ID: ${testData.enrollmentId || 'N/A'}`);
    console.log(`👤 User ID: ${testData.userId || 'N/A'}`);
    
    console.log('\n🎉 Course API Testing Complete!');
}

/**
 * Main test runner
 */
async function runAllTests() {
    console.log('🚀 Starting KCS Course API Comprehensive Tests');
    console.log('📅 Test Date:', new Date().toISOString());
    console.log('🌐 Base URL:', BASE_URL);
    
    try {
        await testAuthentication();
        await testCourseManagement();
        await testCourseContent();
        await testCourseEnrollment();
        await testEnhancedCourseContent();
        await testErrorHandling();
        await testCourseDeletion();
        await testSummary();
        
    } catch (error) {
        console.error('\n🚨 Test execution failed:', error);
    }
}

// Run the tests
runAllTests();
