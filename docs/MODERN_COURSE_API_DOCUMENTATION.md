# Modern Course Content API Documentation

## Overview

This document describes the new unified Course Content API that follows a Udemy-style structure with sections and lectures. The API is designed to be production-ready with comprehensive features for content management, user progress tracking, notes, discussions, and more.

## Architecture

### Models Structure

1. **Course Model** (`course.model.ts`)
   - Main course information (title, description, instructor, pricing, etc.)
   - Course settings (language, skill level, certificate, etc.)
   - Course statistics (enrollments, ratings, completion rates)

2. **Course Content Model** (`course_content.model.ts`)
   - Hierarchical structure: Course → Sections → Lectures
   - Support for multiple content types (video, text, quiz, assignment, resource)
   - Rich content data with analytics and engagement metrics
   - Resources attached to lectures (PDFs, documents, etc.)

3. **Course Enrollment Model** (`course_enrollment.model.ts`)
   - User enrollment tracking (free, paid, scholarship)
   - Access control and permissions
   - Progress tracking at enrollment level
   - Payment information for paid courses

4. **Course Progress Model** (`course_progress.model.ts`)
   - Detailed progress tracking per user per course
   - Section-wise and lecture-wise completion tracking
   - Time tracking and engagement metrics
   - Learning streaks and prediction data
   - Certificate eligibility tracking

5. **Course User Notes Model** (`course_user_notes.model.ts`)
   - User notes on lectures with timestamps
   - Different note types (text, highlight, bookmark, question)
   - Sharing and collaboration features
   - Rich text support and context information

6. **Course Discussion Model** (`course_discussion.model.ts`)
   - Q&A and general discussions
   - Thread hierarchy with replies
   - Engagement metrics (upvotes, views, replies)
   - Moderation features and rich content support

### Service Layer

- **CourseService** (`course.service.ts`)
  - Centralized business logic for all course operations
  - Handles complex operations like progress calculation
  - Manages relationships between different models
  - Provides clean interface for controllers

### Controller Layer

- **CourseController** (`course.controller.ts`)
  - RESTful API endpoints for all course operations
  - Input validation and error handling
  - Response formatting and status codes
  - Authentication and authorization integration

### Routes

- **Course Routes** (`course.route.ts`)
  - OpenAPI documentation for all endpoints
  - Request/response schemas validation
  - Middleware integration for auth and roles
  - Comprehensive API documentation

## API Endpoints

### Course Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses` | Create a new course |
| GET | `/api/courses` | Get all courses (with filters) |
| GET | `/api/courses/{course_id}` | Get course by ID |
| PUT | `/api/courses/{course_id}` | Update course |
| DELETE | `/api/courses/{course_id}` | Delete course |

### Course Content Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/{course_id}/content` | Create course content (sections/lectures) |
| GET | `/api/courses/{course_id}/content` | Get course content structure |
| GET | `/api/courses/{course_id}/content/{content_id}` | Get specific lecture content |
| PUT | `/api/courses/{course_id}/content/{content_id}` | Update course content |
| DELETE | `/api/courses/{course_id}/content/{content_id}` | Delete course content |

### Enrollment Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/{course_id}/enroll` | Enroll in course |
| GET | `/api/courses/my-enrollments` | Get user's enrollments |

### Progress Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/{course_id}/content/{content_id}/progress` | Update lecture progress |

### User Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/{course_id}/content/{content_id}/notes` | Create a note |
| GET | `/api/courses/{course_id}/notes` | Get user notes |

### Discussions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/courses/{course_id}/discussions` | Create a discussion |
| GET | `/api/courses/{course_id}/discussions` | Get discussions |

## Content Structure (Udemy-style)

```
Course
├── Section 1: Introduction
│   ├── Lecture 1.1: Welcome to the Course [Video]
│   ├── Lecture 1.2: Course Overview [Text]
│   └── Lecture 1.3: Download Course Materials [Resource]
├── Section 2: Getting Started
│   ├── Lecture 2.1: Setting Up Environment [Video]
│   │   └── Resources: setup-guide.pdf, code-files.zip
│   ├── Lecture 2.2: Your First Project [Video]
│   └── Lecture 2.3: Quiz: Basics Quiz [Quiz]
└── Section 3: Advanced Topics
    ├── Lecture 3.1: Advanced Concepts [Video]
    ├── Lecture 3.2: Assignment: Build a Project [Assignment]
    └── Lecture 3.3: Live Q&A Session [Live Session]
```

