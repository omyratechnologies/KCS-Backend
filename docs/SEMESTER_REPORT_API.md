# Semester Report API Documentation

## Overview

The Semester Report API provides comprehensive academic performance reports for students on a semester-wise basis. The system supports two semesters per academic year (sem1 and sem2) and generates detailed reports covering:

- **Attendance**: Total days, present/absent/late/leave breakdown, attendance percentage
- **Exams**: Subject-wise marks, overall percentage, GPA, and grades
- **Quizzes**: Total quizzes, attempts, scores, and performance metrics
- **Assignments**: Submission rates, grading status, and average scores
- **Courses**: Enrollment status, progress tracking, and completion rates
- **Overall Summary**: Performance insights, strengths, and areas for improvement

## Semester Configuration

### Semester Periods

The system defines two semesters per academic year:

- **Semester 1 (sem1)**: August 1 - December 31
- **Semester 2 (sem2)**: January 1 - June 30

### Academic Year Format

Academic years are represented as strings in the format: `"YYYY-YYYY"`

Example: `"2024-2025"`

## API Endpoints

### 1. Admin Endpoint - Get Student Semester Report

**Endpoint**: `POST /api/semester-report/admin`

**Authentication**: Required (Admin role)

**Description**: Allows administrators to generate semester reports for any student.

#### Request Body

