# Monthly Report Card System Documentation

## Overview

The Monthly Report Card System provides comprehensive monthly performance reports for students, including academic performance, attendance, behavioral metrics, and teacher remarks. The system supports two main user roles:
- **Students**: Can view their own published report cards
- **Teachers/Admins**: Can generate, manage, and publish report cards for students

## Features

### Report Card Components

Each monthly report card includes:

1. **Student Information**
   - Name, email, class, roll number
   - Academic year, month, semester

2. **Attendance Summary**
   - Total days, present, absent, late, leave
   - Attendance percentage
   - Automated remarks based on attendance

3. **Subject-wise Performance**
   - Exam marks (marks obtained, total marks, percentage, grade)
   - Assignment statistics (total, submitted, average grade, completion rate)
   - Quiz statistics (total, attempted, average score, completion rate)
   - Overall subject performance with grade and remarks

4. **Activity Summary**
   - Assignments (total, submitted, pending, overdue, average grade, completion rate)
   - Quizzes (total, attempted, average score, completion rate)
   - Courses (enrolled, in progress, completed, average progress)

5. **Overall Performance**
   - Total marks obtained and possible
   - Overall percentage, grade, and GPA
   - Optional class rank

6. **Behavioral Metrics**
   - Discipline score (based on attendance)
   - Participation score (based on assignment/quiz completion)
   - Punctuality score (based on late attendance)
   - Automated behavioral remarks

7. **Teacher Remarks** (Optional - added by teachers)
   - Subject-wise remarks from teachers
   - Strengths and areas for improvement
   - General achievements
   - Co-curricular activities participation

## API Endpoints

### Student Endpoints

#### 1. Get My Report Card
Get the monthly report card for the authenticated student.

```http
GET /api/report-cards/my-report?month=2024-03
```

**Query Parameters:**
- `month` (required): Month in format YYYY-MM (e.g., "2024-03")

**Response:**
```json
{
  "success": true,
  "data": {
    "report_id": "report_123",
    "student_info": {
      "id": "student_456",
      "name": "John Doe",
      "email": "john@example.com",
      "class_id": "class_789",
      "class_name": "Grade 10-A",
      "roll_number": "101"
    },
    "academic_info": {
      "academic_year": "2023-2024",
      "month": "2024-03",
      "month_name": "March",
      "semester": "Semester 2"
    },
    "attendance": {
      "total_days": 22,
      "present": 20,
      "absent": 1,
      "late": 1,
      "leave": 0,
      "attendance_percentage": 90.91,
      "remarks": "Excellent attendance"
    },
    "subjects_performance": [
      {
        "subject_id": "math_101",
        "subject_name": "Mathematics",
        "exam_marks": {
          "marks_obtained": 85,
          "total_marks": 100,
          "percentage": 85,
          "grade": "A"
        },
        "assignment_stats": {
          "total_assignments": 5,
          "submitted": 5,
          "average_grade": 82,
          "completion_rate": 100
        },
        "quiz_stats": {
          "total_quizzes": 3,
          "attempted": 3,
          "average_score": 88,
          "completion_rate": 100
        },
        "overall_performance": {
          "percentage": 85.25,
          "grade": "A",
          "remarks": "Excellent work"
        }
      }
    ],
    "activity_summary": {
      "assignments": {
        "total": 25,
        "submitted": 23,
        "pending": 2,
        "overdue": 0,
        "average_grade": 81.5,
        "completion_rate": 92
      },
      "quizzes": {
        "total": 15,
        "attempted": 14,
        "average_score": 85.3,
        "completion_rate": 93.33
      },
      "courses": {
        "enrolled": 3,
        "in_progress": 2,
        "completed": 1,
        "average_progress": 68.5
      }
    },
    "overall_performance": {
      "total_marks_obtained": 425.5,
      "total_marks_possible": 500,
      "overall_percentage": 85.1,
      "overall_grade": "A",
      "overall_gpa": 4.0
    },
    "behavioral_metrics": {
      "discipline_score": 90.91,
      "participation_score": 92.67,
      "punctuality_score": 95.45,
      "remarks": [
        "Excellent discipline and attendance",
        "Highly engaged and participative",
        "Always punctual"
      ]
    },
    "teacher_remarks": [
      {
        "subject_id": "math_101",
        "subject_name": "Mathematics",
        "teacher_name": "Mr. Smith",
        "remarks": "Excellent progress this month",
        "strengths": ["Problem solving", "Quick learner"],
        "areas_for_improvement": ["Show more work in solutions"]
      }
    ],
    "achievements": [
      "Won mathematics quiz competition",
      "Perfect attendance award"
    ],
    "generated_at": "2024-03-31T10:00:00.000Z",
    "generated_by": "teacher_123"
  },
  "message": "Report card retrieved successfully"
}
```

### Teacher/Admin Endpoints

#### 2. Get Student Report Card
Get a specific student's monthly report card.

```http
GET /api/report-cards/student/{student_id}?month=2024-03
```

**Path Parameters:**
- `student_id` (required): Student ID

**Query Parameters:**
- `month` (required): Month in format YYYY-MM

**Response:** Same as endpoint #1

---

#### 3. Get All Student Report Cards
Get all report cards for a student.

```http
GET /api/report-cards/student/{student_id}/all?academic_year=2023-2024
```

**Path Parameters:**
- `student_id` (required): Student ID

**Query Parameters:**
- `academic_year` (optional): Filter by academic year (e.g., "2023-2024")

**Response:**
```json
{
  "success": true,
  "data": [/* Array of report cards */],
  "count": 5,
  "message": "Report cards retrieved successfully"
}
```