## Features

### Content Types Supported
- **Video**: Video lectures with multiple quality options, subtitles
- **Text**: Rich text content with HTML support
- **Quiz**: Interactive quizzes with progress tracking
- **Assignment**: Assignments with submission tracking
- **Resource**: Downloadable files (PDFs, documents, etc.)
- **Live Session**: Live streaming sessions
- **Download**: Direct download links

### User Progress Tracking
- Video watch time and completion percentage
- Section-wise progress tracking
- Overall course completion tracking
- Learning streaks and engagement metrics
- Predictive completion analytics

### User Notes and Annotations
- Timestamp-based notes for videos
- Text highlighting and bookmarking
- Different note types (question, reminder, etc.)
- Private and shared notes
- Full-text search in notes

### Discussion System
- Q&A threads with instructor replies
- Course-wide and lecture-specific discussions
- Upvoting/downvoting system
- Moderation features
- Rich text and attachment support

### Access Control
- Free and paid course support
- Preview mode for non-enrolled users
- Role-based permissions
- Time-based access restrictions
- Download permissions

### Analytics and Reporting
- Course performance metrics
- User engagement analytics
- Completion rates and trends
- Popular content identification
- Learning pattern analysis

## Usage Examples

### Creating a Course

```json
POST /api/courses
{
  "course_title": "Complete Web Development Bootcamp",
  "course_description": "Learn full-stack web development from scratch",
  "instructor_name": "John Doe",
  "course_category": "Programming",
  "pricing": {
    "type": "paid",
    "price": 99.99,
    "currency": "USD"
  },
  "course_settings": {
    "skill_level": "beginner",
    "estimated_duration": 40,
    "has_certificate": true
  }
}
```

### Creating Course Content

```json
POST /api/courses/{course_id}/content
{
  "section_id": "section_1",
  "section_title": "Introduction to Web Development",
  "section_order": 1,
  "lecture_title": "What is Web Development?",
  "lecture_description": "An introduction to web development concepts",
  "lecture_order": 1,
  "content_type": "video",
  "content_format": "video",
  "content_data": {
    "video_url": "https://example.com/video.mp4",
    "video_duration": 1800,
    "preview_available": true
  },
  "resources": [
    {
      "file_name": "course-slides.pdf",
      "file_url": "https://example.com/slides.pdf",
      "file_type": "pdf",
      "file_size": 2048000,
      "is_downloadable": true
    }
  ]
}
```

### Tracking Progress

```json
POST /api/courses/{course_id}/content/{content_id}/progress
{
  "watch_time": 1200,
  "completion_percentage": 80,
  "is_completed": false,
  "section_id": "section_1"
}
```

### Creating Notes

```json
POST /api/courses/{course_id}/content/{content_id}/notes
{
  "note_content": "Important concept to remember for the quiz",
  "note_type": "text",
  "timestamp": 945,
  "context_data": {
    "section_title": "Introduction to Web Development",
    "lecture_title": "What is Web Development?",
    "content_type": "video"
  }
}
```

## Benefits of This Architecture

1. **Scalability**: Modular design allows for easy scaling and feature additions
2. **Maintainability**: Clean separation of concerns with service-controller-model pattern
3. **Flexibility**: Support for multiple content types and learning paths
4. **User Experience**: Rich features like notes, discussions, and progress tracking
5. **Analytics**: Comprehensive tracking for performance optimization
6. **Production Ready**: Includes all features needed for a professional LMS

## Migration from Old System

The new API completely replaces the old course system with:
- Cleaner data models
- Better performance with optimized queries
- Unified API endpoints
- Enhanced feature set
- Better documentation and maintainability

All old course-related files have been backed up and the new system provides a fresh, modern approach to course content management.
