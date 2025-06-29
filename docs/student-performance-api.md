# Student Performance API Documentation

## Overview

The Student Performance API provides comprehensive endpoints for managing and retrieving student academic performance data by semester, academic year, and overall summaries. This API supports both student self-access and administrative access for teachers and administrators.

## Base URL

```
/api/student-performance
```

## Authentication

All endpoints require authentication except where noted. Use the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get Current Student's Performance (Student Access)

**Endpoint:** `GET /my-performance`

**Description:** Allows authenticated students to view their own performance data.

**Query Parameters:**
- `semester` (optional): Specific semester to get performance for
- `academic_year` (optional): Academic year for the semester

**Example Requests:**

```bash
# Get all performance data for current student
GET /api/student-performance/my-performance

# Get performance for specific semester
GET /api/student-performance/my-performance?semester=Fall&academic_year=2024-25

# Get performance for specific semester (current academic year)
GET /api/student-performance/my-performance?semester=Spring
```

**Response Example:**

```json
{
    "success": true,
    "data": [
        {
            "id": "perf_001",
            "campus_id": "campus_001",
            "student_id": "student_001",
            "academic_year": "2024-25",
            "semester": "Fall",
            "class_id": "class_001",
            "performance_data": {
                "exam_term_id": "term_001",
                "exam_term_name": "Fall 2024 Final Exams",
                "subjects": [
                    {
                        "subject_id": "math_001",
                        "subject_name": "Mathematics",
                        "marks_obtained": 85,
                        "total_marks": 100,
                        "percentage": 85.0,
                        "grade": "A",
                        "grade_points": 3.5,
                        "examination_id": "exam_001",
                        "examination_name": "Final Exam"
                    }
                ],
                "total_marks_obtained": 425,
                "total_marks_possible": 500,
                "overall_percentage": 85.0,
                "overall_grade": "A",
                "overall_gpa": 3.5,
                "rank": 5,
                "total_students": 30
            },
            "attendance": {
                "total_days": 90,
                "days_present": 85,
                "days_absent": 5,
                "attendance_percentage": 94.4
            },
            "quiz_performance": {
                "total_quizzes": 10,
                "quizzes_attempted": 9,
                "average_score": 82.5,
                "best_score": 95,
                "total_marks_obtained": 165,
                "total_marks_possible": 200
            },
            "assignment_performance": {
                "total_assignments": 8,
                "assignments_submitted": 8,
                "submission_percentage": 100.0,
                "average_score": 88.5,
                "total_marks_obtained": 177,
                "total_marks_possible": 200
            },
            "created_at": "2024-12-01T10:30:00Z",
            "updated_at": "2024-12-15T14:22:00Z"
        }
    ],
    "count": 1
}
```

### 2. Get Current Student's Performance Summary (Student Access)

**Endpoint:** `GET /my-performance/summary`

**Description:** Get a comprehensive performance summary for the authenticated student.

**Query Parameters:**
- `academic_years` (optional): Comma-separated list of academic years to include

**Example Requests:**

```bash
# Get overall performance summary
GET /api/student-performance/my-performance/summary

# Get summary for specific academic years
GET /api/student-performance/my-performance/summary?academic_years=2023-24,2024-25
```

**Response Example:**

```json
{
    "success": true,
    "data": {
        "total_semesters": 4,
        "overall_gpa": 3.2,
        "overall_percentage": 78.5,
        "best_semester": {
            "id": "perf_003",
            "semester": "Spring",
            "academic_year": "2024-25",
            "performance_data": {
                "overall_percentage": 85.0,
                "overall_gpa": 3.5
            }
        },
        "semester_wise_performance": [
            // Array of all semester performance records
        ]
    }
}
```

### 3. Create or Update Student Performance (Admin/Teacher Access)

**Endpoint:** `POST /`

**Description:** Create or update performance data for a student.

**Request Body:**

```json
{
    "student_id": "student_001",
    "academic_year": "2024-25",
    "semester": "Fall",
    "class_id": "class_001",
    "performance_data": {
        "exam_term_id": "term_001",
        "exam_term_name": "Fall 2024 Final Exams",
        "subjects": [
            {
                "subject_id": "math_001",
                "subject_name": "Mathematics",
                "marks_obtained": 85,
                "total_marks": 100,
                "percentage": 85.0,
                "grade": "A",
                "grade_points": 3.5,
                "examination_id": "exam_001",
                "examination_name": "Final Exam"
            }
        ],
        "total_marks_obtained": 425,
        "total_marks_possible": 500,
        "overall_percentage": 85.0,
        "overall_grade": "A",
        "overall_gpa": 3.5,
        "rank": 5,
        "total_students": 30
    },
    "attendance": {
        "total_days": 90,
        "days_present": 85,
        "days_absent": 5,
        "attendance_percentage": 94.4
    },
    "quiz_performance": {
        "total_quizzes": 10,
        "quizzes_attempted": 9,
        "average_score": 82.5,
        "best_score": 95,
        "total_marks_obtained": 165,
        "total_marks_possible": 200
    },
    "assignment_performance": {
        "total_assignments": 8,
        "assignments_submitted": 8,
        "submission_percentage": 100.0,
        "average_score": 88.5,
        "total_marks_obtained": 177,
        "total_marks_possible": 200
    }
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        // Complete performance record
    },
    "message": "Student performance data saved successfully"
}
```

