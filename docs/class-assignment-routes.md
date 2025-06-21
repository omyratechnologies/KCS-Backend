# Class Assignment Routes Documentation

This document describes the new routes for assigning and removing students and teachers from classes with proper error handling and duplicate prevention.

## Overview

Four new routes have been added to the class management system:

1. **Assign Students to Class** - `POST /class/:class_id/students/assign`
2. **Remove Students from Class** - `DELETE /class/:class_id/students/remove`
3. **Assign Teachers to Class** - `POST /class/:class_id/teachers/assign`
4. **Remove Teachers from Class** - `DELETE /class/:class_id/teachers/remove`

## Features

### Error Handling
- Validates that the class exists and is active
- Validates that all student/teacher IDs exist and are valid
- Validates user types (students must have user_type="student")
- Prevents duplicate assignments
- Provides clear error messages for all failure scenarios

### Duplicate Prevention
- Checks existing assignments before adding new ones
- Returns error if attempting to assign already assigned users
- Returns error if attempting to remove users not assigned to the class

### Data Consistency
- Updates both class records and user/teacher records
- Maintains student_count in class records
- Updates student meta_data with class assignments
- Updates teacher classes array

## API Endpoints

### 1. Assign Students to Class

**Endpoint:** `POST /class/:class_id/students/assign`

**Description:** Assigns one or more students to a specific class with duplicate prevention.

**Parameters:**
- `class_id` (path parameter): The ID of the class

**Request Body:**
```json
{
  "student_ids": ["student1", "student2", "student3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Students assigned to class successfully",
  "data": {
    // Updated class object
  }
}
```

**Error Responses:**
- `400`: Invalid request data or validation errors
- `500`: Internal server error

### 2. Remove Students from Class

**Endpoint:** `DELETE /class/:class_id/students/remove`

**Description:** Removes one or more students from a specific class.

**Parameters:**
- `class_id` (path parameter): The ID of the class

**Request Body:**
```json
{
  "student_ids": ["student1", "student2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Students removed from class successfully",
  "data": {
    // Updated class object
  }
}
```

### 3. Assign Teachers to Class

**Endpoint:** `POST /class/:class_id/teachers/assign`

**Description:** Assigns one or more teachers to a specific class with duplicate prevention.

**Parameters:**
- `class_id` (path parameter): The ID of the class

**Request Body:**
```json
{
  "teacher_ids": ["teacher1", "teacher2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Teachers assigned to class successfully",
  "data": {
    // Updated class object
  }
}
```

### 4. Remove Teachers from Class

**Endpoint:** `DELETE /class/:class_id/teachers/remove`

**Description:** Removes one or more teachers from a specific class.

**Parameters:**
- `class_id` (path parameter): The ID of the class

**Request Body:**
```json
{
  "teacher_ids": ["teacher1", "teacher2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Teachers removed from class successfully",
  "data": {
    // Updated class object
  }
}
```

## Validation Rules

### Common Validations
- Class must exist and be active (not deleted)
- Request body must contain valid array of IDs
- Array cannot be empty
- All IDs must be valid strings

### Student-Specific Validations
- Student records must exist in the users table
- Users must have `user_type = "student"`
- Students must be active (not deleted)

### Teacher-Specific Validations
- Teacher records must exist in the teachers table
- Teachers must be active

## Error Messages

### Common Errors
- `"Class not found"` - When class_id doesn't exist
- `"Class is not active or has been deleted"` - When class is inactive
- `"student_ids/teacher_ids array is required and cannot be empty"` - Invalid request body

### Assignment Errors
- `"Student with ID {id} not found"` - Student doesn't exist
- `"User with ID {id} is not a student"` - User type validation failed
- `"Student with ID {id} is not active"` - Student is inactive
- `"Teacher with ID {id} not found"` - Teacher doesn't exist
- `"Students/Teachers with IDs {ids} are already assigned to this class"` - Duplicate prevention

### Removal Errors
- `"Students/Teachers with IDs {ids} are not assigned to this class"` - Attempting to remove unassigned users

## Implementation Details

### Service Layer (`ClassService`)
- `assignStudentsToClass(classId, studentIds)` - Handles student assignment logic
- `removeStudentsFromClass(classId, studentIds)` - Handles student removal logic
- `assignTeachersToClass(classId, teacherIds)` - Handles teacher assignment logic
- `removeTeachersFromClass(classId, teacherIds)` - Handles teacher removal logic

### Controller Layer (`ClassController`)
- Input validation and error handling
- Request/response formatting
- HTTP status code management

### Route Layer (`class.route.ts`)
- OpenAPI documentation
- Request validation with Zod schemas
- Route definitions and middleware

### Schema Layer (`class.ts`)
- `assignStudentsRequestBodySchema` - Validates student assignment requests
- `assignTeachersRequestBodySchema` - Validates teacher assignment requests
- `assignmentResponseSchema` - Validates response format

## Usage Examples

### Assign Multiple Students
```bash
curl -X POST /class/class123/students/assign \
  -H "Content-Type: application/json" \
  -d '{"student_ids": ["student1", "student2", "student3"]}'
```

### Remove Students
```bash
curl -X DELETE /class/class123/students/remove \
  -H "Content-Type: application/json" \
  -d '{"student_ids": ["student1", "student2"]}'
```

### Assign Teachers
```bash
curl -X POST /class/class123/teachers/assign \
  -H "Content-Type: application/json" \
  -d '{"teacher_ids": ["teacher1", "teacher2"]}'
```

### Remove Teachers
```bash
curl -X DELETE /class/class123/teachers/remove \
  -H "Content-Type: application/json" \
  -d '{"teacher_ids": ["teacher1"]}'
```

## Data Flow

### Student Assignment Flow
1. Validate class exists and is active
2. Validate all student IDs exist and are valid students
3. Check for duplicate assignments
4. Update class record with new student IDs
5. Update student count
6. Update each student's meta_data with class ID
7. Return updated class object

### Teacher Assignment Flow
1. Validate class exists and is active
2. Validate all teacher IDs exist
3. Check for duplicate assignments
4. Update class record with new teacher IDs
5. Update each teacher's classes array
6. Return updated class object

## Notes

- All operations are transactional and will rollback on errors
- Student count is automatically maintained for student operations
- Both user and teacher records are kept in sync with class assignments
- The system prevents orphaned references by validating all relationships
- All timestamps are automatically updated during modifications
