# Student Progress API Documentation

## Overview

The Student Progress API provides comprehensive progress tracking for students across all their educational activities including courses, assignments, and overall academic performance. This API calculates and returns progress percentages that can be used to display progress bars in the frontend.

## Base URL

```
/api/student-progress
```

## Authentication

All endpoints require authentication. Users can access their own progress, while admins, teachers, and authorized users can access other students' progress based on their permissions.

## Endpoints

### 1. Get Comprehensive Student Progress

**GET** `/api/student-progress/`

Returns comprehensive progress information for the authenticated student.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "student_info": {
      "id": "student123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "campus_id": "campus123"
    },
    "overall_progress": {
      "total_progress_percentage": 75,
      "completion_status": "in_progress",
      "last_updated": "2024-01-15T10:30:00Z"
    },
    "courses": {
      "total_enrolled": 5,
      "completed": 2,
      "in_progress": 2,
      "not_started": 1,
      "average_progress": 65
    },
    "assignments": {
      "total_assignments": 20,
      "submitted": 15,
      "completion_rate": 75,
      "average_grade": 85.5
    },
    "performance_metrics": {
      "total_study_hours": 45.5,
      "engagement_score": 80,
      "current_streak": 5
    }
  },
  "message": "Student progress retrieved successfully"
}
```

### 2. Get Specific Student Progress (Admin/Teacher)

**GET** `/api/student-progress/:student_id`

Returns comprehensive progress information for a specific student. Available to admins, teachers, and authorized users.

**Parameters:**
- `student_id` (path) - The ID of the student

### 3. Get Course Progress Details

**GET** `/api/student-progress/courses/:course_id`

Returns detailed progress information for a specific course.

**Parameters:**
- `course_id` (path) - The ID of the course

### 4. Get Course Progress for Specific Student

**GET** `/api/student-progress/:student_id/courses/:course_id`

Returns detailed course progress for a specific student.

**Parameters:**
- `student_id` (path) - The ID of the student
- `course_id` (path) - The ID of the course

### 5. Get Assignment Progress

**GET** `/api/student-progress/assignments`

Returns assignment progress summary for the authenticated student.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "total_assignments": 20,
    "submitted": 15,
    "completion_rate": 75,
    "average_grade": 85.5
  },
  "message": "Assignment progress retrieved successfully"
}
```

### 6. Get Assignment Progress for Specific Student

**GET** `/api/student-progress/:student_id/assignments`

Returns assignment progress for a specific student.

### 7. Get Academic Summary

**GET** `/api/student-progress/summary`

Returns overall academic performance summary.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "overall_progress": {
      "total_progress_percentage": 75,
      "completion_status": "in_progress",
      "last_updated": "2024-01-15T10:30:00Z"
    },
    "course_summary": {
      "total_enrolled": 5,
      "average_progress": 65,
      "completed": 2
    },
    "assignment_summary": {
      "total_assignments": 20,
      "completion_rate": 75,
      "average_grade": 85.5
    },
    "performance_summary": {
      "total_study_hours": 45.5,
      "engagement_score": 80,
      "current_streak": 5
    }
  },
  "message": "Academic summary retrieved successfully"
}
```

### 8. Get Academic Summary for Specific Student

**GET** `/api/student-progress/:student_id/summary`

Returns academic summary for a specific student.

## Progress Calculation Logic

### Overall Progress Percentage

The overall progress percentage is calculated using a weighted average:
- **Courses: 60%** - Based on average progress across all enrolled courses
- **Assignments: 40%** - Based on assignment completion rate

If only courses or only assignments exist, the calculation uses 100% of the available data.

### Course Progress

Course progress is calculated based on:
- Number of completed lectures vs. total lectures
- Watch time and completion percentage per lecture
- Assignment submissions within courses
- Quiz attempts and scores

### Assignment Progress

Assignment progress includes:
- **Class Assignments** - Traditional classroom assignments
- **Course Assignments** - Assignments within online courses
- **Completion Rate** - Percentage of submitted assignments
- **Average Grade** - Mean score across graded assignments

### Performance Metrics

- **Study Hours** - Total time spent on courses and learning activities
- **Engagement Score** - Based on completion rates, consistency, and interaction data
- **Current Streak** - Consecutive days of learning activity

## Permissions

The following permissions control access to the progress APIs:

- `view_student_progress` - View comprehensive student progress
- `view_course_progress` - View detailed course progress
- `view_assignment_progress` - View assignment progress
- `view_academic_summary` - View academic summary

## Role-Based Access

### Student
- Can access their own progress data
- Full access to all personal progress endpoints

### Teacher
- Can access progress for students in their classes
- Can view course progress for courses they teach
- Full access to assignment progress for their assignments

### Admin/Super Admin
- Can access progress for any student in their campus
- Full access to all progress endpoints
- Can generate reports and analytics

### Parent
- Can access progress for their children (when parent-child relationships are implemented)

## Error Responses

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions to access this student's progress"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Student not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch student progress"
}
```

## Usage Examples

### Frontend Progress Bar Implementation

```javascript
// Fetch student progress
const response = await fetch('/api/student-progress/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.success) {
  const overallProgress = data.data.overall_progress.total_progress_percentage;
  const courseProgress = data.data.courses.average_progress;
  const assignmentProgress = data.data.assignments.completion_rate;
  
  // Update progress bars
  updateProgressBar('overall-progress', overallProgress);
  updateProgressBar('course-progress', courseProgress);
  updateProgressBar('assignment-progress', assignmentProgress);
}
```

### React Hook Example

```jsx
import { useState, useEffect } from 'react';

const useStudentProgress = (studentId = null) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const url = studentId 
          ? `/api/student-progress/${studentId}`
          : '/api/student-progress/';
          
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setProgress(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to fetch progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [studentId]);

  return { progress, loading, error };
};

// Usage in component
const ProgressDashboard = ({ studentId }) => {
  const { progress, loading, error } = useStudentProgress(studentId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <ProgressBar 
        value={progress.overall_progress.total_progress_percentage}
        label="Overall Progress"
      />
      <ProgressBar 
        value={progress.courses.average_progress}
        label="Course Progress"
      />
      <ProgressBar 
        value={progress.assignments.completion_rate}
        label="Assignment Completion"
      />
    </div>
  );
};
```

## Data Models

### StudentProgressSummary
```typescript
interface StudentProgressSummary {
  student_info: {
    id: string;
    name: string;
    email: string;
    campus_id: string;
  };
  overall_progress: {
    total_progress_percentage: number; // 0-100
    completion_status: "not_started" | "in_progress" | "completed";
    last_updated: Date;
  };
  courses: {
    total_enrolled: number;
    completed: number;
    in_progress: number;
    not_started: number;
    average_progress: number; // 0-100
  };
  assignments: {
    total_assignments: number;
    submitted: number;
    completion_rate: number; // 0-100
    average_grade: number;
  };
  performance_metrics: {
    total_study_hours: number;
    engagement_score: number; // 0-100
    current_streak: number;
  };
}
```

## Implementation Notes

1. **Performance Optimization**: The service caches frequently accessed data and uses efficient queries to minimize database load.

2. **Real-time Updates**: Progress data is updated automatically when students complete courses, submit assignments, or engage with learning materials.

3. **Privacy**: Users can only access their own progress unless they have specific permissions to view other students' data.

4. **Scalability**: The API is designed to handle large numbers of students and can be extended to include additional progress metrics.

5. **Integration**: The progress API integrates seamlessly with existing course and assignment systems to provide accurate, up-to-date progress information.