```json
{
  "student_id": "student123",
  "class_id": "class123",
  "semester": "sem1",
  "academic_year": "2024-2025"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| student_id | string | Yes | Unique identifier of the student |
| class_id | string | Yes | Unique identifier of the class |
| semester | enum | Yes | Either "sem1" or "sem2" |
| academic_year | string | No | Format: "YYYY-YYYY". If not provided, uses class's current academic year |

#### Response Example

```json
{
  "success": true,
  "data": {
    "student_info": {
      "id": "student123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "class_id": "class123",
      "class_name": "Grade 10 - A"
    },
    "semester_info": {
      "semester": "sem1",
      "academic_year": "2024-2025",
      "class_id": "class123"
    },
    "attendance": {
      "total_days": 120,
      "days_present": 110,
      "days_absent": 5,
      "days_late": 3,
      "days_leave": 2,
      "attendance_percentage": 91.67,
      "status": "Excellent"
    },
    "exams": {
      "total_exams": 6,
      "exams_taken": 6,
      "subjects": [
        {
          "subject_id": "math101",
          "subject_name": "Mathematics",
          "marks_obtained": 85,
          "total_marks": 100,
          "percentage": 85.0,
          "grade": "A"
        }
      ],
      "overall_marks_obtained": 510,
      "overall_total_marks": 600,
      "overall_percentage": 85.0,
      "overall_grade": "A",
      "overall_gpa": 3.7
    },
    "quizzes": {
      "total_quizzes": 15,
      "quizzes_attempted": 14,
      "average_score": 82.5,
      "best_score": 95.0,
      "worst_score": 65.0,
      "total_marks_obtained": 1155,
      "total_marks_possible": 1400,
      "quiz_percentage": 82.5
    },
    "assignments": {
      "total_assignments": 20,
      "assignments_submitted": 18,
      "assignments_graded": 16,
      "submission_percentage": 90.0,
      "average_score": 78.5,
      "total_marks_obtained": 1256,
      "total_marks_possible": 1600,
      "assignment_percentage": 78.5
    },
    "courses": {
      "total_courses": 5,
      "active_courses": 4,
      "completed_courses": 1,
      "average_progress": 68.5,
      "courses_list": [
        {
          "course_id": "course123",
          "course_name": "Introduction to Programming",
          "enrollment_status": "active",
          "progress_percentage": 75.5,
          "enrollment_date": "2024-08-01T00:00:00Z",
          "completion_date": null
        }
      ]
    },
    "overall_summary": {
      "overall_performance": "Good",
      "strengths": [
        "Excellent attendance record",
        "Strong academic performance in exams",
        "Excellent assignment submission rate"
      ],
      "areas_for_improvement": [
        "Quiz performance needs attention"
      ]
    },
    "generated_at": "2024-10-16T10:30:00Z"
  }
}
```

---

### 2. Student Endpoint - Get Own Semester Report

**Endpoint**: `POST /api/semester-report/student`

**Authentication**: Required (Student role)

**Description**: Allows students to generate and view their own semester reports.

#### Request Body

```json
{
  "class_id": "class123",
  "semester": "sem1",
  "academic_year": "2024-2025"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| class_id | string | Yes | Unique identifier of the class |
| semester | enum | Yes | Either "sem1" or "sem2" |
| academic_year | string | No | Format: "YYYY-YYYY". If not provided, uses class's current academic year |

**Note**: The `student_id` is automatically extracted from the authenticated user's token.

#### Response

Same structure as the Admin endpoint response.

---

### 3. Parent Endpoint - Get Student Semester Report

**Endpoint**: `POST /api/semester-report/parent`

**Authentication**: Required (Parent role)

**Description**: Allows parents to generate semester reports for their linked students.

#### Request Body

```json
{
  "student_id": "student123",
  "class_id": "class123",
  "semester": "sem1",
  "academic_year": "2024-2025"
}
```

#### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| student_id | string | Yes | Unique identifier of the student (must be linked to parent) |
| class_id | string | Yes | Unique identifier of the class |
| semester | enum | Yes | Either "sem1" or "sem2" |
| academic_year | string | No | Format: "YYYY-YYYY". If not provided, uses class's current academic year |

**Note**: The system verifies that the parent has access to the requested student's data through the parent-student relationship stored in the parent's `meta_data.student_ids` array.

#### Response

Same structure as the Admin endpoint response, or error if parent doesn't have access:

```json
{
  "success": false,
  "message": "You do not have access to this student's data"
}
```

---

## Response Fields Explained

### Student Info
Contains basic information about the student including their name, email, class details.

### Semester Info
Specifies which semester and academic year the report covers.

### Attendance
- **total_days**: Total number of days in the semester
- **days_present**: Days student was marked present
- **days_absent**: Days student was marked absent
- **days_late**: Days student was marked late
- **days_leave**: Days student was on approved leave
- **attendance_percentage**: Calculated as (days_present / total_days) × 100
- **status**: Qualitative rating:
  - Excellent: ≥90%
  - Good: 75-89%
  - Average: 60-74%
  - Poor: <60%

### Exams
- **subjects**: Array of individual subject performance
- **overall_percentage**: Aggregate percentage across all subjects
- **overall_grade**: Letter grade based on overall percentage
- **overall_gpa**: GPA on a 4.0 scale

### Quizzes
- **total_quizzes**: All quizzes conducted in the class during the semester
- **quizzes_attempted**: Number of quizzes the student participated in
- **average_score**: Mean score across all attempted quizzes
- **best_score/worst_score**: Highest and lowest quiz scores

### Assignments
- **total_assignments**: All assignments given during the semester
- **assignments_submitted**: Number of assignments the student submitted
- **assignments_graded**: Submitted assignments that have been graded
- **submission_percentage**: (assignments_submitted / total_assignments) × 100
- **average_score**: Mean score of graded assignments

### Courses
- **total_courses**: All courses enrolled during the semester
- **active_courses**: Currently ongoing courses
- **completed_courses**: Successfully completed courses
- **average_progress**: Mean progress percentage across all courses
- **courses_list**: Detailed list with individual course progress

### Overall Summary
- **overall_performance**: Aggregate performance rating
- **strengths**: Automatically identified areas of excellence
- **areas_for_improvement**: Automatically identified areas needing attention

---

## Grading System

### Letter Grades

| Percentage Range | Grade |
|------------------|-------|
| 90-100 | A+ |
| 85-89 | A |
| 80-84 | A- |
| 75-79 | B+ |
| 70-74 | B |
| 65-69 | B- |
| 60-64 | C+ |
| 55-59 | C |
| 50-54 | C- |
| 45-49 | D |
| 0-44 | F |

### GPA Scale

| Percentage Range | GPA |
|------------------|-----|
| 90-100 | 4.0 |
| 85-89 | 3.7 |
| 80-84 | 3.3 |
| 75-79 | 3.0 |
| 70-74 | 2.7 |
| 65-69 | 2.3 |
| 60-64 | 2.0 |
| 55-59 | 1.7 |
| 50-54 | 1.3 |
| 45-49 | 1.0 |
| 0-44 | 0.0 |

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid semester. Must be 'sem1' or 'sem2'"
}
```

```json
{
  "success": false,
  "message": "student_id and class_id are required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "You do not have access to this student's data"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Student not found"
}
```

```json
{
  "success": false,
  "message": "Class not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Parent-Student Relationship

For parents to access student reports, the parent's user record must contain the student ID in their metadata:

```json
{
  "user_type": "Parent",
  "meta_data": {
    "student_ids": ["student123", "student456"]
  }
}
```

The system automatically verifies this relationship before allowing access.

---

## Implementation Notes

### Service Layer
- **File**: `src/services/semester_report.service.ts`
- **Main Method**: `generateSemesterReport(student_id, class_id, semester, academic_year)`
- **Helper Methods**:
  - `getAttendanceData()`: Fetches and calculates attendance metrics
  - `getExamData()`: Aggregates exam results from student records
  - `getQuizData()`: Compiles quiz submission data
  - `getAssignmentData()`: Gathers assignment submission and grading info
  - `getCourseData()`: Retrieves course enrollment and progress
  - `generateOverallSummary()`: Analyzes data to provide insights

### Controller Layer
- **File**: `src/controllers/semester_report.controller.ts`
- **Methods**:
  - `getStudentSemesterReport()`: Admin endpoint handler
  - `getOwnSemesterReport()`: Student endpoint handler
  - `getStudentSemesterReportByParent()`: Parent endpoint handler

### Routes
- **File**: `src/routes/semester_report.route.ts`
- **Base Path**: `/api/semester-report`
- **Middleware**: Authentication middleware applied to all routes

### Schema Validation
- **File**: `src/schema/semester_report.ts`
- Uses Zod for request validation and type safety

---

## Usage Examples

### Example 1: Admin Generating Report

```bash
curl -X POST https://api.example.com/api/semester-report/admin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student123",
    "class_id": "class123",
    "semester": "sem1",
    "academic_year": "2024-2025"
  }'
```

### Example 2: Student Viewing Own Report

```bash
curl -X POST https://api.example.com/api/semester-report/student \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": "class123",
    "semester": "sem2"
  }'
```

### Example 3: Parent Viewing Child's Report

```bash
curl -X POST https://api.example.com/api/semester-report/parent \
  -H "Authorization: Bearer <parent_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student123",
    "class_id": "class123",
    "semester": "sem1",
    "academic_year": "2024-2025"
  }'
```

---

## Future Enhancements

Potential improvements for future versions:

1. **PDF Export**: Generate downloadable PDF reports
2. **Email Delivery**: Automatically email reports to students/parents
3. **Historical Comparison**: Compare performance across multiple semesters
4. **Ranking**: Show student's rank within the class
5. **Graphical Analytics**: Add charts and visualizations
6. **Custom Date Ranges**: Allow flexible semester date configuration
7. **Weighted Scoring**: Implement configurable weights for different metrics
8. **Comments Section**: Allow teachers to add personalized comments
9. **Goal Setting**: Enable students to set and track semester goals
10. **Batch Generation**: Generate reports for entire classes at once

---

## Support

For issues or questions regarding the Semester Report API, please contact the development team or refer to the main backend documentation.