---

#### 4. Generate Report Card
Generate a monthly report card for a student.

```http
POST /api/report-cards/generate/{student_id}?month=2024-03&academic_year=2023-2024
```

**Path Parameters:**
- `student_id` (required): Student ID

**Query Parameters:**
- `month` (required): Month in format YYYY-MM
- `academic_year` (optional): Academic year (auto-detected if not provided)

**Response:** Same as endpoint #1

**Note:** If a report card already exists for the given month, it will be regenerated with updated data.

---

#### 5. Update Teacher Remarks
Update teacher remarks, achievements, and co-curricular activities.

```http
PATCH /api/report-cards/{report_id}/remarks
```

**Path Parameters:**
- `report_id` (required): Report card ID

**Request Body:**
```json
{
  "teacher_remarks": [
    {
      "subject_id": "math_101",
      "subject_name": "Mathematics",
      "teacher_name": "Mr. Smith",
      "remarks": "Excellent progress this month",
      "strengths": ["Problem solving", "Quick learner"],
      "areas_for_improvement": ["Show more work in solutions"]
    }
  ],
  "achievements": [
    "Won mathematics quiz competition",
    "Perfect attendance award"
  ],
  "co_curricular_activities": [
    {
      "activity_name": "Science Club",
      "participation_level": "Active",
      "remarks": "Led the project on renewable energy"
    }
  ]
}
```

**Response:** Updated report card

---

#### 6. Publish Report Card
Publish a report card to make it visible to students and parents.

```http
POST /api/report-cards/{report_id}/publish
```

**Path Parameters:**
- `report_id` (required): Report card ID

**Response:**
```json
{
  "success": true,
  "message": "Report card published successfully"
}
```

---

#### 7. Finalize Report Card
Finalize a report card (no more edits allowed).

```http
POST /api/report-cards/{report_id}/finalize
```

**Path Parameters:**
- `report_id` (required): Report card ID

**Response:**
```json
{
  "success": true,
  "message": "Report card finalized successfully"
}
```

**Note:** Only admins can finalize report cards.

## Grading System

### Grade Scale
- **A+**: 90% and above
- **A**: 80-89%
- **B+**: 70-79%
- **B**: 60-69%
- **C+**: 50-59%
- **C**: 40-49%
- **D**: 33-39%
- **F**: Below 33%

### GPA Scale
- **4.0**: 90% and above
- **3.7**: 80-89%
- **3.3**: 70-79%
- **3.0**: 60-69%
- **2.7**: 50-59%
- **2.3**: 40-49%
- **2.0**: 33-39%
- **0.0**: Below 33%

## Performance Calculation

### Subject Overall Performance
Calculated using weighted average:
- **Exams**: 60% weight
- **Assignments**: 25% weight
- **Quizzes**: 15% weight

### Overall Performance
Average of all subject performances

### Behavioral Metrics

1. **Discipline Score**: Based on attendance percentage
2. **Participation Score**: Average of assignment and quiz completion rates
3. **Punctuality Score**: 100 minus percentage of late attendances

## Workflow

### For Teachers/Admins

1. **Generate Report Card**
   - Select month and student
   - System automatically calculates all metrics
   - Report is created in draft mode (not published)

2. **Add Remarks** (Optional)
   - Add subject-wise teacher remarks
   - Add achievements and co-curricular activities
   - Can be updated multiple times before publishing

3. **Publish Report Card**
   - Makes the report card visible to student/parent
   - Student can now view the report card

4. **Finalize Report Card** (Admin Only)
   - Locks the report card (no more edits)
   - Recommended for end-of-month final reports

### For Students

1. **View Report Card**
   - Can only view published report cards
   - Access their own report cards only
   - Can view all past report cards

## Permissions Required

### Student Roles
- `student_view_report_card`: View own report cards

### Teacher Roles
- `teacher_view_report_card`: View student report cards
- `teacher_generate_report_card`: Generate report cards
- `teacher_update_report_card`: Update teacher remarks
- `teacher_publish_report_card`: Publish report cards

### Admin Roles
- All teacher permissions plus:
- `admin_finalize_report_card`: Finalize report cards

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "error": "Month parameter is required (format: YYYY-MM)"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Report card not found for the specified month"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to generate report card",
  "details": "..."
}
```

## Data Models

### ReportCard Schema
```typescript
{
  id: string;
  campus_id: string;
  student_id: string;
  class_id: string;
  academic_year: string;
  month: string; // Format: YYYY-MM
  month_name: string;
  semester?: string;
  report_data: {
    attendance: object;
    subjects_performance: object[];
    activity_summary: object;
    overall_performance: object;
    behavioral_metrics: object;
  };
  teacher_remarks?: object[];
  achievements?: string[];
  co_curricular_activities?: object[];
  generated_at: Date;
  generated_by: string;
  updated_at: Date;
  updated_by?: string;
  is_published: boolean;
  is_final: boolean;
}
```

## Best Practices

1. **Generate report cards at the end of each month** to capture complete monthly data
2. **Add teacher remarks** before publishing to provide valuable feedback
3. **Review generated data** before publishing to ensure accuracy
4. **Finalize report cards** only when you're certain no more changes are needed
5. **Use academic year filter** when viewing all report cards for better organization

## Future Enhancements

Potential improvements for future versions:
- PDF export functionality
- Email notifications when report cards are published
- Parent access to view their child's report cards
- Comparison charts showing progress over multiple months
- Custom grading scales per campus
- Automated report card generation at month end
- Batch report card generation for all students in a class

## Support

For issues or questions regarding the report card system, please contact the development team or refer to the main backend developer guide.
