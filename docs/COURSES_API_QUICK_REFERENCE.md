# Course API Quick Reference

## Base URLs
- Development: `http://localhost:4500/api/course`
- Production: `https://dev-api.letscatchup-kcs.com/api/course`

## Authentication
All requests require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Quick Endpoint Reference

### Course Management
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Admin | Create new course |
| GET | `/` | All | Get all courses |
| GET | `/{course_id}` | All | Get specific course |
| PUT | `/{course_id}` | Admin | Update course |
| DELETE | `/{course_id}` | Admin | Delete course |

### Course Content
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/{course_id}/content` | Teacher, Admin | Create content |
| GET | `/{course_id}/content` | All | Get all content |
| GET | `/{course_id}/content/{content_id}` | All | Get specific content |
| PUT | `/{course_id}/content/{content_id}` | Teacher, Admin | Update content |
| DELETE | `/{course_id}/content/{content_id}` | Teacher, Admin | Delete content |

### Course Enrollment
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/{course_id}/enroll` | Student, Admin | Enroll in course |
| GET | `/{course_id}/enrollment` | Teacher, Admin | Get course enrollments |
| GET | `/{course_id}/enrollment/{enrollment_id}` | Student*, Teacher, Admin | Get specific enrollment |
| PUT | `/{course_id}/enrollment/{enrollment_id}` | Teacher, Admin | Update enrollment |
| DELETE | `/{course_id}/enrollment/{enrollment_id}` | Admin | Delete enrollment |
| GET | `/enrollment/user/{user_id}` | Student*, Teacher, Admin | Get user's enrollments |

*Students can only access their own enrollments

## Common Request Examples

### Create Course
```bash
curl -X POST "http://localhost:4500/api/course/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_name": "Web Development Fundamentals",
    "course_code": "WEB101",
    "course_description": "Learn HTML, CSS, and JavaScript basics",
    "course_meta_data": {
      "credits": 3,
      "level": "Beginner",
      "duration": "12 weeks"
    }
  }'
```

### Get All Courses
```bash
curl -X GET "http://localhost:4500/api/course/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Enroll in Course
```bash
curl -X POST "http://localhost:4500/api/course/course123/enroll" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentData": {
      "enrollment_date": "2023-01-15T00:00:00Z",
      "completion_date": "2023-05-15T00:00:00Z",
      "is_completed": false,
      "is_graded": false,
      "grade_data": [],
      "overall_grade": 0,
      "meta_data": {
        "enrollment_type": "regular"
      }
    }
  }'
```

### Create Course Content
```bash
curl -X POST "http://localhost:4500/api/course/course123/content" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_title": "Introduction to HTML",
    "content_description": "Basic HTML structure and elements",
    "content_type": "lesson",
    "content_format": "video",
    "content_data": {
      "video_url": "https://example.com/html-intro.mp4",
      "duration": 1200,
      "thumbnail_url": "https://example.com/thumb.jpg"
    },
    "access_settings": {
      "access_level": "free"
    },
    "interaction_settings": {
      "allow_comments": true,
      "allow_notes": true,
      "require_completion": true
    },
    "sort_order": 1,
    "meta_data": {
      "created_by": "teacher123",
      "difficulty_level": "beginner",
      "estimated_completion_time": 30
    }
  }'
```

## Response Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid payload |
| 401 | Unauthorized - Invalid token or insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

## Role-Based Access Summary

### Student Permissions
- ✅ View courses
- ✅ View course content (enrolled courses)
- ✅ Enroll in courses
- ✅ View own enrollment status
- ❌ Create/modify courses
- ❌ Manage other users' enrollments

### Teacher Permissions
- ✅ View courses
- ✅ Create/update course content
- ✅ View course enrollments
- ✅ Grade students
- ✅ Manage course materials
- ❌ Create new courses*
- ❌ Delete courses*

### Admin Permissions
- ✅ Full course CRUD operations
- ✅ Full content management
- ✅ Full enrollment management
- ✅ System analytics
- ✅ User management

*May vary by institution configuration

## Common Payload Structures

### Course Object
```json
{
  "id": "string",
  "campus_id": "string",
  "course_name": "string",
  "course_code": "string", 
  "course_description": "string",
  "course_meta_data": {},
  "is_active": boolean,
  "is_deleted": boolean,
  "created_at": "ISO string",
  "updated_at": "ISO string"
}
```

### Course Content Object
```json
{
  "id": "string",
  "campus_id": "string",
  "course_id": "string",
  "content_title": "string",
  "content_description": "string",
  "content_type": "lesson|quiz|assignment|resource|assessment|interactive",
  "content_format": "text|video|audio|document|presentation|interactive",
  "content_data": {},
  "access_settings": {},
  "interaction_settings": {},
  "sort_order": number,
  "meta_data": {},
  "is_active": boolean,
  "is_deleted": boolean,
  "created_at": "ISO string",
  "updated_at": "ISO string"
}
```

### Enrollment Object
```json
{
  "id": "string",
  "campus_id": "string",
  "course_id": "string",
  "user_id": "string",
  "enrollment_date": "ISO string",
  "completion_date": "ISO string",
  "is_completed": boolean,
  "is_graded": boolean,
  "grade_data": [],
  "overall_grade": number,
  "meta_data": {},
  "created_at": "ISO string",
  "updated_at": "ISO string"
}
```

## Testing with Postman

1. Import the OpenAPI spec from `/openapi`
2. Set environment variables:
   - `base_url`: `http://localhost:4500/api`
   - `auth_token`: Your JWT token
3. Use `{{base_url}}/course/` for course endpoints
4. Add `Authorization: Bearer {{auth_token}}` to all requests

## Related Documentation

- [Main API Documentation](./DOCUMENTATION_STRUCTURE.md)
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md)
- [Assignment API Documentation](./ASSIGNMENTS_API_DOCUMENTATION.md)
- Interactive API docs: `http://localhost:4500/docs`
