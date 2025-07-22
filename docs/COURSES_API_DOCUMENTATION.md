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

**🎯 Design Philosophy:** The Course Content API uses a **simplified request schema** for optimal developer experience. Send basic fields, and the system automatically generates comprehensive course content with smart defaults.

### 1. Create Course Content

**Endpoint:** `POST /api/course/{course_id}/content`
**Access:** Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier

**Request Body:** *(Simplified Schema)*
```json
{
  "title": "Week 1: Introduction to Programming",
  "content": "This week covers basic programming concepts and fundamental coding principles",
  "content_type": "text",
  "order": 1
}
```

**Field Descriptions:**
- `title` (string, required): Content title/heading
- `content` (string, required): Main content description/body
- `content_type` (string, required): Type of content - `"text"`, `"video"`, `"audio"`, etc.
- `order` (number, required): Display order (sort position)

**🔧 Auto-Generated Features:**
The API automatically creates the following with smart defaults:
- **Content Data**: Formatted HTML, duration estimates, metadata
- **Access Settings**: Free access, 1-year availability
- **Interaction Settings**: Comments, notes, bookmarks enabled
- **Meta Data**: Creator info, tags, timestamps

**Response (200):** *(Full Enhanced Object)*
```json
{
  "id": "content123",
  "campus_id": "campus123", 
  "course_id": "course123",
  "content_title": "Week 1: Introduction to Programming",
  "content_description": "This week covers basic programming concepts and fundamental coding principles",
  "content_type": "lesson",
  "content_format": "text",
  "content_data": {
    "text_content": "This week covers basic programming concepts and fundamental coding principles",
    "html_content": "<p>This week covers basic programming concepts and fundamental coding principles</p>",
    "duration": 1800
  },
  "access_settings": {
    "access_level": "free",
    "available_from": "2023-01-01T00:00:00Z",
    "available_until": "2024-01-01T00:00:00Z"
  },
  "interaction_settings": {
    "allow_comments": true,
    "allow_notes": true,
    "allow_bookmarks": true,
    "require_completion": false
  },
  "sort_order": 1,
  "meta_data": {
    "created_by": "system",
    "tags": []
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**💡 Key Benefits:**
- ✅ **Simple Input**: Only 4 required fields
- ✅ **Rich Output**: Full-featured content object  
- ✅ **Smart Defaults**: Optimal settings auto-applied
- ✅ **Extensible**: Can add advanced fields later

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

**Request Body:** *(Same simplified structure, all fields optional)*
```json
{
  "title": "Updated Week 1: Advanced Introduction to Programming",
  "content": "Updated content covering advanced programming concepts",
  "content_type": "text",
  "order": 2
}
```

**Response (200):** Updated content object

### 5. Delete Course Content

**Endpoint:** `DELETE /api/course/{course_id}/content/{content_id}`
**Access:** Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `content_id` (string): Content identifier

**Response (200):** Confirmation message

## Course Assignment Submission APIs

### 1. Create Course Assignment Submission

**Endpoint:** `POST /api/course/{course_id}/assignment/{assignment_id}/submission`
**Access:** Student, Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `assignment_id` (string): Assignment identifier

**Request Body:**
```json
{
  "submission_data": {
    "submitted_files": [
      {
        "file_name": "assignment1.pdf",
        "file_url": "https://storage.example.com/files/assignment1.pdf",
        "file_type": "pdf"
      }
    ],
    "submission_text": "This is my submission text",
    "submission_notes": "Additional notes about the submission"
  },
  "meta_data": {
    "submission_type": "file_upload",
    "late_submission": false
  }
}
```

**Response (200):**
```json
{
  "id": "submission123",
  "campus_id": "campus123",
  "course_id": "course123", 
  "assignment_id": "assignment123",
  "user_id": "user123",
  "submission_data": {
    "submitted_files": [...],
    "submission_text": "This is my submission text",
    "submission_notes": "Additional notes about the submission"
  },
  "grade": null,
  "feedback": null,
  "submission_status": "submitted",
  "submitted_at": "2023-01-20T10:30:00Z",
  "graded_at": null,
  "meta_data": {
    "submission_type": "file_upload",
    "late_submission": false
  },
  "created_at": "2023-01-20T10:30:00Z",
  "updated_at": "2023-01-20T10:30:00Z"
}
```

### 2. Get All Assignment Submissions

**Endpoint:** `GET /api/course/{course_id}/assignment/{assignment_id}/submission`
**Access:** Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `assignment_id` (string): Assignment identifier

**Response (200):** Array of submission objects

### 3. Get Assignment Submission by ID

**Endpoint:** `GET /api/course/{course_id}/assignment/{assignment_id}/submission/{submission_id}`
**Access:** Student (own submission), Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `assignment_id` (string): Assignment identifier 
- `submission_id` (string): Submission identifier

**Response (200):** Individual submission object

### 4. Update Assignment Submission

**Endpoint:** `PUT /api/course/{course_id}/assignment/{assignment_id}/submission/{submission_id}`
**Access:** Student (own submission before deadline), Teacher, Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `assignment_id` (string): Assignment identifier
- `submission_id` (string): Submission identifier

**Request Body:**
```json
{
  "grade": 85,
  "feedback": "Good work! Consider improving the conclusion.",
  "submission_status": "graded",
  "graded_at": "2023-01-25T14:30:00Z"
}
```

**Response (200):** Updated submission object

### 5. Delete Assignment Submission

**Endpoint:** `DELETE /api/course/{course_id}/assignment/{assignment_id}/submission/{submission_id}`
**Access:** Student (own submission before deadline), Admin
**Authentication:** Required

**Path Parameters:**
- `course_id` (string): Course identifier
- `assignment_id` (string): Assignment identifier
- `submission_id` (string): Submission identifier

**Response (200):** Confirmation message

## Advanced Course Content (Enhanced API)

**For Advanced Use Cases:** If you need more control over course content structure, step-by-step lessons, or complex content data, use the Enhanced Course Content API at `/api/course-content` which provides:

- **Chapter Management**: Create structured course chapters
- **Lesson Builder**: Step-by-step lesson creation with learning objectives  
- **Material Management**: File uploads, folder organization
- **Analytics**: Watch history, progress tracking
- **Advanced Settings**: Custom access controls, interaction settings

See Enhanced Course Content API documentation for full details.

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
4. **Simplified Content Creation**: Use basic fields (`title`, `content`, `content_type`, `order`) for quick content creation
5. **Content Ordering**: Use `order` field to control content sequence
6. **Advanced Features**: Use Enhanced Course Content API (`/api/course-content`) for complex requirements
7. **Error Handling**: Always check for error responses and handle appropriately
8. **Progressive Enhancement**: Start with simple content, enhance with advanced features as needed

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
