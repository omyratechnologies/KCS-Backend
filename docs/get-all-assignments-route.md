# Get All Assignments from All Classes Route

## Overview

A new route has been added to retrieve all assignments from all classes within a campus. This route provides a comprehensive view of all assignments across the entire educational institution.

## Endpoint

**GET** `/class/assignments/all`

## Description

Retrieves all assignments from all classes for the current campus. This endpoint aggregates assignments from every active class in the campus, providing administrators and educators with a complete overview of all assignment activities.

## Features

- **Campus-wide View**: Gets assignments from all classes within the authenticated user's campus
- **Sorted Results**: Returns assignments sorted by most recent update first
- **Comprehensive Data**: Includes all assignment details including title, description, due dates, class information, etc.
- **Error Handling**: Proper error handling with meaningful error messages

## Authentication

This route requires authentication. The campus ID is automatically extracted from the authenticated user's context.

## Request

### Method
`GET`

### URL
`/class/assignments/all`

### Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Parameters
None - The campus ID is automatically determined from the authenticated user's context.

## Response

### Success Response (200)

```json
[
  {
    "id": "assignment123",
    "campus_id": "campus456",
    "subject_id": "subject789",
    "user_id": "teacher123",
    "class_id": "class456",
    "title": "Mathematics Assignment 1",
    "description": "Complete problems 1-20 from chapter 5",
    "due_date": "2025-06-30T23:59:59Z",
    "is_graded": true,
    "meta_data": {
      "difficulty": "medium",
      "estimated_time": "2 hours"
    },
    "created_at": "2025-06-21T10:00:00Z",
    "updated_at": "2025-06-21T15:30:00Z"
  },
  {
    "id": "assignment124",
    "campus_id": "campus456",
    "subject_id": "subject790",
    "user_id": "teacher124",
    "class_id": "class457",
    "title": "Science Project",
    "description": "Design and conduct a simple experiment",
    "due_date": "2025-07-05T23:59:59Z",
    "is_graded": false,
    "meta_data": {
      "type": "project",
      "group_work": true
    },
    "created_at": "2025-06-20T14:00:00Z",
    "updated_at": "2025-06-21T09:15:00Z"
  }
]
```

### Error Response (500)

```json
{
  "error": "Internal server error message"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the assignment |
| `campus_id` | string | ID of the campus where the assignment belongs |
| `subject_id` | string | ID of the subject for this assignment |
| `user_id` | string | ID of the teacher who created the assignment |
| `class_id` | string | ID of the class for which the assignment was created |
| `title` | string | Title/name of the assignment |
| `description` | string | Detailed description of the assignment |
| `due_date` | string (ISO 8601) | Due date and time for the assignment |
| `is_graded` | boolean | Whether the assignment has been graded |
| `meta_data` | object | Additional metadata about the assignment |
| `created_at` | string (ISO 8601) | When the assignment was created |
| `updated_at` | string (ISO 8601) | When the assignment was last updated |

## Use Cases

### 1. Administrative Overview
- Campus administrators can view all assignments across all classes
- Monitor assignment distribution and workload across different classes
- Track assignment creation and update patterns

### 2. Academic Coordination
- Department heads can coordinate assignments across multiple classes
- Avoid assignment conflicts and overlapping due dates
- Monitor teaching activities across the campus

### 3. Reporting and Analytics
- Generate reports on assignment activities
- Analyze assignment patterns and trends
- Track educator engagement and productivity

### 4. Parent/Student Portals
- Students can view all their assignments in one place
- Parents can monitor their child's assignment workload across all subjects

## Implementation Details

### Service Layer
The `getAllAssignmentsFromAllClasses` method in `ClassService`:
- Queries all assignments where `campus_id` matches the authenticated user's campus
- Sorts results by `updated_at` in descending order (most recent first)
- Returns an array of assignment objects

### Controller Layer
The `getAllAssignmentsFromAllClasses` method in `ClassController`:
- Extracts campus ID from the authenticated context
- Calls the service method with the campus ID
- Returns JSON response with proper error handling

### Route Layer
- Defined as `GET /class/assignments/all`
- Includes OpenAPI documentation
- Uses the existing `getAssignmentsResponseSchema` for response validation

## Example Usage

### Using cURL
```bash
curl -X GET "https://api.yourschool.com/class/assignments/all" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

### Using JavaScript/Fetch
```javascript
const response = await fetch('/class/assignments/all', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const assignments = await response.json();
console.log('All assignments:', assignments);
```

### Using Axios
```javascript
const { data: assignments } = await axios.get('/class/assignments/all', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

console.log('All assignments:', assignments);
```

## Performance Considerations

- **Caching**: Consider implementing caching for frequently accessed assignment data
- **Pagination**: For campuses with many assignments, consider adding pagination parameters
- **Filtering**: Future enhancements could include filtering by date range, subject, or class
- **Indexing**: The campus_id field is indexed for optimal query performance

## Security

- **Authentication Required**: Only authenticated users can access this endpoint
- **Campus Isolation**: Users can only see assignments from their own campus
- **Role-Based Access**: Depending on requirements, this could be restricted to certain user roles

## Related Endpoints

- `GET /class/:class_id/assignments` - Get assignments for a specific class
- `GET /class/assignment/:assignment_id` - Get details of a specific assignment
- `POST /class/:class_id/assignments` - Create a new assignment for a class
- `PUT /class/assignment/:assignment_id` - Update an existing assignment
- `DELETE /class/assignment/:assignment_id` - Delete an assignment

## Future Enhancements

1. **Filtering Options**
   - Filter by date range
   - Filter by subject or class
   - Filter by grading status
   - Filter by teacher

2. **Pagination**
   - Add limit and offset parameters
   - Include total count in response

3. **Sorting Options**
   - Sort by due date
   - Sort by creation date
   - Sort by class name

4. **Additional Data**
   - Include class names and subject names
   - Include teacher information
   - Include submission statistics

5. **Export Functionality**
   - Export to CSV or Excel
   - Generate PDF reports
   - Email summaries

This endpoint provides a powerful tool for campus-wide assignment management and visibility, enabling better coordination and oversight of academic activities.
