# 🧪 Assignment API Testing Guide

## 🎯 Overview

This guide provides comprehensive testing instructions for the Enhanced Assignment API system. It covers all endpoints, test scenarios, and validation steps.

## 🚀 Quick Start

### 1. Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select `Assignment_API.postman_collection.json`
4. Update variables:
   - `base_url`: Your server URL (default: `http://localhost:3000/api/v1/assignments`)
   - `auth_token`: Your JWT token
   - `student_id`, `assignment_id`, `submission_id`: Valid IDs from your database

### 2. Environment Setup

Create a Postman environment with these variables:

```json
{
  "base_url": "http://localhost:3000/api/v1/assignments",
  "auth_token": "your-jwt-token-here",
  "admin_token": "admin-jwt-token",
  "teacher_token": "teacher-jwt-token", 
  "student_token": "student-jwt-token",
  "parent_token": "parent-jwt-token",
  "student_id": "student_123",
  "assignment_id": "assignment_456",
  "submission_id": "submission_789",
  "class_id": "class_101",
  "subject_id": "subject_202"
}
```

## 🎯 Core Test Scenarios

### 🔥 **Test 1: Unified Student View (KEY FEATURE)**

**Objective**: Verify that students can see ALL assignments across classes and courses in one unified view.

```bash
# Test unified view
curl -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  "${BASE_URL}/student/my-assignments?status=all&sort_by=due_date"

# Expected: Single response with assignments from multiple sources
```

**Validation Checklist**:
- ✅ Response contains assignments from both classes and courses
- ✅ Each assignment shows `source_type` (class/course) and `source_name`
- ✅ Consistent data structure across all assignments
- ✅ Summary section shows comprehensive stats
- ✅ Pagination works correctly

### 🔍 **Test 2: Smart Filtering**

Test various filtering combinations:

```bash
# Pending assignments only
GET /student/my-assignments?status=pending

# Overdue assignments
GET /student/my-assignments?status=overdue

# Due in next 7 days
GET /student/my-assignments?due_in_days=7

# By subject
GET /student/my-assignments?subject_id=math_101

# Priority sorting
GET /student/my-assignments?sort_by=priority&sort_order=desc
```

### 📊 **Test 3: Dashboard Functionality**

```bash
# Student dashboard
GET /student/dashboard

# Teacher dashboard  
GET /teacher/dashboard

# Admin overview
GET /admin/overview
```

**Validation**:
- ✅ Upcoming assignments sorted by urgency
- ✅ Overdue assignments highlighted
- ✅ Recent grades displayed
- ✅ Performance statistics accurate

### 🔐 **Test 4: Role-Based Access Control**

Test that each role can only access appropriate endpoints:

```bash
# Student trying to access admin endpoint (should fail)
curl -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  "${BASE_URL}/admin/overview"
# Expected: 403 Forbidden

# Teacher accessing their own assignments (should succeed)
curl -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  "${BASE_URL}/teacher/my-assignments"
# Expected: 200 OK

# Parent accessing child's data (should succeed)
curl -H "Authorization: Bearer ${PARENT_TOKEN}" \
  "${BASE_URL}/parent/student/${STUDENT_ID}/assignments"
# Expected: 200 OK
```

## 📋 Detailed Test Cases

### 🎓 Student Endpoints

#### Test Case 1.1: Get All Assignments
```http
GET /student/my-assignments?status=all&page=1&limit=20

Expected Response Structure:
{
  "assignments": [...],
  "summary": {
    "total_assignments": number,
    "pending": number,
    "submitted": number,
    "graded": number,
    "overdue": number
  },
  "pagination": {...}
}
```

#### Test Case 1.2: Submit Assignment
```http
POST /student/{assignment_id}/submit
Content-Type: application/json

{
  "submission_text": "My solution...",
  "attachments": [...]
}

Expected: 201 Created with submission details
```

#### Test Case 1.3: Performance Analytics
```http
GET /student/performance?period=month

Expected: Performance trends and subject breakdown
```

### 👩‍🏫 Teacher Endpoints

#### Test Case 2.1: Create Assignment
```http
POST /
Content-Type: application/json

{
  "title": "Test Assignment",
  "description": "Test description",
  "assignment_type": "homework",
  "subject_id": "subject_123",
  "class_id": "class_456",
  "due_date": "2024-08-15T23:59:59Z",
  "total_marks": 100
}

Expected: 201 Created with assignment details
```

#### Test Case 2.2: Grade Submission
```http
POST /teacher/submissions/{submission_id}/grade
Content-Type: application/json

{
  "grade": 85,
  "feedback": "Excellent work!"
}

Expected: 200 OK with updated submission
```

### 🔐 Admin Endpoints

#### Test Case 3.1: System Overview
```http
GET /admin/overview?period=month&class_id=class_123

Expected: Comprehensive system statistics
```

#### Test Case 3.2: Bulk Operations
```http
POST /admin/bulk-operations
Content-Type: application/json

{
  "operation": "extend_due_date",
  "assignment_ids": ["id1", "id2"],
  "parameters": {
    "new_due_date": "2024-08-20T23:59:59Z"
  }
}

Expected: 200 OK with operation results
```

### 👨‍👩‍👧‍👦 Parent Endpoints

#### Test Case 4.1: Child's Assignments
```http
GET /parent/student/{student_id}/assignments

Expected: Child's assignment overview with alerts
```

## 🔍 Data Validation Tests

