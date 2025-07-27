# Complete Course API Documentation

**Base URL:** `http://localhost:4500`  
**Authentication:** Bearer Token required for all endpoints  
**Content-Type:** `application/json`

## Authentication

### 1. Create Admin Account
```bash
POST /api/tmp/create-admin
```

**Request:**
```json
{
  "username": "admin",
  "password": "admin123", 
  "email": "admin@test.com",
  "first_name": "Test",
  "last_name": "Admin",
  "campus_name": "Test Campus",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "user_id": "admin",
  "email": "admin@admin.com",
  "hash": "63772774f253df23a903407a70236de7...",
  "salt": "3817a924c926185f746b8f5624ec5bf0",
  "first_name": " ",
  "last_name": " ",
  "phone": "0000000000",
  "address": " ",
  "meta_data": "{}",
  "is_active": true,
  "is_deleted": false,
  "user_type": "Super Admin",
  "campus_id": "",
  "created_at": "2025-07-27T08:56:07.159Z",
  "updated_at": "2025-07-27T08:56:07.159Z",
  "id": "1f79d783-25ce-498c-81aa-30e8deb5cd59",
  "_type": "users"
}
```

### 2. Login
```bash
POST /api/auth/login
```

**Request:**
```json
{
  "login_id": "admin@admin.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "481665b1cbff4de029013e33282bae1e715c8dadd2b7f36305c5e70a36203dc6",
  "expires_in": 1754211894,
  "type": "Bearer"
}
```

---

## Course Management APIs

### 1. Create Course
```bash
POST /api/course
Authorization: Bearer {token}
```

**Request:**
```json
{
  "course_name": "Introduction to Computer Science",
  "course_code": "CS101",
  "course_description": "A comprehensive introduction to computer science principles and programming fundamentals",
  "course_meta_data": {
    "credits": 3,
    "level": "Beginner",
    "duration": "12 weeks",
    "prerequisites": []
  }
}
```

**Response:**
```json
{
  "course_name": "Introduction to Computer Science",
  "course_code": "CS101",
  "course_description": "A comprehensive introduction to computer science principles and programming fundamentals",
  "course_meta_data": {
    "credits": 3,
    "level": "Beginner",
    "duration": "12 weeks",
    "prerequisites": []
  },
  "campus_id": "c9d4a236-d83e-44d3-9a93-e43dee385314",
  "is_active": true,
  "is_deleted": false,
  "created_at": "2025-07-27T09:05:58.920Z",
  "updated_at": "2025-07-27T09:05:58.920Z",
  "id": "c470b687-35f7-4cda-b59e-f0acaf046bf9",
  "_type": "courses"
}
```

### 2. Get All Courses
```bash
GET /api/course
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "_type": "courses",
    "campus_id": "c9d4a236-d83e-44d3-9a93-e43dee385314",
    "course_code": "CS101",
    "course_description": "A comprehensive introduction to computer science principles and programming fundamentals",
    "course_meta_data": {
      "credits": 3,
      "duration": "12 weeks",
      "level": "Beginner",
      "prerequisites": []
    },
    "course_name": "Introduction to Computer Science",
    "created_at": "2025-07-27T09:05:58.920Z",
    "id": "c470b687-35f7-4cda-b59e-f0acaf046bf9",
    "is_active": true,
    "is_deleted": false,
    "updated_at": "2025-07-27T09:05:58.920Z"
  }
]
```

### 3. Get Course by ID
```bash
GET /api/course/{course_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "course_name": "Introduction to Computer Science",
  "course_code": "CS101",
  "course_description": "A comprehensive introduction to computer science principles and programming fundamentals",
  "course_meta_data": {
    "credits": 3,
    "level": "Beginner",
    "duration": "12 weeks",
    "prerequisites": []
  },
  "campus_id": "c9d4a236-d83e-44d3-9a93-e43dee385314",
  "is_active": true,
  "is_deleted": false,
  "created_at": "2025-07-27T09:05:58.920Z",
  "updated_at": "2025-07-27T09:05:58.920Z",
  "id": "c470b687-35f7-4cda-b59e-f0acaf046bf9",
  "_type": "courses"
}
```

### 4. Update Course
```bash
PUT /api/course/{course_id}
Authorization: Bearer {token}
```

**Request:**
```json
{
  "course_name": "Advanced Computer Science",
  "course_description": "Updated description for advanced computer science course",
  "course_meta_data": {
    "credits": 4,
    "level": "Intermediate"
  }
}
```

### 5. Delete Course
```bash
DELETE /api/course/{course_id}
Authorization: Bearer {token}
```

---

## Course Content APIs

### 1. Create Week-Based Course Content
```bash
POST /api/course/{course_id}/content
Authorization: Bearer {token}
```