### 4. Calculate and Save Performance Metrics (Admin/Teacher Access)

**Endpoint:** `POST /calculate`

**Description:** Calculate performance metrics from raw data sources and save them.

**Request Body:**

```json
{
    "student_id": "student_001",
    "semester": "Fall",
    "academic_year": "2024-25",
    "class_id": "class_001"
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        // Calculated and saved performance record
    },
    "message": "Performance metrics calculated and saved successfully"
}
```

### 5. Get Student Performance by Semester (Admin/Teacher Access)

**Endpoint:** `GET /:student_id/semester/:semester`

**Description:** Get performance data for a specific student and semester.

**Path Parameters:**
- `student_id`: Student ID
- `semester`: Semester name

**Query Parameters:**
- `academic_year` (optional): Academic year

**Example Requests:**

```bash
GET /api/student-performance/student_001/semester/Fall?academic_year=2024-25
```

### 6. Get Student Performance by Academic Year (Admin/Teacher Access)

**Endpoint:** `GET /:student_id/academic-year/:academic_year`

**Description:** Get all semester performance data for a specific student and academic year.

**Path Parameters:**
- `student_id`: Student ID
- `academic_year`: Academic year

**Example Requests:**

```bash
GET /api/student-performance/student_001/academic-year/2024-25
```

### 7. Get All Student Performance Records (Admin/Teacher Access)

**Endpoint:** `GET /:student_id`

**Description:** Get all performance data for a specific student.

**Path Parameters:**
- `student_id`: Student ID

**Example Requests:**

```bash
GET /api/student-performance/student_001
```

### 8. Get Student Performance Summary (Admin/Teacher Access)

**Endpoint:** `GET /:student_id/summary`

**Description:** Get performance summary for a specific student.

**Path Parameters:**
- `student_id`: Student ID

**Query Parameters:**
- `academic_years` (optional): Comma-separated list of academic years

**Example Requests:**

```bash
GET /api/student-performance/student_001/summary
GET /api/student-performance/student_001/summary?academic_years=2023-24,2024-25
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
    "success": false,
    "message": "Error description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

## Data Models

### Performance Data Structure

The performance data includes:

1. **Exam Performance**: Marks, grades, GPA, and ranking
2. **Attendance**: Days present/absent and percentage
3. **Quiz Performance**: Quiz scores and averages
4. **Assignment Performance**: Submission rates and scores

### Grade Calculation

The system uses the following grading scale:
- A+: 90-100% (4.0 GPA)
- A: 80-89% (3.5 GPA)
- B+: 70-79% (3.0 GPA)
- B: 60-69% (2.5 GPA)
- C: 50-59% (2.0 GPA)
- D: 40-49% (1.5 GPA)
- F: Below 40% (0.0 GPA)

## Usage Examples

### Student Dashboard Integration

```javascript
// Get current student's performance for dashboard
async function getStudentDashboardData() {
    try {
        const response = await fetch('/api/student-performance/my-performance');
        const data = await response.json();
        
        if (data.success) {
            // Display performance data in dashboard
            displayPerformanceData(data.data);
        }
    } catch (error) {
        console.error('Error fetching performance data:', error);
    }
}

// Get performance summary for charts
async function getPerformanceSummary() {
    try {
        const response = await fetch('/api/student-performance/my-performance/summary');
        const data = await response.json();
        
        if (data.success) {
            // Create charts and visualizations
            createPerformanceCharts(data.data);
        }
    } catch (error) {
        console.error('Error fetching performance summary:', error);
    }
}
```

### Teacher/Admin Integration

```javascript
// Calculate and save performance for a student
async function calculateStudentPerformance(studentId, semester, academicYear, classId) {
    try {
        const response = await fetch('/api/student-performance/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                student_id: studentId,
                semester: semester,
                academic_year: academicYear,
                class_id: classId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Performance calculated successfully');
            return data.data;
        }
    } catch (error) {
        console.error('Error calculating performance:', error);
    }
}
```

## Integration Notes

1. **Semester Naming**: Use consistent semester names (e.g., "Fall", "Spring", "Summer")
2. **Academic Year Format**: Use format "YYYY-YY" (e.g., "2024-25")
3. **Performance Calculation**: The API can automatically calculate metrics from raw data sources
4. **Real-time Updates**: Performance data should be updated when new exam results, quiz scores, or assignments are graded
5. **Caching**: Consider implementing caching for performance summaries as they involve complex calculations

## Security Considerations

1. **Student Privacy**: Students can only access their own performance data
2. **Role-based Access**: Admin and teacher routes require appropriate permissions
3. **Data Validation**: All input data is validated using Zod schemas
4. **Audit Trail**: All performance updates are tracked with timestamps

This API provides a comprehensive solution for managing student performance data with appropriate access controls and detailed analytics capabilities.
