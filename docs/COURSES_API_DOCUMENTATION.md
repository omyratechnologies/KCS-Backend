# KCS Courses API - Complete Documentation

## API Flow Overview

The Course API follows a hierarchical structure with the following main components:

1. **Courses** - Main course management
2. **Course Content** - Learning materials and lessons  
3. **Course Enrollment** - Student/user enrollments
4. **Course Assignments** - Available via separate `/assignments` endpoint
5. **Enhanced Course Content** - Advanced content management via `/course-content` endpoint

## User Roles and Permissions

### Student
- View courses they're enrolled in
- View course content and materials
- Track progress and watch history
- Download materials
- Enroll in courses

### Teacher
- Create, update, delete course content
- Manage course materials and chapters
- View course analytics
- Upload course materials
- Create lesson steps

### Staff
- Basic user and course viewing permissions

### Principal
- Full assignment management
- Administrative course overview
- Course analytics access

### Admin
- Full course management (CRUD operations)
- Complete course content management
- Course analytics and permissions management
- Bulk operations on course materials

### Super Admin
- Campus-level course management
- System-wide configuration

## Base URL Structure

All course endpoints are prefixed with: `/api/course`

## Course Management APIs

### 1. Create Course

**Endpoint:** `POST /api/course/`
**Access:** Admin, Super Admin
**Authentication:** Required

**Request Body:**
```json
{
  "course_name": "Introduction to Computer Science",
  "course_code": "CS101", 
  "course_description": "A comprehensive introduction to computer science principles",
  "course_meta_data": {
    "credits": 3,
    "level": "Beginner",
    "duration": "16 weeks",
    "instructor": "Dr. Smith"
  }
}
```

