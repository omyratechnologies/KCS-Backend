# Admin Course Analytics API Documentation

## Overview

The Admin Course Analytics API provides comprehensive analytics and insights for course management, instructor performance, enrollment trends, and revenue metrics. This API is designed for administrators and instructors to monitor and optimize course delivery across the campus.

## Base URL
```
/api/admin-course-analytics
```

## Authentication
All endpoints require authentication with a valid JWT token in the Authorization header.

## Permissions

| Endpoint | Admin | Teacher/Instructor | Student |
|----------|-------|-------------------|---------|
| Campus Analytics | ✅ | ❌ | ❌ |
| Course Details | ✅ | ✅ (own courses) | ❌ |
| Instructor Analytics | ✅ | ✅ (self only) | ❌ |
| My Instructor Stats | ❌ | ✅ | ❌ |
| Enrollment Trends | ✅ | ❌ | ❌ |
| Revenue Analytics | ✅ | ❌ | ❌ |

---

## Endpoints

### 1. Get Campus Course Analytics

**GET** `/campus`

Get comprehensive analytics for all courses across the campus.

**Access:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Campus course analytics retrieved successfully",
  "data": {
    "overview": {
      "total_courses": 45,
      "active_courses": 38,
      "inactive_courses": 7,
      "total_enrollments": 1250,
      "total_active_students": 987,
      "total_instructors": 28,
      "avg_completion_rate": 78.5,
      "avg_student_satisfaction": 4.3,
      "total_certificates_issued": 542
    },
    "category_breakdown": [
      {
        "category": "Computer Science",
        "course_count": 12,
        "total_enrollments": 450,
        "avg_completion_rate": 82.3,
        "avg_rating": 4.5
      },
      {
        "category": "Mathematics",
        "course_count": 8,
        "total_enrollments": 320,
        "avg_completion_rate": 75.8,
        "avg_rating": 4.1
      }
    ],
    "difficulty_breakdown": [
      {
        "level": "Beginner",
        "course_count": 18,
        "total_enrollments": 620,
        "avg_completion_rate": 85.2
      },
      {
        "level": "Intermediate",
        "course_count": 20,
        "total_enrollments": 480,
        "avg_completion_rate": 76.4
      },
      {
        "level": "Advanced",
        "course_count": 7,
        "total_enrollments": 150,
        "avg_completion_rate": 68.7
      }
    ],
    "top_performing_courses": [
      {
        "course_id": "course_12345",
        "title": "Introduction to Python Programming",
        "completion_rate": 92.5,
        "avg_rating": 4.8,
        "total_enrollments": 180
      }
    ],
    "underperforming_courses": [
      {
        "course_id": "course_67890",
        "title": "Advanced Machine Learning",
        "completion_rate": 45.2,
        "avg_rating": 3.2,
        "total_enrollments": 25
      }
    ],
    "monthly_trends": {
      "enrollments": [
        { "month": "2024-01", "count": 145 },
        { "month": "2024-02", "count": 167 },
        { "month": "2024-03", "count": 189 }
      ],
      "completions": [
        { "month": "2024-01", "count": 98 },
        { "month": "2024-02", "count": 112 },
        { "month": "2024-03", "count": 134 }
      ]
    }
  }
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin-course-analytics/campus" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get Course Detailed Analytics

**GET** `/course/:course_id`

Get comprehensive analytics for a specific course.

**Access:** Admin, Teacher (for own courses), Course Instructor

**Path Parameters:**
- `course_id` (string, required): The ID of the course

