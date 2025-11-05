# Student Academic View & Analytics API Documentation

## Overview
This API provides a comprehensive view of a student's academic performance, attendance, course progress, assignments, quizzes, examinations, fees, and leave requests. It aggregates data from multiple models to provide detailed analytics and insights.

## Endpoints

### 1. Get My Academic View (Student)
**Endpoint:** `GET /student-academic-view/my-view`

**Description:** Retrieve comprehensive academic information for the authenticated student.

**Authentication:** Required (Student role)

**Request:**
```bash
curl -X GET "http://localhost:3000/student-academic-view/my-view" \
  -H "Authorization: Bearer <student_token>"
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "student_info": {
      "user_id": "STU001",
      "student_name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "campus_id": "campus_123",
      "academic_year": "2024-2025",
      "class_info": {
        "class_id": "class_123",
        "class_name": "Grade 10-A",
        "academic_year": "2024-2025",
        "class_teacher_id": "teacher_456"
      },
      "is_active": true,
      "meta_data": {}
    },
    "academic_performance": {
      "semester_records": [...],
      "summary": {
        "total_semesters": 4,
        "average_gpa": "3.75",
        "average_percentage": "85.50",
        "best_semester": {...},
        "recent_semester": {...}
      }
    },
    "attendance": {
      "summary": {
        "total_days": 180,
        "present_days": 165,
        "absent_days": 10,
        "late_days": 5,
        "leave_days": 0,
        "attendance_percentage": "94.44"
      },
      "monthly_trend": [...],
      "recent_records": [...]
    },
    "courses": {
      "summary": {
        "total_courses": 5,
        "active_courses": 3,
        "completed_courses": 2,
        "average_progress": "75.50",
        "certificates_earned": 2
      },
      "courses": [...],
      "status_breakdown": {
        "active": 3,
        "completed": 2,
        "dropped": 0,
        "suspended": 0,
        "expired": 0
      }
    },
    "assignments": {
      "summary": {
        "total_assignments": 25,
        "submitted_count": 23,
        "pending_count": 2,
        "submission_percentage": "92.00",
        "graded_count": 20,
        "average_grade": "82.50",
        "highest_grade": 95,
        "lowest_grade": 68
      },
      "recent_submissions": [...],
      "grade_distribution": {
        "90-100": 5,
        "80-89": 10,
        "70-79": 4,
        "60-69": 1,
        "50-59": 0,
        "Below 50": 0
      }
    },
    "quizzes": {
      "summary": {
        "total_quizzes_available": 15,
        "quizzes_attempted": 14,
        "average_score": "78.50",
        "highest_score": 95,
        "lowest_score": 62,
        "attempt_percentage": "93.33"
      },
      "recent_submissions": [...],
      "performance_trend": [...]
    },
    "examinations": {
      "summary": {
        "total_exams": 20,
        "total_marks_obtained": 1650,
        "total_marks_possible": 2000,
        "overall_percentage": "82.50"
      },
      "exam_results": [...]
    },
    "fees": {
      "summary": {
        "total_fee_amount": 50000,
        "total_paid_amount": 45000,
        "total_due_amount": 5000,
        "payment_percentage": "90.00"
      },
      "fee_records": [...],
      "status_breakdown": {
        "paid": 3,
        "partial": 1,
        "unpaid": 0,
        "overdue": 0
      }
    },
    "leave_requests": {
      "summary": {
        "total_requests": 5,
        "approved": 4,
        "rejected": 0,
        "pending": 1,
        "cancelled": 0,
        "total_leave_days": 8
      },
      "recent_requests": [...]
    },
    "overall_analytics": {
      "academic_health_score": "82.50",
      "performance_grade": "Very Good",
      "strengths": [
        "Excellent academic performance",
        "Outstanding attendance record",
        "Consistent assignment submissions"
      ],
      "areas_for_improvement": [
        "Maintain current performance level"
      ],
      "recommendations": [
        "Keep up the excellent work!"
      ]
    },
    "generated_at": "2025-11-05T10:30:00.000Z"
  }
}
```

---

### 2. Get Student Academic View (Admin/Teacher)
**Endpoint:** `GET /student-academic-view/:student_id`

**Description:** Retrieve comprehensive academic information for a specific student (admin/teacher only).

**Authentication:** Required (Admin/Teacher role)

**Parameters:**
- `student_id` (path parameter, required): The unique identifier of the student

**Request:**
```bash
curl -X GET "http://localhost:3000/student-academic-view/STU001" \
  -H "Authorization: Bearer <admin_or_teacher_token>"
```