**Response (200):**
```json
{
  "id": "course123",
  "campus_id": "campus123",
  "course_name": "Introduction to Computer Science",
  "course_code": "CS101",
  "course_description": "A comprehensive introduction to computer science principles",
  "course_meta_data": {
    "credits": 3,
    "level": "Beginner",
    "duration": "16 weeks",
    "instructor": "Dr. Smith"
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### 2. Get All Courses

**Endpoint:** `GET /api/course/`
**Access:** All authenticated users
**Authentication:** Required

**Response (200):**
```json
[
  {
    "id": "course123",
    "campus_id": "campus123",
    "course_name": "Introduction to Computer Science",
    "course_code": "CS101",
    "course_description": "A comprehensive introduction to computer science principles",
    "course_meta_data": {
      "credits": 3,
      "level": "Beginner"
    },
    "is_active": true,
    "is_deleted": false,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

### 3. Get Course by ID

**Endpoint:** `GET /api/course/{course_id}`
**Access:** All authenticated users
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Unique course identifier

**Response (200):** Same as individual course object above

### 4. Update Course

**Endpoint:** `PUT /api/course/{course_id}`
**Access:** Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Unique course identifier

**Request Body:**
```json
{
  "course_name": "Advanced Computer Science",
  "course_code": "CS201",
  "course_description": "An advanced course in computer science principles",
  "course_meta_data": {
    "credits": 4,
    "level": "Intermediate"
  },
  "is_active": true
}
```

**Response (200):** Updated course object

### 5. Delete Course

**Endpoint:** `DELETE /api/course/{course_id}`
**Access:** Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Unique course identifier

**Response (200):** Deleted course object with `is_deleted: true`

## Course Content Management APIs

### 1. Create Course Content

**Endpoint:** `POST /api/course/{course_id}/content`
**Access:** Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier

**Request Body:**
```json
{
  "content_title": "Week 1: Introduction to Programming",
  "content_description": "This week covers basic programming concepts",
  "content_type": "lesson",
  "content_format": "video",
  "content_data": {
    "video_url": "https://example.com/video.mp4",
    "duration": 1800,
    "thumbnail_url": "https://example.com/thumb.jpg"
  },
  "step_data": {
    "step_number": 1,
    "step_type": "content",
    "step_title": "Introduction",
    "step_instructions": "Watch the introductory video",
    "estimated_time": 30,
    "learning_objectives": ["Understand basic programming concepts"]
  },
  "access_settings": {
    "access_level": "free",
    "available_from": "2023-01-15T00:00:00Z"
  },
  "interaction_settings": {
    "allow_comments": true,
    "allow_notes": true,
    "allow_bookmarks": true,
    "require_completion": true
  },
  "sort_order": 1,
  "meta_data": {
    "created_by": "teacher123",
    "tags": ["programming", "basics"],
    "difficulty_level": "beginner",
    "estimated_completion_time": 45,
    "language": "en"
  }
}
```

**Response (200):**
```json
{
  "id": "content123",
  "campus_id": "campus123",
  "course_id": "course123",
  "content_title": "Week 1: Introduction to Programming",
  "content_description": "This week covers basic programming concepts",
  "content_type": "lesson",
  "content_format": "video",
  "content_data": {
    "video_url": "https://example.com/video.mp4",
    "duration": 1800,
    "thumbnail_url": "https://example.com/thumb.jpg"
  },
  "step_data": {
    "step_number": 1,
    "step_type": "content",
    "step_title": "Introduction",
    "step_instructions": "Watch the introductory video",
    "estimated_time": 30,
    "learning_objectives": ["Understand basic programming concepts"]
  },
  "access_settings": {
    "access_level": "free",
    "available_from": "2023-01-15T00:00:00Z"
  },
  "interaction_settings": {
    "allow_comments": true,
    "allow_notes": true,
    "allow_bookmarks": true,
    "require_completion": true
  },
  "sort_order": 1,
  "meta_data": {
    "created_by": "teacher123",
    "tags": ["programming", "basics"],
    "difficulty_level": "beginner",
    "estimated_completion_time": 45,
    "language": "en"
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### 2. Get All Course Contents

**Endpoint:** `GET /api/course/{course_id}/content`
**Access:** All authenticated users (filtered by role)
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier

**Response (200):** Array of course content objects

### 3. Get Course Content by ID

**Endpoint:** `GET /api/course/{course_id}/content/{content_id}`
**Access:** All authenticated users (with enrollment check)
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `content_id` (string): Content identifier

**Response (200):** Individual content object

### 4. Update Course Content

**Endpoint:** `PUT /api/course/{course_id}/content/{content_id}`
**Access:** Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `content_id` (string): Content identifier

**Request Body:** Same structure as create, but all fields optional

**Response (200):** Updated content object

### 5. Delete Course Content

**Endpoint:** `DELETE /api/course/{course_id}/content/{content_id}`
**Access:** Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `content_id` (string): Content identifier

**Response (200):** Confirmation message

## Course Enrollment APIs

### 1. Enroll in Course

**Endpoint:** `POST /api/course/{course_id}/enroll`
**Access:** Student, or Admin enrolling others
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier

**Request Body:**
```json
{
  "enrollmentData": {
    "enrollment_date": "2023-01-15T00:00:00Z",
    "completion_date": "2023-05-15T00:00:00Z",
    "is_completed": false,
    "is_graded": false,
    "grade_data": [],
    "overall_grade": 0,
    "meta_data": {
      "enrollment_type": "regular",
      "payment_status": "paid"
    }
  }
}
```

**Response (200):**
```json
{
  "id": "enrollment123",
  "campus_id": "campus123",
  "course_id": "course123",
  "user_id": "user123",
  "enrollment_date": "2023-01-15T00:00:00Z",
  "completion_date": "2023-05-15T00:00:00Z",
  "is_completed": false,
  "is_graded": false,
  "grade_data": [],
  "overall_grade": 0,
  "meta_data": {
    "enrollment_type": "regular",
    "payment_status": "paid"
  },
  "created_at": "2023-01-15T00:00:00Z",
  "updated_at": "2023-01-15T00:00:00Z"
}
```

### 2. Get Course Enrollments by Course

**Endpoint:** `GET /api/course/{course_id}/enrollment`
**Access:** Teacher, Admin, Principal
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier

**Response (200):** Array of enrollment objects for the course

### 3. Get Course Enrollment by ID

**Endpoint:** `GET /api/course/{course_id}/enrollment/{enrollment_id}`
**Access:** Student (own enrollment), Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `enrollment_id` (string): Enrollment identifier

**Response (200):** Individual enrollment object

### 4. Update Course Enrollment

**Endpoint:** `PUT /api/course/{course_id}/enrollment/{enrollment_id}`
**Access:** Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `enrollment_id` (string): Enrollment identifier

**Request Body:**
```json
{
  "is_completed": true,
  "overall_grade": 85,
  "grade_data": [
    {
      "assignment_id": "assignment123",
      "grade": 90
    }
  ],
  "meta_data": {
    "completion_date": "2023-04-15T00:00:00Z",
    "final_project_score": 88
  }
}
```

**Response (200):** Updated enrollment object

### 5. Delete Course Enrollment

**Endpoint:** `DELETE /api/course/{course_id}/enrollment/{enrollment_id}`
**Access:** Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `enrollment_id` (string): Enrollment identifier

**Response (200):** Confirmation message

### 6. Get User Enrollments

**Endpoint:** `GET /api/course/enrollment/user/{user_id}`
**Access:** Student (own enrollments), Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `user_id` (string): User identifier

**Response (200):** Array of all enrollments for the user

## Related APIs

### Course Assignments
Available at `/api/assignments` - separate endpoint for assignment management

### Enhanced Course Content
Available at `/api/course-content` - advanced content management features

## Error Responses

All endpoints return consistent error responses:

**500 - Server Error:**
```json
{
  "message": "Error description"
}
```

**401 - Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

## Content Types Supported

### Content Types
- `lesson` - Regular lesson content
- `quiz` - Interactive quiz
- `assignment` - Assignment instructions
- `resource` - Reference materials
- `assessment` - Formal assessment
- `interactive` - Interactive content

### Content Formats
- `text` - Text-based content
- `video` - Video content
- `audio` - Audio content
- `document` - Document files
- `presentation` - Presentation slides
- `interactive` - Interactive media

### Access Levels
- `free` - Open access
- `premium` - Premium subscription required
- `restricted` - Special permission required

## Best Practices

1. **Authentication**: Always include valid JWT token in Authorization header
2. **Role Checking**: API responses are filtered based on user roles automatically
3. **Campus Context**: All operations are scoped to the user's campus
4. **Pagination**: For large result sets, consider implementing pagination
5. **Error Handling**: Always check for error responses and handle appropriately
6. **Content Ordering**: Use `sort_order` field to control content sequence
7. **Meta Data**: Utilize `meta_data` fields for extensible custom properties

## API Flow Examples

### Student Course Journey
1. `GET /api/course/` - Browse available courses
2. `POST /api/course/{course_id}/enroll` - Enroll in course
3. `GET /api/course/{course_id}/content` - Access course materials
4. `GET /api/course/enrollment/user/{user_id}` - Track progress

### Teacher Course Management
1. `POST /api/course/` - Create new course
2. `POST /api/course/{course_id}/content` - Add learning materials
3. `GET /api/course/{course_id}/enrollment` - Monitor student enrollments
4. `PUT /api/course/{course_id}/enrollment/{enrollment_id}` - Grade students

### Admin Course Administration
1. `GET /api/course/` - View all courses in campus
2. `PUT /api/course/{course_id}` - Update course information
3. `DELETE /api/course/{course_id}/content/{content_id}` - Remove inappropriate content
4. `GET /api/course/{course_id}/enrollment` - Monitor course performance