**Request:**
```json
{
  "title": "Week 1: Introduction to Programming",
  "description": "This week covers basic programming concepts and fundamental coding principles",
  "contents": [
    {
      "title": "Introduction to Programming",
      "description": "Basic programming concepts",
      "content_type": "text",
      "content_data": {
        "text_content": "This lesson covers variables, functions, and basic syntax. Programming is the art of creating instructions for computers to follow."
      }
    },
    {
      "title": "Programming Tutorial Video",
      "description": "Video lesson on programming basics",
      "content_type": "video",
      "content_data": {
        "video_url": "https://storage.example.com/video.mp4",
        "video_duration": 1800,
        "thumbnail_url": "https://storage.example.com/thumbnail.jpg",
        "file_size": 52428800
      }
    },
    {
      "title": "Programming Handbook",
      "description": "PDF resource for programming reference",
      "content_type": "resource",
      "content_data": {
        "resources_url": "https://storage.example.com/handbook.pdf",
        "resources_size": 2048000,
        "file_type": "pdf",
        "file_name": "programming-handbook.pdf"
      }
    }
  ],
  "access_settings": {
    "access_level": "free",
    "available_from": "2024-01-01T00:00:00Z",
    "available_until": "2024-12-31T23:59:59Z"
  },
  "interaction_settings": {
    "allow_comments": true,
    "allow_notes": true,
    "allow_bookmarks": true,
    "require_completion": false
  },
  "meta_data": {
    "tags": ["programming", "basics", "introduction"]
  },
  "order": 1
}
```

**Response:**
```json
{
  "week_title": "Week 1: Introduction to Programming",
  "week_description": "This week covers basic programming concepts and fundamental coding principles",
  "week_order": 1,
  "contents_count": 3,
  "contents": [
    {
      "id": "45f0a2da-1c00-4dba-9e39-11f61468c937",
      "title": "Introduction to Programming",
      "description": "Basic programming concepts",
      "content_type": "text",
      "content_data": {
        "text_content": "This lesson covers variables, functions, and basic syntax. Programming is the art of creating instructions for computers to follow.",
        "html_content": "<p>This lesson covers variables, functions, and basic syntax. Programming is the art of creating instructions for computers to follow.</p>",
        "duration": 1800
      },
      "order": 100,
      "created_at": "2025-07-27T09:07:39.664Z",
      "updated_at": "2025-07-27T09:07:39.664Z"
    },
    {
      "id": "54cd91fc-5e3e-4d36-b80b-7dc7d13bbfe4",
      "title": "Programming Tutorial Video",
      "description": "Video lesson on programming basics",
      "content_type": "video",
      "content_data": {
        "video_url": "https://storage.example.com/video.mp4",
        "duration": 1800,
        "thumbnail_url": "https://storage.example.com/thumbnail.jpg",
        "file_size": 52428800
      },
      "order": 101,
      "created_at": "2025-07-27T09:07:39.721Z",
      "updated_at": "2025-07-27T09:07:39.721Z"
    },
    {
      "id": "1ade3730-5ddc-4931-a88a-0783c4fbf02c",
      "title": "Programming Handbook",
      "description": "PDF resource for programming reference",
      "content_type": "document",
      "content_data": {
        "document_url": "https://storage.example.com/handbook.pdf",
        "file_size": 2048000,
        "duration": 0
      },
      "order": 102,
      "created_at": "2025-07-27T09:07:39.751Z",
      "updated_at": "2025-07-27T09:07:39.751Z"
    }
  ]
}
```

### 2. Get All Course Contents
```bash
GET /api/course/{course_id}/content
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "_type": "course_content",
    "access_settings": {
      "access_level": "free",
      "available_from": "2024-01-01T00:00:00.000Z",
      "available_until": "2024-12-31T23:59:59.000Z"
    },
    "campus_id": "c9d4a236-d83e-44d3-9a93-e43dee385314",
    "content_data": {
      "document_url": "https://storage.example.com/handbook.pdf",
      "duration": 0,
      "file_size": 2048000
    },
    "content_description": "PDF resource for programming reference",
    "content_format": "document",
    "content_title": "Programming Handbook",
    "content_type": "resource",
    "course_id": "c470b687-35f7-4cda-b59e-f0acaf046bf9",
    "created_at": "2025-07-27T09:07:39.751Z",
    "id": "1ade3730-5ddc-4931-a88a-0783c4fbf02c",
    "interaction_settings": {
      "allow_bookmarks": true,
      "allow_comments": true,
      "allow_notes": true,
      "require_completion": false
    },
    "is_active": true,
    "is_deleted": false,
    "meta_data": {
      "created_by": "8e8dc041-8326-4e39-8fe8-6336885c9f89",
      "tags": ["programming", "basics", "introduction"]
    },
    "sort_order": 102,
    "updated_at": "2025-07-27T09:07:39.751Z"
  }
]
```

### 3. Get Specific Content by ID
```bash
GET /api/course/{course_id}/content/{content_id}
Authorization: Bearer {token}
```

### 4. Update Course Content
```bash
PUT /api/course/{course_id}/content/{content_id}
Authorization: Bearer {token}
```

**Request:**
```json
{
  "title": "Updated: Introduction to Programming",
  "content": "Updated content description",
  "content_type": "text",
  "order": 2
}
```

### 5. Delete Course Content
```bash
DELETE /api/course/{course_id}/content/{content_id}
Authorization: Bearer {token}
```

