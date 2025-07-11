# Enhanced Assignment System API Documentation

## Overview

The enhanced Assignment System provides a comprehensive, flexible, and efficient API for managing assignments and submissions. This system replaces the previous scattered assignment methods with a centralized, feature-rich service.

## Key Improvements

### 1. **Unified API Structure**
- All assignment operations consolidated into a single service
- Consistent response formats across all endpoints
- Standardized error handling and validation

### 2. **Advanced Filtering & Querying**
- Search functionality across title and description
- Date range filtering for due dates and creation dates
- Status-based filtering (draft, published, archived)
- Multi-parameter filtering support
- Pagination with configurable limits

### 3. **Enhanced Data Relationships**
- Eager loading of related data (class, subject, creator info)
- Optional inclusion of statistics and submission data
- Optimized database queries with proper indexing

### 4. **Bulk Operations**
- Archive multiple assignments at once
- Publish/unpublish assignments in bulk
- Update due dates for multiple assignments
- Bulk delete with safety checks

### 5. **Performance Optimizations**
- Enhanced database indexing
- Efficient pagination
- Reduced API calls through relation loading
- Smart caching strategies

## API Endpoints

### Core Assignment Endpoints

#### `GET /api/assignments`
Get assignments with advanced filtering and pagination.

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search in title and description
- `class_id` (string): Filter by specific class
- `subject_id` (string): Filter by specific subject
- `teacher_id` (string): Filter by creator/teacher
- `status` (enum): draft | published | archived
- `is_graded` (boolean): Filter by grading requirement
- `due_date_from` (ISO date): Start of due date range
- `due_date_to` (ISO date): End of due date range
- `sort_by` (enum): title | due_date | created_at | updated_at
- `sort_order` (enum): ASC | DESC
- `include_*` (boolean): Include related data (class_info, subject_info, creator_info, stats, submissions)

**Response:**
```json
{
  "assignments": [
    {
      "id": "assignment_123",
      "title": "Math Assignment 1",
      "description": "Complete exercises 1-10",
      "due_date": "2024-01-15T23:59:59Z",
      "class_info": {
        "id": "class_123",
        "name": "Grade 10 Mathematics",
        "academic_year": "2023-24"
      },
      "stats": {
        "total_submissions": 25,
        "submission_rate": 83.3,
        "average_grade": 78.5
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "total_pages": 8
}
```

#### `POST /api/assignments`
Create a new assignment with enhanced features.

**Request Body:**
```json
{
  "title": "Math Assignment 1",
  "description": "Complete exercises 1-10 from chapter 5",
  "due_date": "2024-01-15T23:59:59Z",
  "subject_id": "subject_123",
  "class_id": "class_123",
  "is_graded": true,
  "status": "published",
  "meta_data": {
    "priority": "medium",
    "max_grade": 100,
    "submission_instructions": "Submit as PDF",
    "attachments": [
      {
        "file_name": "instructions.pdf",
        "file_url": "https://storage.example.com/files/instructions.pdf",
        "file_type": "application/pdf"
      }
    ]
  },
  "additional_class_ids": ["class_456", "class_789"],
  "template_id": "template_123"
}
```

#### `GET /api/assignments/:assignment_id`
Get a specific assignment with all related data.

#### `PUT /api/assignments/:assignment_id`
Update an assignment.

#### `DELETE /api/assignments/:assignment_id`
Delete an assignment (soft delete if has submissions).

### Bulk Operations

#### `POST /api/assignments/bulk`
Perform bulk operations on multiple assignments.

**Request Body:**
```json
{
  "assignment_ids": ["assignment_123", "assignment_456"],
  "action": "update_due_date",
  "data": {
    "due_date": "2024-01-20T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "success": 2,
  "failed": 0,
  "errors": []
}
```

### Class-Specific Endpoints

#### `GET /api/assignments/classes/:class_id`
Get all assignments for a specific class.

### Teacher Endpoints

#### `GET /api/assignments/teachers/my-assignments`
Get assignments created by the authenticated teacher.

#### `GET /api/assignments/teachers/assignment-stats`
Get assignment statistics for the authenticated teacher.

### Student Endpoints

#### `GET /api/assignments/students/my-assignments`
Get assignments for the authenticated student with submission status.

**Response includes submission status:**
```json
{
  "assignments": [
    {
      "id": "assignment_123",
      "title": "Math Assignment 1",
      "due_date": "2024-01-15T23:59:59Z",
      "is_submitted": true,
      "student_submission": {
        "id": "submission_456",
        "grade": 85,
        "feedback": "Good work!"
      }
    }
  ]
}
```

#### `GET /api/assignments/students/my-submissions`
Get all submissions by the authenticated student.

### Assignment Submissions

#### `GET /api/assignments/:assignment_id/submissions`
Get all submissions for a specific assignment.

#### `POST /api/assignments/:assignment_id/submissions`
Create a new submission for an assignment.

**Request Body:**
```json
{
  "meta_data": {
    "submission_type": "file",
    "attachments": [
      {
        "file_name": "homework.pdf",
        "file_url": "https://storage.example.com/submissions/homework.pdf",
        "file_type": "application/pdf"
      }
    ],
    "submission_text": "Additional notes about the submission"
  }
}
```