### Assignment Data Integrity
```bash
# Verify assignment structure
GET /student/my-assignments

# Check required fields:
- id, title, subject_name, due_date
- source_type, source_name, teacher_name
- status, priority, days_until_due
```

### Submission Workflow
```bash
# 1. Get assignment details
GET /student/{assignment_id}

# 2. Submit assignment
POST /student/{assignment_id}/submit

# 3. Verify submission appears in list
GET /student/my-assignments?status=submitted

# 4. Teacher grades submission
POST /teacher/submissions/{submission_id}/grade

# 5. Verify grade appears for student
GET /student/my-assignments?status=graded
```

## 📱 Mobile App Testing

### Performance Tests
```bash
# Large dataset pagination
GET /student/my-assignments?limit=50&page=1

# Dashboard optimization
GET /student/dashboard

# Quick status checks
GET /student/my-assignments?status=pending&limit=5
```

### Offline Capability Tests
```bash
# Cache-friendly endpoints
GET /student/dashboard
GET /student/my-assignments?status=pending

# Verify response includes:
- ETag headers for caching
- Minimal payload size
- Essential data only
```

## 🚨 Error Handling Tests

### Authentication Errors
```bash
# No token
curl "${BASE_URL}/student/my-assignments"
# Expected: 401 Unauthorized

# Invalid token
curl -H "Authorization: Bearer invalid-token" \
  "${BASE_URL}/student/my-assignments"
# Expected: 401 Unauthorized
```

### Authorization Errors
```bash
# Student accessing admin endpoint
curl -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  "${BASE_URL}/admin/overview"
# Expected: 403 Forbidden
```

### Validation Errors
```bash
# Invalid assignment creation
curl -X POST -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title": ""}' \
  "${BASE_URL}/"
# Expected: 400 Bad Request with validation details
```

### Not Found Errors
```bash
# Non-existent assignment
curl -H "Authorization: Bearer ${STUDENT_TOKEN}" \
  "${BASE_URL}/student/non-existent-id"
# Expected: 404 Not Found
```

## 🎯 Load Testing

### Concurrent User Tests
```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 -H "Authorization: Bearer ${TOKEN}" \
  "${BASE_URL}/student/my-assignments"

# Expected: Consistent response times under load
```

### Large Dataset Tests
```bash
# Test with 100+ assignments per student
GET /student/my-assignments?limit=100

# Verify:
- Response time < 2 seconds
- Proper pagination
- Memory usage stable
```

## 📊 Analytics Validation

### Performance Metrics
```bash
# Test analytics endpoints
GET /admin/analytics?period=month
GET /student/performance?period=quarter

# Verify calculations:
- Completion rates match actual data
- Grade averages are correct
- Trend calculations accurate
```

## 🔧 Automated Testing

### Jest Test Examples
```javascript
describe('Assignment API Tests', () => {
  test('Student can get unified assignments', async () => {
    const response = await request(app)
      .get('/api/v1/assignments/student/my-assignments')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
      
    expect(response.body.assignments).toBeInstanceOf(Array);
    expect(response.body.summary).toBeDefined();
  });
  
  test('Teacher can grade submission', async () => {
    const gradeData = { grade: 85, feedback: 'Good work!' };
    
    const response = await request(app)
      .post(`/api/v1/assignments/teacher/submissions/${submissionId}/grade`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(gradeData)
      .expect(200);
      
    expect(response.body.submission.grade).toBe(85);
  });
});
```

## 📝 Test Reporting

### Test Results Template
```
Assignment API Test Results
==========================

✅ Unified Student View: PASS
✅ Role-Based Access: PASS
✅ Data Integrity: PASS
✅ Performance: PASS
❌ Load Testing: FAIL (needs optimization)

Key Issues Found:
1. Slow response for large datasets
2. Missing cache headers
3. Pagination edge case bug

Recommendations:
1. Add database indexing
2. Implement response caching
3. Fix pagination logic
```

## 🎯 Success Criteria

### Functional Requirements
- ✅ All endpoints return expected data structures
- ✅ Role-based access control works correctly
- ✅ Unified student view aggregates all assignment sources
- ✅ CRUD operations function properly
- ✅ Error handling is comprehensive

### Performance Requirements
- ✅ Response time < 2 seconds for all endpoints
- ✅ Supports 100+ concurrent users
- ✅ Handles large datasets efficiently
- ✅ Mobile-optimized payloads

### Security Requirements
- ✅ JWT authentication required
- ✅ Role-based authorization enforced
- ✅ Input validation prevents injection
- ✅ Sensitive data protected

## 🚀 Getting Started Checklist

1. **Setup Environment**
   - [ ] Start your server
   - [ ] Import Postman collection
   - [ ] Configure environment variables
   - [ ] Obtain valid JWT tokens for each role

2. **Core Feature Testing**
   - [ ] Test unified student view
   - [ ] Verify role-based access
   - [ ] Test assignment submission workflow
   - [ ] Validate dashboard functionality

3. **Edge Case Testing**
   - [ ] Test with empty datasets
   - [ ] Test with large datasets
   - [ ] Test error conditions
   - [ ] Test concurrent access

4. **Performance Testing**
   - [ ] Load testing
   - [ ] Response time validation
   - [ ] Memory usage monitoring
   - [ ] Mobile optimization verification

This comprehensive testing approach ensures that your Enhanced Assignment API delivers the unified, role-based assignment management experience as designed!
