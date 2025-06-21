# Class Attendance API Documentation

## Overview

The Class Attendance API allows you to manage attendance records for entire classes. This API has been enhanced to properly handle class-based attendance marking and retrieval.

## Problem Identified

**Previous Issue:** The original `/attendance/class-attendance` endpoint had a design flaw:
- It tried to query attendance records by `class_id`
- But attendance records didn't store `class_id` 
- This caused the API to fail or return incomplete data

**Solution Implemented:**
- Added optional `class_id` field to attendance records
- Enhanced attendance marking to associate records with classes
- Improved the class attendance retrieval logic with fallback mechanisms

## API Endpoints

### 1. Get Class Attendance

**Endpoint:** `GET /attendance/class-attendance`

**Description:** Retrieves attendance records for all students in a specific class on a given date.

#### Request Body
```json
{
  "class_id": "class123",
  "date": "2023-01-01T00:00:00Z"
}
```

#### Response
```json
[
  {
    "id": "attendance123",
    "user_id": "student123",
    "campus_id": "campus123",
    "class_id": "class123",
    "date": "2023-01-01T00:00:00Z",
    "status": "present",
    "user_type": "Student",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": "attendance124",
    "user_id": "student456",
    "campus_id": "campus123",
    "class_id": "class123",
    "date": "2023-01-01T00:00:00Z",
    "status": "absent",
    "user_type": "Student",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

### 2. Mark Class Attendance (New)

**Endpoint:** `POST /attendance/mark-class-attendance`

**Description:** Marks attendance for multiple students in a specific class.

#### Request Body
```json
{
  "class_id": "class123",
  "date": "2023-01-01T00:00:00Z",
  "attendances": [
    {
      "user_id": "student123",
      "status": "present",
      "user_type": "Student"
    },
    {
      "user_id": "student456",
      "status": "absent",
      "user_type": "Student"
    },
    {
      "user_id": "student789",
      "status": "late",
      "user_type": "Student"
    }
  ]
}
```

#### Response
```json
{
  "success": [
    {
      "id": "attendance123",
      "user_id": "student123",
      "campus_id": "campus123",
      "class_id": "class123",
      "date": "2023-01-01T00:00:00Z",
      "status": "present",
      "user_type": "Student",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "errors": [
    {
      "user_id": "student456",
      "error": "Student is not enrolled in this class"
    }
  ],
  "total_processed": 3,
  "successful_count": 2,
  "error_count": 1,
  "class_id": "class123"
}
```

### 3. Enhanced Regular Attendance Marking

**Endpoint:** `POST /attendance/mark-attendance`

**Description:** Now supports optional class association for regular attendance marking.

#### Request Body (with class_id)
```json
{
  "date": "2023-01-01T00:00:00Z",
  "status": "present",
  "user_id": "student123",
  "class_id": "class123",
  "user_type": "Student"
}
```

#### Bulk Request (with class_id)
```json
{
  "date": "2023-01-01T00:00:00Z",
  "status": "present", 
  "user_ids": ["student123", "student456", "student789"],
  "class_id": "class123",
  "user_type": "Student"
}
```

## How the Class Attendance API Works

### 1. Marking Class Attendance

When you mark attendance for a class:

1. **Validation:** The system verifies that the class exists
2. **Student Enrollment Check:** For students, it validates they are enrolled in the class
3. **Attendance Creation:** Creates attendance records with `class_id` association
4. **Error Handling:** Reports individual failures while processing successful records

### 2. Retrieving Class Attendance

When you retrieve class attendance:

1. **Primary Method:** First tries to find attendance records with matching `class_id`
2. **Fallback Method:** If no class-associated records found, falls back to:
   - Gets all students enrolled in the class
   - Finds their attendance records for the specified date
   - Returns consolidated results

This dual approach ensures backward compatibility with existing data.

### 3. Data Model

The attendance record now includes an optional `class_id` field:

```typescript
interface IAttendanceData {
  id: string;
  user_id: string;
  campus_id: string;
  class_id?: string;    // New optional field
  date: Date;
  status: "present" | "absent" | "late" | "leave";
  user_type?: "Student" | "Teacher";
  created_at: Date;
  updated_at: Date;
}
```

## Usage Examples

### Example 1: Mark Attendance for Entire Class

```javascript
const response = await fetch('/attendance/mark-class-attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    class_id: "math-101",
    date: "2023-01-01T09:00:00Z",
    attendances: [
      { user_id: "student1", status: "present" },
      { user_id: "student2", status: "absent" },
      { user_id: "student3", status: "late" },
      { user_id: "teacher1", status: "present", user_type: "Teacher" }
    ]
  })
});