**Response:** Same structure as the student endpoint above.

---

## Data Aggregation Sources

The API aggregates data from the following models:

1. **User Model** - Student basic information
2. **Class Model** - Class details
3. **StudentPerformance Model** - Semester-wise academic performance
4. **Attendance Model** - Daily attendance records
5. **CourseEnrollment Model** - Course enrollments
6. **CourseProgress Model** - Course progress tracking
7. **Assignment Model** - Assignments
8. **AssignmentSubmission Model** - Assignment submissions
9. **ClassQuiz Model** - Quizzes
10. **ClassQuizSubmission Model** - Quiz submissions
11. **StudentRecord Model** - Examination records
12. **Fee Model** - Fee payment records
13. **LeaveRequest Model** - Leave request history

---

## Analytics Features

### 1. Academic Performance Analytics
- Semester-wise GPA and percentage tracking
- Overall average GPA and percentage
- Best performing semester identification
- Grade trends over time

### 2. Attendance Analytics
- Daily attendance tracking (Present, Absent, Late, Leave)
- Attendance percentage calculation
- Monthly attendance trends
- Recent attendance records

### 3. Course Analytics
- Course enrollment status tracking
- Progress percentage for each course
- Certificate achievements
- Course completion statistics

### 4. Assignment Analytics
- Submission rate tracking
- Grade distribution analysis
- Average, highest, and lowest grades
- Pending assignments tracking

### 5. Quiz Analytics
- Quiz attempt rate
- Average score calculation
- Performance trend analysis
- Best and worst scores

### 6. Examination Analytics
- Overall marks and percentage
- Subject-wise performance
- Grade distribution

### 7. Fee Management
- Total fee amount tracking
- Payment status monitoring
- Due amount calculation
- Payment percentage

### 8. Leave Management
- Leave request history
- Approval status tracking
- Total leave days calculation

### 9. Overall Academic Health Score
The system calculates an academic health score (0-100) based on:
- Academic Performance (30% weightage)
- Attendance (20% weightage)
- Assignment Performance (25% weightage)
- Quiz Performance (25% weightage)

**Performance Grades:**
- 90-100: Excellent
- 80-89: Very Good
- 70-79: Good
- 60-69: Satisfactory
- 50-59: Needs Improvement
- Below 50: Poor

### 10. Intelligent Recommendations
The system provides:
- **Strengths:** Identifies areas where the student excels
- **Areas for Improvement:** Highlights areas needing attention
- **Recommendations:** Actionable suggestions for improvement

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Campus ID not found"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Student not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message details"
}
```

---

## Use Cases

### For Students
- View comprehensive academic dashboard
- Track performance across semesters
- Monitor attendance and leave history
- Check assignment and quiz performance
- View fee payment status
- Get personalized recommendations

### For Teachers/Admins
- Monitor student progress
- Identify struggling students
- Track class-wide performance
- Generate student reports
- Make data-driven interventions

---

## Performance Considerations

The API uses parallel data fetching (`Promise.all`) for optimal performance:
- Multiple database queries are executed simultaneously
- Reduces overall response time
- Efficient data aggregation

---

## Example Integration

### React/TypeScript Frontend Example
```typescript
interface AcademicView {
  student_info: StudentInfo;
  academic_performance: PerformanceData;
  attendance: AttendanceData;
  // ... other fields
}

const fetchStudentAcademicView = async (): Promise<AcademicView> => {
  const response = await fetch('/student-academic-view/my-view', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.data;
};
```

### Mobile App Example (React Native)
```javascript
const getAcademicDashboard = async () => {
  try {
    const response = await axios.get(
      'http://api.example.com/student-academic-view/my-view',
      {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      }
    );
    
    const academicData = response.data.data;
    // Use academicData to populate dashboard
  } catch (error) {
    console.error('Failed to fetch academic view:', error);
  }
};
```

---

## Future Enhancements

Potential areas for enhancement:
1. Add date range filters for historical data
2. Export functionality (PDF/Excel reports)
3. Comparative analytics (peer comparison)
4. Predictive analytics for future performance
5. Graphical trend visualizations
6. Parent/guardian access control
7. Real-time notifications for low performance
8. Subject-wise detailed analytics
9. Teacher feedback integration
10. Goal setting and tracking

---

## Notes

- All date fields are returned in ISO 8601 format
- Percentages are returned as strings with 2 decimal places
- The API respects user roles and campus boundaries
- Data is fetched only for active, non-deleted records
- Performance calculations handle edge cases (division by zero, missing data)

---

## Support

For questions or issues, please contact the development team or refer to the main API documentation.
