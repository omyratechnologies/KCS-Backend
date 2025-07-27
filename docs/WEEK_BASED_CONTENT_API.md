# Week-Based Course Content API

## Overview

The Course Content API has been enhanced to support week-based content creation, allowing you to create multiple content items (text, video, resources) in a single API call organized by weeks.

## API Endpoint

```
POST /api/course/{course_id}/content
```

## Request Structure

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body Schema

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
        "text_content": "This lesson covers variables, functions, and basic syntax."
      }
    },
    {
      "title": "Programming Tutorial Video",
      "description": "Video lesson on programming basics",
      "content_type": "video",
      "content_data": {
        "video_url": "https://your-storage.com/video.mp4",
        "video_duration": 1800,
        "thumbnail_url": "https://your-storage.com/thumbnail.jpg",
        "file_size": 52428800
      }
    },
    {
      "title": "Programming Handbook",
      "description": "PDF resource for programming reference",
      "content_type": "resource",
      "content_data": {
        "resources_url": "https://your-storage.com/handbook.pdf",
        "resources_size": 2048000,
        "file_type": "pdf",
        "file_name": "programming-handbook.pdf"
      }
    }
  ],
  "access_settings": {
    "access_level": "free",
    "course_price": 20000,
    "available_from": "2023-01-01T00:00:00Z",
    "available_until": "2024-01-01T00:00:00Z"
  },
  "interaction_settings": {
    "allow_comments": true,
    "allow_notes": true,
    "allow_bookmarks": true,
    "discussion": false,
    "require_completion": false
  },
  "meta_data": {
    "tags": ["programming", "basics"]
  },
  "order": 1
}
```

## Content Types

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
    "video_url": "https://your-storage.com/video.mp4",
    "video_duration": 1800,
    "thumbnail_url": "https://your-storage.com/thumbnail.jpg",
    "file_size": 52428800
  }
}
```

### 3. Resource Content (PDFs, Documents)
```json
{
  "content_type": "resource",
  "content_data": {
    "resources_url": "https://your-storage.com/handbook.pdf",
    "resources_size": 2048000,
    "file_type": "pdf",
    "file_name": "programming-handbook.pdf"
  }
}
```

## Response Structure

```json
{
  "week_title": "Week 1: Introduction to Programming",
  "week_description": "This week covers basic programming concepts and fundamental coding principles",
  "week_order": 1,
  "contents_count": 3,
  "contents": [
    {
      "id": "content_001",
      "title": "Introduction to Programming",
      "description": "Basic programming concepts",
      "content_type": "text",
      "content_data": {
        "text_content": "This lesson covers variables, functions, and basic syntax.",
        "html_content": "<p>This lesson covers variables, functions, and basic syntax.</p>",
        "duration": 1800
      },
      "order": 100,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "content_002",
      "title": "Programming Tutorial Video",
      "description": "Video lesson on programming basics",
      "content_type": "video",
      "content_data": {
        "video_url": "https://your-storage.com/video.mp4",
        "duration": 1800,
        "thumbnail_url": "https://your-storage.com/thumbnail.jpg",
        "file_size": 52428800
      },
      "order": 101,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "content_003",
      "title": "Programming Handbook",
      "description": "PDF resource for programming reference",
      "content_type": "resource",
      "content_data": {
        "document_url": "https://your-storage.com/handbook.pdf",
        "file_size": 2048000,
        "duration": 0
      },
      "order": 102,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

## Key Features

### 1. Week-Based Organization
- Create multiple content items in a single week
- Organized structure with week title and description
- Automatic ordering system (week_order * 100 + content_index)

### 2. Multi-Content Type Support
- **Text**: Rich text content with HTML generation
- **Video**: Video files with metadata (duration, thumbnail, file size)
- **Resource**: Documents, PDFs, and other downloadable resources

### 3. Access Control
- **Free/Paid Access**: Control content accessibility
- **Date Restrictions**: Set availability windows
- **Prerequisites**: Define content dependencies

### 4. Interaction Settings
- **Comments**: Allow/disable user comments
- **Notes**: Enable personal note-taking
- **Bookmarks**: Allow content bookmarking
- **Discussion**: Enable course discussions
- **Completion Tracking**: Track content completion

### 5. Metadata Support
- **Tags**: Categorize content for search
- **Creator Tracking**: Track content creators
- **Timestamps**: Automatic creation/update tracking

## Example cURL Request

```bash
curl -X POST "https://your-api.com/api/course/course123/content" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Week 1: Introduction to Programming",
    "description": "This week covers basic programming concepts",
    "contents": [
      {
        "title": "Variables and Data Types",
        "description": "Learn about different data types",
        "content_type": "text",
        "content_data": {
          "text_content": "Variables are containers for storing data values..."
        }
      },
      {
        "title": "Programming Basics Video",
        "description": "Video tutorial on programming fundamentals",
        "content_type": "video",
        "content_data": {
          "video_url": "https://storage.com/programming-basics.mp4",
          "video_duration": 1200,
          "thumbnail_url": "https://storage.com/thumb.jpg",
          "file_size": 45000000
        }
      }
    ],
    "access_settings": {
      "access_level": "free"
    },
    "order": 1
  }'
```

## Benefits

1. **Reduced API Calls**: Create multiple content items in one request
2. **Better Organization**: Week-based structure improves course flow
3. **Flexible Content Types**: Support for various media types
4. **Rich Metadata**: Comprehensive content information
5. **Access Control**: Fine-grained permission management
6. **Mobile-Friendly**: Optimized for mobile app development

## Migration Notes

This new API structure replaces the previous single-content creation endpoint while maintaining backward compatibility through the existing individual content endpoints for updates and retrievals.