---

## Course Enrollment APIs

### 1. Enroll in Course
```bash
POST /api/course/{course_id}/enroll
Authorization: Bearer {token}
```

**Request:**
```json
{
  "enrollmentData": {
    "enrollment_date": "2025-07-27T09:00:00Z",
    "status": "active",
    "progress": 0,
    "completion_date": "2025-12-31T23:59:59Z",
    "is_completed": false,
    "is_graded": false,
    "grade_data": [],
    "overall_grade": 0,
    "meta_data": {
      "enrollment_source": "web",
      "payment_status": "completed",
      "access_level": "full"
    }
  }
}
```

**Response:**
```json
{
  "user_id": "8e8dc041-8326-4e39-8fe8-6336885c9f89",
  "enrollment_date": "2025-07-27T09:00:00.000Z",
  "completion_date": "2025-12-31T23:59:59.000Z",
  "is_completed": false,
  "is_graded": false,
  "grade_data": [],
  "overall_grade": 0,
  "meta_data": {
    "enrollment_source": "web",
    "payment_status": "completed",
    "access_level": "full"
  },
  "campus_id": "c9d4a236-d83e-44d3-9a93-e43dee385314",
  "course_id": "c470b687-35f7-4cda-b59e-f0acaf046bf9",
  "created_at": "2025-07-27T09:11:07.333Z",
  "updated_at": "2025-07-27T09:11:07.333Z",
  "id": "600a7ff9-c849-4238-9a90-0f62b235d2e5",
  "_type": "course_enrollment"
}
```

### 2. Get Course Enrollments
```bash
GET /api/course/{course_id}/enrollment
Authorization: Bearer {token}
```

### 3. Get Specific Enrollment
```bash
GET /api/course/{course_id}/enrollment/{enrollment_id}
Authorization: Bearer {token}
```

### 4. Update Enrollment
```bash
PUT /api/course/{course_id}/enrollment/{enrollment_id}
Authorization: Bearer {token}
```

**Request:**
```json
{
  "enrollment_status": "completed",
  "grades": {
    "current_grade": 95,
    "total_points": 100
  },
  "completion_status": {
    "completion_percentage": 100,
    "completed_content_ids": ["content_id_1", "content_id_2"],
    "completion_date": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Delete Enrollment
```bash
DELETE /api/course/{course_id}/enrollment/{enrollment_id}
Authorization: Bearer {token}
```

### 6. Get User Enrollments
```bash
GET /api/course/enrollment/user/{user_id}
Authorization: Bearer {token}
```

---

## Student-Centric APIs

### 1. Get Student Courses (with Filters)
```bash
GET /api/courses
GET /api/courses?available=true
GET /api/courses?enrolled=true  
GET /api/courses?in_progress=true
GET /api/courses?completed=true
Authorization: Bearer {token}
```

### 2. Get Student Course Report
```bash
GET /api/course/student/me
GET /api/course/student/me?include_analytics=true&include_progress=true&include_grades=true
Authorization: Bearer {token}
```

### 3. Get Admin View of Student
```bash
GET /api/course/student/{student_id}
Authorization: Bearer {token}
```

### 4. Get Student Dashboard
```bash
GET /api/course/student/dashboard
Authorization: Bearer {token}
```

### 5. Quick Enroll in Course
```bash
POST /api/courses/{course_id}/enroll
Authorization: Bearer {token}
```

**Request:**
```json
{}
```

---

## Content Types Supported

### 1. Text Content
```json
{
  "content_type": "text",
  "content_data": {
    "text_content": "Your lesson content here..."
  }
}
```

### 2. Video Content
```json
{
  "content_type": "video", 
  "content_data": {
    "video_url": "https://storage.example.com/video.mp4",
    "video_duration": 1800,
    "thumbnail_url": "https://storage.example.com/thumbnail.jpg",
    "file_size": 52428800
  }
}
```

### 3. Resource Content (PDFs, Documents)
```json
{
  "content_type": "resource",
  "content_data": {
    "resources_url": "https://storage.example.com/handbook.pdf",
    "resources_size": 2048000,
    "file_type": "pdf",
    "file_name": "programming-handbook.pdf"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Missing required fields: title, contents array"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error message description"
}
```

### Validation Errors
```json
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "undefined", 
        "path": ["login_id"],
        "message": "Required"
      }
    ],
    "name": "ZodError"
  }
}
```

---

## Key Features

1. **Week-Based Content Organization**: Create multiple content items in a single API call
2. **Multi-Content Type Support**: Text, video, and resource content types
3. **Rich Metadata**: Comprehensive content information and settings
4. **Access Control**: Free/paid content with date restrictions
5. **Student-Centric Endpoints**: Simplified API for mobile/frontend development
6. **Comprehensive Enrollment System**: Full tracking of student progress and grades
7. **OpenAPI Documentation**: Available at `/docs` endpoint

## Testing Notes

- All APIs tested and verified working
- Authentication required for all endpoints except login/register
- Content creation supports batch operations with week organization
- Enrollment system supports complex grade and progress tracking
- Student-centric APIs provide unified interface for course management