**Response:**
```json
{
  "success": true,
  "message": "Course analytics retrieved successfully",
  "data": {
    "course_info": {
      "course_id": "course_12345",
      "title": "Introduction to Python Programming",
      "category": "Computer Science",
      "difficulty_level": "Beginner",
      "instructor_id": "user_67890",
      "instructor_name": "Dr. John Smith",
      "created_at": "2023-09-01T00:00:00Z",
      "status": "active"
    },
    "enrollment_stats": {
      "total_enrollments": 180,
      "active_students": 145,
      "completed_students": 122,
      "dropped_students": 13,
      "completion_rate": 67.8,
      "average_progress": 78.5
    },
    "content_stats": {
      "total_sections": 8,
      "total_lectures": 64,
      "total_duration_minutes": 1280,
      "total_resources": 45
    },
    "performance_metrics": {
      "avg_quiz_score": 84.2,
      "avg_assignment_score": 88.5,
      "avg_attendance_rate": 92.3,
      "avg_time_to_complete_days": 45
    },
    "engagement_metrics": {
      "avg_rating": 4.7,
      "total_reviews": 98,
      "avg_watch_time_minutes": 45.3,
      "completion_by_section": [
        { "section_id": "sec_1", "completion_rate": 95.2 },
        { "section_id": "sec_2", "completion_rate": 87.6 }
      ]
    },
    "certification": {
      "certificates_issued": 122,
      "certification_rate": 67.8,
      "avg_days_to_certificate": 42
    },
    "student_demographics": {
      "by_year": [
        { "year": "First Year", "count": 45 },
        { "year": "Second Year", "count": 67 }
      ],
      "by_department": [
        { "department": "Computer Science", "count": 89 },
        { "department": "Information Technology", "count": 56 }
      ]
    },
    "recommendations": [
      "Course performance is excellent with high completion rates",
      "Consider creating advanced follow-up course",
      "Student engagement is very high - maintain current teaching methods"
    ]
  }
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin-course-analytics/course/course_12345" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get Instructor Analytics

**GET** `/instructor/:instructor_id`

Get comprehensive analytics for a specific instructor's performance.

**Access:** Admin, Instructor (for own stats)

**Path Parameters:**
- `instructor_id` (string, required): The ID of the instructor

**Response:**
```json
{
  "success": true,
  "message": "Instructor analytics retrieved successfully",
  "data": {
    "instructor_info": {
      "instructor_id": "user_67890",
      "name": "Dr. John Smith",
      "department": "Computer Science",
      "email": "john.smith@university.edu"
    },
    "teaching_stats": {
      "total_courses": 5,
      "active_courses": 4,
      "total_students_taught": 487,
      "current_active_students": 356,
      "total_certificates_issued": 245
    },
    "performance_metrics": {
      "overall_avg_rating": 4.6,
      "overall_completion_rate": 76.8,
      "avg_student_satisfaction": 4.5,
      "total_reviews_received": 312
    },
    "course_performance": [
      {
        "course_id": "course_12345",
        "title": "Introduction to Python Programming",
        "enrollments": 180,
        "completion_rate": 82.5,
        "avg_rating": 4.8,
        "certificates_issued": 122
      },
      {
        "course_id": "course_23456",
        "title": "Data Structures and Algorithms",
        "enrollments": 145,
        "completion_rate": 75.2,
        "avg_rating": 4.5,
        "certificates_issued": 89
      }
    ],
    "student_outcomes": {
      "avg_quiz_scores": 85.3,
      "avg_assignment_scores": 87.6,
      "avg_attendance_rate": 91.2
    },
    "engagement_stats": {
      "avg_response_time_hours": 4.2,
      "discussion_participation_rate": 78.5,
      "student_support_rating": 4.7
    },
    "strengths": [
      "Excellent student engagement and satisfaction ratings",
      "High course completion rates across all courses",
      "Strong performance in Python programming courses"
    ],
    "areas_for_improvement": [
      "Consider adding more interactive elements to advanced courses",
      "Enrollment numbers could be increased through marketing"
    ]
  }
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin-course-analytics/instructor/user_67890" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Get My Instructor Statistics

**GET** `/my-instructor-stats`

Get analytics for the currently authenticated instructor's performance.

**Access:** Teacher/Instructor only

**Response:**
Same structure as "Get Instructor Analytics" but for the authenticated user.

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin-course-analytics/my-instructor-stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 5. Get Enrollment Trends

**GET** `/enrollment-trends`

Get enrollment trends and forecasting for courses across the campus.

**Access:** Admin only

**Query Parameters:**
- `months` (number, optional): Number of months to analyze (default: 6)
- `category` (string, optional): Filter by course category
- `instructor_id` (string, optional): Filter by instructor

**Response:**
```json
{
  "success": true,
  "message": "Enrollment trends retrieved successfully",
  "data": {
    "overall_trends": {
      "total_enrollments_period": 892,
      "growth_rate": 12.5,
      "avg_monthly_enrollments": 148.7,
      "peak_month": "2024-03",
      "lowest_month": "2024-01"
    },
    "trend_data": [
      {
        "month": "2024-01",
        "total_enrollments": 145,
        "active_courses": 35,
        "avg_per_course": 4.1,
        "growth_from_previous": 8.2
      },
      {
        "month": "2024-02",
        "total_enrollments": 167,
        "active_courses": 38,
        "avg_per_course": 4.4,
        "growth_from_previous": 15.2
      },
      {
        "month": "2024-03",
        "total_enrollments": 189,
        "active_courses": 38,
        "avg_per_course": 5.0,
        "growth_from_previous": 13.2
      }
    ],
    "category_trends": [
      {
        "category": "Computer Science",
        "enrollments": 345,
        "growth_rate": 18.5,
        "trend": "increasing"
      },
      {
        "category": "Mathematics",
        "enrollments": 267,
        "growth_rate": 8.3,
        "trend": "stable"
      }
    ],
    "top_growing_courses": [
      {
        "course_id": "course_12345",
        "title": "Introduction to Python Programming",
        "enrollment_growth": 45.2,
        "current_enrollments": 180
      }
    ],
    "seasonal_patterns": {
      "peak_enrollment_months": ["January", "September"],
      "low_enrollment_months": ["June", "July"],
      "recommendation": "Plan new course launches for September and January"
    },
    "forecast": {
      "next_month_predicted": 198,
      "next_quarter_predicted": 580,
      "confidence_level": "high"
    }
  }
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin-course-analytics/enrollment-trends?months=6&category=Computer%20Science" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 6. Get Revenue Analytics

**GET** `/revenue`

Get comprehensive revenue analytics for courses.

**Access:** Admin only

**Query Parameters:**
- `start_date` (string, optional): Start date in ISO format (YYYY-MM-DD)
- `end_date` (string, optional): End date in ISO format (YYYY-MM-DD)
- `category` (string, optional): Filter by course category

**Response:**
```json
{
  "success": true,
  "message": "Revenue analytics retrieved successfully",
  "data": {
    "overall_revenue": {
      "total_revenue": 487500.00,
      "total_enrollments": 1250,
      "avg_revenue_per_enrollment": 390.00,
      "growth_rate": 15.3
    },
    "revenue_by_course": [
      {
        "course_id": "course_12345",
        "title": "Introduction to Python Programming",
        "total_revenue": 54000.00,
        "enrollments": 180,
        "avg_price": 300.00
      },
      {
        "course_id": "course_23456",
        "title": "Data Structures and Algorithms",
        "total_revenue": 43500.00,
        "enrollments": 145,
        "avg_price": 300.00
      }
    ],
    "revenue_by_category": [
      {
        "category": "Computer Science",
        "total_revenue": 195000.00,
        "course_count": 12,
        "avg_per_course": 16250.00
      },
      {
        "category": "Mathematics",
        "total_revenue": 128000.00,
        "course_count": 8,
        "avg_per_course": 16000.00
      }
    ],
    "monthly_trend": [
      {
        "month": "2024-01",
        "revenue": 43500.00,
        "enrollments": 145,
        "growth": 8.2
      },
      {
        "month": "2024-02",
        "revenue": 50100.00,
        "enrollments": 167,
        "growth": 15.2
      },
      {
        "month": "2024-03",
        "revenue": 56700.00,
        "enrollments": 189,
        "growth": 13.2
      }
    ],
    "top_revenue_courses": [
      {
        "course_id": "course_12345",
        "title": "Introduction to Python Programming",
        "total_revenue": 54000.00,
        "enrollments": 180,
        "revenue_per_student": 300.00
      }
    ],
    "revenue_forecast": {
      "next_month": 59850.00,
      "next_quarter": 174000.00,
      "annual_projection": 650000.00
    },
    "insights": [
      "Computer Science courses generate highest revenue",
      "Revenue growth is consistent at 15.3% YoY",
      "Python programming course is the top revenue generator",
      "Consider launching more beginner-level courses for revenue optimization"
    ]
  }
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin-course-analytics/revenue?start_date=2024-01-01&end_date=2024-03-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Analytics Metrics Explained

### Completion Rate
Percentage of enrolled students who have completed the course (progress = 100%).

**Formula:** `(Completed Students / Total Enrollments) × 100`

### Average Progress
Mean progress percentage across all enrolled students.

### Certification Rate
Percentage of enrolled students who have received certificates.

**Formula:** `(Certificates Issued / Total Enrollments) × 100`

### Growth Rate
Percentage increase in enrollments compared to the previous period.

**Formula:** `((Current Period - Previous Period) / Previous Period) × 100`

### Student Satisfaction
Average rating from student reviews on a scale of 1-5.

### Engagement Rate
Combination of attendance, assignment submission, and quiz participation rates.

---

## Use Cases

### For Administrators

1. **Campus-Wide Monitoring**
   - Track overall course performance across the institution
   - Identify top-performing and underperforming courses
   - Monitor enrollment trends and forecast future demand

2. **Resource Allocation**
   - Allocate resources to high-demand categories
   - Identify instructors who need support
   - Plan course schedules based on enrollment patterns

3. **Revenue Optimization**
   - Analyze revenue by course and category
   - Forecast revenue projections
   - Identify opportunities for new course offerings

4. **Quality Assurance**
   - Monitor completion rates and student satisfaction
   - Identify courses needing improvement
   - Track instructor performance metrics

### For Instructors

1. **Performance Tracking**
   - Monitor personal teaching statistics
   - Track student outcomes across courses
   - Identify areas for improvement

2. **Course Optimization**
   - Analyze student engagement by section
   - Identify difficult content areas (low completion rates)
   - Track student demographics for better targeting

3. **Student Support**
   - Monitor at-risk students (low progress, low engagement)
   - Track response times and support effectiveness
   - Identify students who may need additional help

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid course ID format"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error retrieving course analytics",
  "error": "Detailed error message"
}
```

---

## Best Practices

1. **Regular Monitoring**
   - Check campus analytics weekly to stay informed
   - Monitor enrollment trends monthly for planning
   - Review instructor performance quarterly

2. **Data-Driven Decisions**
   - Use completion rates to identify content issues
   - Leverage revenue analytics for pricing strategies
   - Apply enrollment trends for course scheduling

3. **Performance Optimization**
   - Address underperforming courses promptly
   - Replicate successful course strategies
   - Support instructors with low satisfaction ratings

4. **Student Success**
   - Use analytics to identify at-risk students
   - Monitor engagement metrics for early intervention
   - Track certification rates as a success indicator

---

## Integration Notes

### Database Models Used
- `Course`: Course information and metadata
- `CourseEnrollment`: Student enrollment records
- `CourseProgress`: Student progress tracking
- `CourseLecture`: Lecture content and completion
- `CourseSection`: Course structure and organization
- `CourseCertificate`: Certificate issuance records
- `User`: Instructor and student information

### Related APIs
- [Student Academic View API](./STUDENT_ACADEMIC_VIEW_API.md) - Student-facing analytics
- [Course API](./COURSE_API_DOCUMENTATION.md) - Course management
- [Course Enrollment API](./COURSE_ENROLLMENT_SEPARATION.md) - Enrollment management

---

## Version History

- **v1.0.0** (2024) - Initial release with 6 comprehensive analytics endpoints

---

## Support

For technical support or questions about the Admin Course Analytics API, please contact the development team or refer to the backend developer guide.