### Statistics & Analytics

#### `GET /api/assignments/stats`
Get comprehensive assignment statistics.

**Query Parameters:**
- `class_id` (string): Filter by class
- `subject_id` (string): Filter by subject
- `teacher_id` (string): Filter by teacher
- `date_from` (ISO date): Start date for statistics
- `date_to` (ISO date): End date for statistics

**Response:**
```json
{
  "total_assignments": 150,
  "active_assignments": 125,
  "overdue_assignments": 15,
  "total_submissions": 3200,
  "pending_grading": 180,
  "average_submission_rate": 78.5,
  "upcoming_deadlines": [...],
  "recent_assignments": [...]
}
```

## Data Models

### Enhanced Assignment Model
```typescript
interface IAssignmentData {
  id: string;
  campus_id: string;
  subject_id: string;
  user_id: string; // Creator/teacher ID
  class_id: string;
  title: string;
  description: string;
  due_date: Date;
  is_graded: boolean;
  meta_data: {
    status?: 'draft' | 'published' | 'archived';
    priority?: 'low' | 'medium' | 'high';
    max_grade?: number;
    attachments?: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
    }>;
    submission_instructions?: string;
    auto_grade?: boolean;
    late_submission_penalty?: number;
    template_id?: string;
    parent_assignment_id?: string;
  };
  created_at: Date;
  updated_at: Date;
}
```

### Enhanced Assignment Submission Model
```typescript
interface IAssignmentSubmission {
  id: string;
  campus_id: string;
  assignment_id: string;
  user_id: string; // Student ID
  submission_date: Date;
  grade: number;
  feedback: string;
  meta_data: {
    status?: 'submitted' | 'graded' | 'late' | 'returned';
    submission_type?: 'text' | 'file' | 'link' | 'mixed';
    attachments?: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
      file_size?: number;
    }>;
    submission_text?: string;
    submission_links?: string[];
    graded_at?: Date;
    graded_by?: string;
    late_penalty?: number;
    rubric_scores?: Array<{
      criterion: string;
      score: number;
      max_score: number;
      comments?: string;
    }>;
  };
  created_at: Date;
  updated_at: Date;
}
```

## Migration Guide

### From Old Class Service Methods

**OLD:**
```typescript
// Multiple separate calls
const assignments = await classService.getAllAssignmentsByClassId(classId);
const assignment = await classService.getAssignmentById(assignmentId);
const submissions = await classService.getAssignmentSubmissionByAssignmentId(assignmentId);
```

**NEW:**
```typescript
// Single optimized call with relations
const assignments = await assignmentService.getAssignments({
  class_id: classId,
  include_submissions: true,
  include_stats: true,
  include_class_info: true
});
```

### Key Benefits of Migration

1. **Reduced API Calls**: Get related data in single requests
2. **Better Performance**: Optimized queries with proper indexing
3. **Enhanced Features**: Search, filtering, pagination, bulk operations
4. **Consistent Interface**: Standardized request/response formats
5. **Better Type Safety**: Strong TypeScript interfaces
6. **Improved Error Handling**: Comprehensive validation and error messages

## Usage Examples

### Creating Assignments for Multiple Classes
```typescript
const assignment = await assignmentService.createAssignment(campus_id, teacher_id, {
  title: "Science Project",
  description: "Research and present on renewable energy",
  due_date: new Date("2024-02-01"),
  subject_id: "science_101",
  class_id: "class_a",
  additional_class_ids: ["class_b", "class_c"], // Create for multiple classes
  meta_data: {
    priority: "high",
    max_grade: 100,
    submission_instructions: "Submit both written report and presentation slides"
  }
});
```

### Advanced Filtering and Search
```typescript
const assignments = await assignmentService.getAssignments({
  campus_id: "campus_123",
  search: "mathematics", // Search in title and description
  due_date_from: new Date("2024-01-01"),
  due_date_to: new Date("2024-01-31"),
  status: "published",
  include_stats: true,
  sort_by: "due_date",
  sort_order: "ASC"
});
```

### Bulk Operations
```typescript
const result = await assignmentService.bulkUpdateAssignments({
  assignment_ids: ["assign_1", "assign_2", "assign_3"],
  action: "update_due_date",
  data: { due_date: new Date("2024-02-15") }
});
```

## Performance Considerations

1. **Database Indexing**: Enhanced indexes for common query patterns
2. **Pagination**: All list endpoints support pagination
3. **Selective Loading**: Only load related data when needed using `include_*` parameters
4. **Efficient Queries**: Optimized database queries to minimize round trips
5. **Caching Strategy**: Response caching for frequently accessed data

## Security Features

1. **Campus Isolation**: All queries are scoped to the user's campus
2. **Role-Based Access**: Different endpoints for teachers, students, and admins
3. **Validation**: Comprehensive input validation using Zod schemas
4. **Authorization**: Proper permission checks for all operations

This enhanced assignment system provides a robust, scalable, and efficient solution for managing educational assignments while maintaining backward compatibility through deprecated methods in the class service.