const result = await response.json();
console.log(`Processed ${result.total_processed} records`);
console.log(`Successful: ${result.successful_count}`);
console.log(`Failed: ${result.error_count}`);
```

### Example 2: Get Class Attendance for a Date

```javascript
const response = await fetch('/attendance/class-attendance', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    class_id: "math-101",
    date: "2023-01-01T00:00:00Z"
  })
});

const attendanceRecords = await response.json();

// Analyze attendance
const present = attendanceRecords.filter(r => r.status === "present").length;
const absent = attendanceRecords.filter(r => r.status === "absent").length;
const late = attendanceRecords.filter(r => r.status === "late").length;

console.log(`Class Math-101 attendance:
  Present: ${present}
  Absent: ${absent}
  Late: ${late}
  Total: ${attendanceRecords.length}
`);
```

### Example 3: Regular Attendance with Class Association

```javascript
// Single student with class association
await fetch('/attendance/mark-attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: "2023-01-01T09:00:00Z",
    status: "present",
    user_id: "student123",
    class_id: "math-101",
    user_type: "Student"
  })
});

// Bulk students with class association
await fetch('/attendance/mark-attendance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: "2023-01-01T09:00:00Z",
    status: "present",
    user_ids: ["student1", "student2", "student3"],
    class_id: "math-101",
    user_type: "Student"
  })
});
```

## Error Handling

### Common Errors

1. **Class Not Found (404)**
   ```json
   {
     "message": "Error in marking class attendance",
     "error": "Class not found"
   }
   ```

2. **Student Not Enrolled (400)**
   ```json
   {
     "errors": [
       {
         "user_id": "student123",
         "error": "Student is not enrolled in this class"
       }
     ]
   }
   ```

3. **No Attendance Data (404)**
   ```json
   {
     "message": "No attendances found for this class on the specified date"
   }
   ```

### Partial Success Handling

The class attendance API handles partial failures gracefully:

```javascript
const result = await markClassAttendance(classId, date, attendances);

if (result.error_count > 0) {
  console.log("Some students had issues:");
  result.errors.forEach(error => {
    console.log(`- ${error.user_id}: ${error.error}`);
  });
}

if (result.successful_count > 0) {
  console.log(`Successfully marked attendance for ${result.successful_count} students`);
}
```

## Migration from Previous Version

### If you were using the broken class-attendance endpoint:

**Before (Broken):**
```javascript
// This would fail silently or return empty results
const attendance = await getClassAttendance(classId, date);
```

**After (Fixed):**
```javascript
// This now works properly with fallback mechanism
const attendance = await getClassAttendance(classId, date);
```

### If you want to start using class associations:

**Option 1:** Start marking attendance with class_id
```javascript
// When marking attendance, include class_id
await markAttendance({
  date: "2023-01-01T09:00:00Z",
  status: "present",
  user_id: "student123",
  class_id: "math-101"  // Add this
});
```

**Option 2:** Use the dedicated class attendance endpoint
```javascript
// Use the new dedicated endpoint
await markClassAttendance({
  class_id: "math-101",
  date: "2023-01-01T09:00:00Z",
  attendances: [...]
});
```

## Performance Considerations

- **Class Validation:** Each class attendance operation validates class existence
- **Student Enrollment:** Student enrollment is checked for each student
- **Batch Processing:** Multiple students are processed in a single transaction
- **Fallback Queries:** Retrieval uses optimized queries with fallback mechanisms
- **Indexing:** Database indexes on `class_id` for efficient querying

## Best Practices

1. **Use class_id consistently:** Always include class_id when marking attendance for better organization
2. **Batch operations:** Use bulk endpoints for marking multiple students
3. **Handle partial failures:** Always check for and handle individual student errors
4. **Validate enrollment:** Ensure students are enrolled in classes before marking attendance
5. **Date consistency:** Use consistent date formats and timezone handling
