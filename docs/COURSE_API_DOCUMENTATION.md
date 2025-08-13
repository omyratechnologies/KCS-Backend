# Course Management API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Course Management APIs](#course-management-apis)
4. [Section Management APIs](#section-management-apis)
5. [Lecture Management APIs](#lecture-management-apis)
6. [Enrollment APIs](#enrollment-apis)
7. [Progress Tracking APIs](#progress-tracking-apis)
8. [Analytics APIs](#analytics-apis)
9. [Learning Schedule APIs](#learning-schedule-apis)
10. [Error Handling](#error-handling)
11. [Common Response Patterns](#common-response-patterns)

---

## Overview

The Course Management API provides a comprehensive learning management system similar to
Udemy/Coursera platforms. It supports course creation, enrollment, progress tracking, certificates,
and detailed analytics.

### Key Features

- ✅ Course CRUD operations with advanced filtering
- ✅ Section and lecture management with ordering
- ✅ Student enrollment with business logic validation
- ✅ Real-time progress tracking with resume functionality
- ✅ Automatic certificate generation
- ✅ Comprehensive analytics and insights
- ✅ Learning schedules and reminders
- ✅ Achievement system with gamification

### Base URL

```
https://api.kcs-platform.com/api/v1
```

---

## Authentication

All endpoints require JWT authentication via Bearer token.

```http
Authorization: Bearer <jwt_token>
```

### User Roles

- **Student**: Can view, enroll, and track progress
- **Teacher**: Can create, manage courses and view analytics
- **Admin**: Full access to all operations
- **Super Admin**: Platform-wide access
- **Parent**: Can view child's progress

---

## Course Management APIs

### 1. Create Course

Creates a new course in draft status.

**Endpoint:** `POST /courses`

**Headers:**

```json
{
    "Authorization": "Bearer <jwt_token>",
    "Content-Type": "application/json"
}
```

**Request Payload:**

```json
{
    "title": "Master Node.js from scratch",
    "description": "Comprehensive Node.js course covering basics to advanced topics",
    "short_description": "Learn Node.js and become a Full Stack Developer",
    "category": "Programming",
    "subcategory": "Web Development",
    "difficulty_level": "intermediate",
    "language": "English",
    "price": 99.99,
    "estimated_duration_hours": 25,
    "learning_objectives": [
        "Build RESTful APIs with Node.js",
        "Integrate with MongoDB",
        "Deploy applications to production"
    ],
    "prerequisites": ["Basic JavaScript knowledge", "HTML/CSS fundamentals"],
    "tags": ["nodejs", "javascript", "backend", "api"],
    "thumbnail": "https://example.com/thumbnail.jpg",
    "trailer_video_url": "https://example.com/trailer.mp4",
    "instructor_ids": ["instructor_123"],
    "class_id": "class_456",
    "is_featured": false,
    "is_certificate_enabled": true,
    "max_enrollments": 1000,
    "enrollment_start_date": "2025-01-01T00:00:00Z",
    "enrollment_end_date": "2025-12-31T23:59:59Z",
    "course_start_date": "2025-01-15T00:00:00Z",
    "course_end_date": "2025-11-30T23:59:59Z"
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "data": {
        "id": "course_789",
        "campus_id": "campus_123",
        "title": "Master Node.js from scratch",
        "description": "Comprehensive Node.js course covering basics to advanced topics",
        "status": "draft",
        "price": 99.99,
        "rating": 0,
        "rating_count": 0,
        "enrollment_count": 0,
        "completion_count": 0,
        "version": 1,
        "created_by": "user_123",
        "created_at": "2025-08-02T12:00:00Z",
        "updated_at": "2025-08-02T12:00:00Z"
    },
    "message": "Course created successfully"
}
```

### 2. Get Courses with Filtering

Retrieves courses with advanced filtering, search, and pagination.

**Endpoint:** `GET /courses`

**Query Parameters:**

```
page=1                    # Page number (default: 1)
limit=20                  # Items per page (default: 20)
status=published          # Course status: draft, published, archived
category=Programming      # Course category
difficulty_level=intermediate  # beginner, intermediate, advanced
price_range=50-100       # Price range or "free" or "paid"
search_query=nodejs      # Search in title, description, tags
instructor_id=user_123   # Filter by instructor
class_id=class_456      # Filter by class
is_featured=true        # Featured courses only
sort_by=created_at      # Sort field
sort_order=desc         # asc or desc
```

**Example Request:**

```http
GET /courses?status=published&category=Programming&page=1&limit=10&search_query=nodejs
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "courses": [
            {
                "id": "course_789",
                "title": "Master Node.js from scratch",
                "description": "Comprehensive Node.js course",
                "thumbnail": "https://example.com/thumbnail.jpg",
                "category": "Programming",
                "difficulty_level": "intermediate",
                "price": 99.99,
                "rating": 4.8,
                "rating_count": 245,
                "enrollment_count": 1250,
                "estimated_duration_hours": 25,
                "instructor_names": ["John Doe"],
                "is_featured": true,
                "created_at": "2025-08-02T12:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 10,
            "total_items": 45,
            "total_pages": 5,
            "has_next": true,
            "has_previous": false
        },
        "filters_applied": {
            "status": "published",
            "category": "Programming",
            "search_query": "nodejs"
        },
        "summary": {
            "total_courses": 45,
            "published_courses": 35,
            "draft_courses": 8,
            "featured_courses": 12,
            "free_courses": 15,
            "paid_courses": 30
        }
    },
    "message": "Courses retrieved successfully"
}
```

### 3. Get Course by ID

Retrieves detailed course information including sections and lectures. Returns **course data only** - no enrollment information.

**Endpoint:** `GET /courses/{course_id}`

**Path Parameters:**

- `course_id`: Unique course identifier

**Note:** This endpoint returns only course metadata. For enrollment information, use `/courses/{course_id}/enrollment`

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "course_789",
        "title": "Master Node.js from scratch",
        "description": "Comprehensive Node.js course covering basics to advanced topics",
        "thumbnail": "https://example.com/thumbnail.jpg",
        "category": "Programming",
        "difficulty_level": "intermediate",
        "price": 99.99,
        "rating": 4.8,
        "rating_count": 245,
        "enrollment_count": 1250,
        "completion_count": 890,
        "estimated_duration_hours": 25,
        "learning_objectives": ["Build RESTful APIs with Node.js", "Integrate with MongoDB"],
        "prerequisites": ["Basic JavaScript knowledge"],
        "sections": [
            {
                "id": "section_123",
                "title": "Introduction to Node.js",
                "description": "Getting started with Node.js",
                "section_order": 1,
                "lectures": [
                    {
                        "id": "lecture_456",
                        "title": "What is Node.js?",
                        "lecture_type": "video",
                        "estimated_duration_minutes": 15,
                        "is_mandatory": true,
                        "is_preview": true,
                        "lecture_order": 1,
                        "user_progress": {
                            "progress_status": "completed",
                            "completion_percentage": 100,
                            "last_accessed_at": "2025-08-01T10:30:00Z",
                            "resume_position_seconds": 0
                        }
                    }
                ],
                "lecture_count": 5,
                "total_duration_minutes": 120
            }
        ],
        "total_sections": 8,
        "total_lectures": 43,
        "total_duration_minutes": 1500,
        "instructors": [
            {
                "id": "instructor_123",
                "name": "John Doe",
                "email": "john@example.com",
                "profile_image": "https://example.com/profile.jpg"
            }
        ]
    },
    "message": "Course retrieved successfully"
}
```

### 4. Update Course

Updates course information.

**Endpoint:** `PUT /courses/{course_id}`

**Request Payload:**

```json
{
    "title": "Advanced Node.js Development",
    "description": "Updated course description",
    "price": 129.99,
    "is_featured": true
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "course_789",
        "title": "Advanced Node.js Development",
        "description": "Updated course description",
        "price": 129.99,
        "version": 2,
        "last_updated_by": "user_123",
        "updated_at": "2025-08-02T14:30:00Z"
    },
    "message": "Course updated successfully"
}
```

### 5. Publish Course

Publishes a course (changes status from draft to published).

**Endpoint:** `POST /courses/{course_id}/publish`

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "course_789",
        "status": "published",
        "updated_at": "2025-08-02T15:00:00Z"
    },
    "message": "Course published successfully"
}
```

### 6. Delete Course

Archives a course (soft delete).

**Endpoint:** `DELETE /courses/{course_id}`

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Course archived successfully"
}
```

---

## Section Management APIs

### 1. Create Course Section

Creates a new section within a course.

**Endpoint:** `POST /courses/{course_id}/sections`

**Request Payload:**

```json
{
    "title": "Advanced Topics",
    "description": "Covering advanced Node.js concepts",
    "section_order": 3,
    "is_published": true,
    "estimated_duration_minutes": 240,
    "learning_objectives": ["Understand event loops", "Master async programming"]
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "data": {
        "id": "section_456",
        "course_id": "course_789",
        "campus_id": "campus_123",
        "title": "Advanced Topics",
        "description": "Covering advanced Node.js concepts",
        "section_order": 3,
        "is_published": true,
        "created_at": "2025-08-02T16:00:00Z"
    },
    "message": "Course section created successfully"
}
```

## Lecture Management APIs

### 1. Create Course Lecture

Creates a new lecture within a section.

**Endpoint:** `POST /sections/{section_id}/lectures`

**Request Payload:**

```json
{
    "title": "Understanding Event Loops",
    "description": "Deep dive into Node.js event loops",
    "lecture_type": "video",
    "content_url": "https://example.com/video.mp4",
    "estimated_duration_minutes": 25,
    "lecture_order": 1,
    "is_mandatory": true,
    "is_preview": false,
    "is_published": true,
    "resources": [
        {
            "title": "Event Loop Diagram",
            "type": "pdf",
            "url": "https://example.com/diagram.pdf"
        }
    ],
    "learning_objectives": ["Understand event loop phases", "Learn about callback queue"]
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "data": {
        "id": "lecture_789",
        "course_id": "course_789",
        "section_id": "section_456",
        "campus_id": "campus_123",
        "title": "Understanding Event Loops",
        "lecture_type": "video",
        "estimated_duration_minutes": 25,
        "lecture_order": 1,
        "is_mandatory": true,
        "created_at": "2025-08-02T17:00:00Z"
    },
    "message": "Course lecture created successfully"
}
```

### 2. Update Lecture Order

Updates the order of lectures within a section.

**Endpoint:** `PUT /sections/{section_id}/lectures/order`

**Request Payload:**

```json
{
    "lecture_orders": [
        {
            "id": "lecture_789",
            "lecture_order": 1
        },
        {
            "id": "lecture_012",
            "lecture_order": 2
        }
    ]
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Lecture order updated successfully"
}
```

---

## Enrollment APIs

### 1. Enroll in Course

Enrolls a user in a course with business logic validation.

**Endpoint:** `POST /courses/{course_id}/enroll`

**Request Payload:**

```json
{
    "user_id": "user_123",
    "enrollment_type": "paid",
    "enrollment_source": "web",
    "payment_method": "credit_card",
    "coupon_code": "SAVE20",
    "meta_data": {
        "referral_source": "google_ads",
        "campaign_id": "summer_2025"
    }
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "data": {
        "id": "enrollment_456",
        "course_id": "course_789",
        "user_id": "user_123",
        "campus_id": "campus_123",
        "enrollment_type": "paid",
        "enrollment_status": "active",
        "progress_percentage": 0,
        "enrollment_date": "2025-08-02T18:00:00Z",
        "payment_status": "completed",
        "certificate_issued": false,
        "access_details": {
            "total_lectures": 43,
            "completed_lectures": 0,
            "completed_lecture_ids": [],
            "bookmarked_lectures": [],
            "notes_count": 0,
            "quiz_attempts": 0,
            "assignment_submissions": 0
        }
    },
    "message": "Successfully enrolled in course"
}
```

### 2. Get Course Enrollment

Retrieves the authenticated user's enrollment information for a specific course.

**Endpoint:** `GET /courses/{course_id}/enrollment`

**Path Parameters:**

- `course_id`: Unique course identifier

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "enrollment_456",
        "course_id": "course_789",
        "user_id": "user_123",
        "campus_id": "campus_123",
        "enrollment_type": "paid",
        "enrollment_status": "active",
        "progress_percentage": 35,
        "enrollment_date": "2025-07-15T09:00:00Z",
        "payment_status": "completed",
        "certificate_issued": false,
        "course_details": {
            "id": "course_789",
            "title": "Master Node.js from scratch",
            "thumbnail": "https://example.com/thumbnail.jpg",
            "category": "Programming",
            "difficulty_level": "intermediate",
            "estimated_duration_hours": 25,
            "rating": 4.8
        },
        "progress_details": {
            "total_lectures": 43,
            "completed_lectures": 15,
            "time_remaining_hours": 16.25,
            "total_watch_time_hours": 8.75
        },
        "access_details": {
            "total_lectures": 43,
            "completed_lectures": 15,
            "completed_lecture_ids": ["lec_1", "lec_2", "lec_3"],
            "bookmarked_lectures": ["lec_5", "lec_12"],
            "notes_count": 8,
            "quiz_attempts": 3,
            "assignment_submissions": 2
        }
    },
    "message": "Course enrollment retrieved successfully"
}
```

**Error Response (404 Not Found):**

```json
{
    "success": false,
    "error": "User is not enrolled in this course"
}
```

### 3. Get User's Enrolled Courses

Retrieves all courses a user is enrolled in.

**Endpoint:** `GET /users/{user_id}/enrollments`

**Query Parameters:**

```
status=active           # Filter by enrollment status
progress=in_progress    # not_started, in_progress, completed
page=1                  # Page number
limit=20               # Items per page
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "enrollments": [
            {
                "id": "enrollment_456",
                "course_id": "course_789",
                "enrollment_status": "active",
                "progress_percentage": 35,
                "enrollment_date": "2025-07-15T09:00:00Z",
                "certificate_issued": false,
                "course_details": {
                    "title": "Master Node.js from scratch",
                    "thumbnail": "https://example.com/thumbnail.jpg",
                    "category": "Programming",
                    "difficulty_level": "intermediate",
                    "estimated_duration_hours": 25,
                    "rating": 4.8,
                    "total_lectures": 43,
                    "completed_lectures": 15,
                    "time_remaining_hours": 16.25,
                    "last_updated": "2025-08-01T12:00:00Z"
                }
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total_items": 5,
            "total_pages": 1,
            "has_next": false,
            "has_previous": false
        }
    },
    "message": "Enrolled courses retrieved successfully"
}
```

---

## Progress Tracking APIs

### 1. Update Course Progress

Updates user's progress for a specific lecture.

**Endpoint:** `POST /courses/{course_id}/progress`

**Request Payload:**

```json
{
    "lecture_id": "lecture_789",
    "user_id": "user_123",
    "progress_status": "in_progress",
    "watch_time_seconds": 450,
    "total_duration_seconds": 900,
    "completion_percentage": 50,
    "resume_position_seconds": 450,
    "interaction_data": {
        "play_count": 3,
        "pause_count": 2,
        "seek_count": 1,
        "speed_changes": 0,
        "quality_changes": 1,
        "fullscreen_toggles": 1,
        "notes_taken": 0,
        "bookmarked": false,
        "liked": true
    },
    "device_info": {
        "device_type": "desktop",
        "browser": "Chrome",
        "os": "macOS"
    },
    "notes": [
        {
            "timestamp_seconds": 300,
            "note_text": "Important concept about event loops",
            "created_at": "2025-08-02T19:00:00Z"
        }
    ]
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "id": "progress_123",
        "course_id": "course_789",
        "user_id": "user_123",
        "lecture_id": "lecture_789",
        "progress_status": "in_progress",
        "completion_percentage": 50,
        "watch_time_seconds": 450,
        "resume_position_seconds": 450,
        "last_accessed_at": "2025-08-02T19:00:00Z"
    },
    "message": "Progress updated successfully"
}
```

### 2. Get Detailed Course Progress (Udemy-style)

Retrieves comprehensive course progress with section and lecture breakdown.

**Endpoint:** `GET /courses/{course_id}/progress-details`

**Query Parameters:**

```
user_id=user_123    # Required: User ID
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "course_info": {
            "id": "course_789",
            "title": "Master Node.js from scratch",
            "description": "Comprehensive Node.js course",
            "thumbnail": "https://example.com/thumbnail.jpg",
            "category": "Programming",
            "difficulty_level": "intermediate",
            "rating": 4.8,
            "instructor_names": ["John Doe"],
            "last_updated": "2025-08-01T12:00:00Z"
        },
        "enrollment_info": {
            "enrollment_date": "2025-07-15T09:00:00Z",
            "enrollment_status": "active",
            "progress_percentage": 35,
            "certificate_issued": false,
            "certificate_id": null
        },
        "progress_summary": {
            "total_lectures": 43,
            "completed_lectures": 15,
            "completion_percentage": 35,
            "total_duration_minutes": 1500,
            "watched_duration_minutes": 525,
            "estimated_remaining_minutes": 975,
            "time_to_completion": "16hr 15min"
        },
        "sections": [
            {
                "id": "section_123",
                "title": "Introduction to Node.js",
                "description": "Getting started with Node.js",
                "section_order": 1,
                "completion_percentage": 80,
                "progress": {
                    "total_lectures": 5,
                    "completed_lectures": 4,
                    "total_duration_minutes": 120,
                    "watched_duration_minutes": 96
                },
                "lectures": [
                    {
                        "id": "lecture_456",
                        "title": "What is Node.js?",
                        "lecture_type": "video",
                        "estimated_duration_minutes": 15,
                        "is_mandatory": true,
                        "is_preview": true,
                        "lecture_order": 1,
                        "resources_count": 2,
                        "is_completed": true,
                        "watch_percentage": 100,
                        "watch_time_seconds": 900,
                        "last_accessed_at": "2025-08-01T10:30:00Z",
                        "resume_position_seconds": 0,
                        "is_bookmarked": false,
                        "notes_count": 1,
                        "status": "completed"
                    }
                ]
            }
        ],
        "next_lecture": {
            "lecture_id": "lecture_789",
            "lecture_title": "Understanding Event Loops",
            "section_title": "Advanced Topics",
            "resume_position_seconds": 450,
            "estimated_duration_minutes": 25
        },
        "bookmarked_lectures": [
            {
                "id": "lecture_012",
                "title": "Async/Await Patterns",
                "section_title": "Advanced Topics"
            }
        ]
    },
    "message": "Course progress details retrieved successfully"
}
```

---

## Analytics APIs

### 1. Get Course Analytics

Retrieves comprehensive course analytics for instructors.

**Endpoint:** `GET /courses/{course_id}/analytics`

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "course_overview": {
            "total_enrollments": 1250,
            "active_enrollments": 450,
            "completed_enrollments": 800,
            "completion_rate": 64.0,
            "average_completion_time_hours": 18.5,
            "average_rating": 4.8,
            "total_revenue": 124750.0
        },
        "engagement_metrics": {
            "total_watch_time_hours": 15625.5,
            "average_session_duration_minutes": 22.3,
            "video_completion_rate": 78.5,
            "quiz_attempt_rate": 85.2,
            "assignment_submission_rate": 72.1,
            "discussion_participation_rate": 45.8
        },
        "content_performance": [
            {
                "lecture_id": "lecture_456",
                "lecture_title": "What is Node.js?",
                "lecture_type": "video",
                "view_count": 1200,
                "completion_rate": 95.2,
                "average_watch_time_percentage": 88.7,
                "dropout_rate": 4.8,
                "engagement_score": 91.95
            }
        ],
        "student_progress": [
            {
                "user_id": "user_123",
                "student_name": "John Smith",
                "enrollment_date": "2025-07-15T09:00:00Z",
                "progress_percentage": 35,
                "last_accessed": "2025-08-01T19:30:00Z",
                "completion_status": "active",
                "grade": "B+"
            }
        ],
        "time_series_data": {
            "daily_enrollments": [
                {
                    "date": "2025-08-01",
                    "enrollments": 25
                }
            ],
            "weekly_engagement": [
                {
                    "week": "2025-W31",
                    "total_watch_hours": 1250.5,
                    "active_students": 320
                }
            ]
        }
    },
    "message": "Course analytics retrieved successfully"
}
```

---

## Learning Schedule APIs

### 1. Set Learning Schedule

Sets up a learning schedule with reminders (Udemy-style).

**Endpoint:** `POST /courses/{course_id}/schedule`

**Request Payload:**

```json
{
    "user_id": "user_123",
    "target_completion_date": "2025-12-31T23:59:59Z",
    "daily_study_minutes": 30,
    "study_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "reminder_time": "19:00",
    "timezone": "America/New_York",
    "send_reminders": true
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "learning_schedule": {
            "target_completion_date": "2025-12-31T23:59:59Z",
            "daily_study_minutes": 30,
            "study_days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
            "reminder_time": "19:00",
            "timezone": "America/New_York",
            "send_reminders": true,
            "created_at": "2025-08-02T20:00:00Z"
        },
        "recommendations": {
            "daily_study_minutes": 30,
            "estimated_completion_date": "2025-12-31T23:59:59Z",
            "total_study_sessions": 50
        }
    },
    "message": "Learning schedule set successfully"
}
```

### 2. Get Learning Statistics

Retrieves learning statistics and achievements.

**Endpoint:** `GET /users/{user_id}/learning-stats`

**Query Parameters:**

```
timeframe=month    # week, month, year
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "timeframe": "month",
        "period": {
            "start_date": "2025-07-02T00:00:00Z",
            "end_date": "2025-08-02T23:59:59Z"
        },
        "statistics": {
            "total_watch_time_hours": 25.5,
            "total_watch_time_minutes": 1530,
            "unique_lectures_watched": 18,
            "lectures_completed": 15,
            "courses_in_progress": 3,
            "courses_completed": 1,
            "average_daily_minutes": 49.4
        },
        "engagement": {
            "current_streak_days": 7,
            "longest_streak_days": 12,
            "active_days": 22,
            "consistency_percentage": 71
        },
        "daily_activity": [
            {
                "date": "2025-08-01T00:00:00Z",
                "minutes": 45,
                "lectures_watched": 2,
                "lectures_completed": 1
            }
        ],
        "achievements": [
            {
                "type": "time",
                "title": "Dedicated Learner",
                "description": "Completed 10 hours of learning"
            },
            {
                "type": "completion",
                "title": "Course Finisher",
                "description": "Completed your first course"
            }
        ]
    },
    "message": "Learning statistics retrieved successfully"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
    "success": false,
    "error": "Error message describing what went wrong",
    "error_code": "COURSE_NOT_FOUND",
    "details": {
        "field": "course_id",
        "message": "Course with ID 'invalid_id' not found"
    },
    "timestamp": "2025-08-02T20:30:00Z"
}
```

### Common Error Codes

| Code                       | Status | Description                         |
| -------------------------- | ------ | ----------------------------------- |
| `COURSE_NOT_FOUND`         | 404    | Course does not exist               |
| `UNAUTHORIZED`             | 401    | Invalid or missing authentication   |
| `FORBIDDEN`                | 403    | Insufficient permissions            |
| `VALIDATION_ERROR`         | 400    | Invalid request payload             |
| `ALREADY_ENROLLED`         | 409    | User already enrolled in course     |
| `ENROLLMENT_LIMIT_REACHED` | 409    | Course enrollment limit exceeded    |
| `COURSE_NOT_PUBLISHED`     | 400    | Cannot enroll in unpublished course |
| `ENROLLMENT_PERIOD_ENDED`  | 400    | Enrollment period has ended         |
| `PAYMENT_REQUIRED`         | 402    | Payment required for paid course    |
| `SECTION_REQUIRED`         | 400    | Course needs at least one section   |
| `LECTURE_REQUIRED`         | 400    | Course needs at least one lecture   |

### Example Error Responses

**Course Not Found:**

```json
{
    "success": false,
    "error": "Course not found",
    "error_code": "COURSE_NOT_FOUND",
    "timestamp": "2025-08-02T20:30:00Z"
}
```

**Already Enrolled:**

```json
{
    "success": false,
    "error": "User is already enrolled in this course",
    "error_code": "ALREADY_ENROLLED",
    "timestamp": "2025-08-02T20:30:00Z"
}
```

**Validation Error:**

```json
{
    "success": false,
    "error": "Validation failed",
    "error_code": "VALIDATION_ERROR",
    "details": {
        "title": "Title is required",
        "price": "Price must be a positive number"
    },
    "timestamp": "2025-08-02T20:30:00Z"
}
```

---

## Common Response Patterns

### Success Response Structure

```json
{
    "success": true,
    "data": {
        /* Response data */
    },
    "message": "Operation completed successfully",
    "timestamp": "2025-08-02T20:30:00Z"
}
```

### Pagination Structure

```json
{
    "pagination": {
        "current_page": 1,
        "per_page": 20,
        "total_items": 150,
        "total_pages": 8,
        "has_next": true,
        "has_previous": false
    }
}
```

### Progress Tracking Structure

```json
{
    "progress_status": "in_progress", // not_started, in_progress, completed
    "completion_percentage": 65,
    "watch_time_seconds": 1200,
    "resume_position_seconds": 450,
    "last_accessed_at": "2025-08-02T19:00:00Z"
}
```

---

## Rate Limiting

API requests are rate limited:

- **Students**: 100 requests per minute
- **Teachers**: 200 requests per minute
- **Admins**: 500 requests per minute

Rate limit headers included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691006400
```

---

## Webhook Events

The system can send webhook notifications for:

- Course enrollment
- Progress milestones (25%, 50%, 75%, 100%)
- Course completion
- Certificate generation
- Assignment submissions

**Webhook Payload Example:**

```json
{
    "event": "course.completed",
    "timestamp": "2025-08-02T20:30:00Z",
    "data": {
        "course_id": "course_789",
        "user_id": "user_123",
        "completion_date": "2025-08-02T20:30:00Z",
        "certificate_id": "cert_456"
    }
}
```

---

This documentation provides a comprehensive guide to the Course Management API with clear
request/response examples, error handling, and business logic flows similar to industry-leading
platforms like Udemy and Coursera.
