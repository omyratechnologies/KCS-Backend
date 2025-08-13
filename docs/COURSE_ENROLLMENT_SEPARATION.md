# Course and Enrollment Data Separation

## Problem Statement

Previously, the course API was incorrectly mixing course data with enrollment data by automatically including `enrollment_info` in the course response. This violated proper separation of concerns because:

1. **Course data** (title, description, sections, lectures) is static/global information
2. **Enrollment data** (progress, enrollment status, completion) is user-specific information
3. Multiple students can enroll in the same course, so enrollment is a separate entity

## Solution Implemented

### ✅ **Option 1: Complete Separation** (Recommended & Implemented)

**Course Data Endpoint** (Public/Course Information):
- `GET /courses/:id` - Returns **only** course data
- No enrollment information included
- Clean, predictable response structure

**Enrollment Data Endpoints** (User-Specific):
- `GET /courses/:course_id/enrollment` - Get user's enrollment for specific course
- `GET /courses/my/enrolled` - Get all user's enrolled courses

## API Changes Made

### 1. Course Service Changes

**File:** `src/services/course.service.ts`

```typescript
// BEFORE: Mixed course and enrollment data
static async getCourseById(course_id: string, campus_id: string, user_id?: string) {
    // ... included user progress and enrollment_info
}

// AFTER: Pure course data only
static async getCourseById(course_id: string, campus_id: string) {
    // ... returns only course data, no enrollment info
    return {
        success: true,
        data: {
            ...courseResult,
            sections: sectionsWithLectures,
            instructors: instructorDetails.filter(Boolean),
            // REMOVED: enrollment_info - keep course and enrollment data separate
        },
        message: "Course retrieved successfully",
    };
}
```

### 2. New Enrollment Service Method

**File:** `src/services/course.service.ts`

```typescript
// NEW: Dedicated method for enrollment data
static async getUserCourseEnrollment(course_id: string, user_id: string, campus_id: string) {
    // Returns user's enrollment details with progress information
}
```

### 3. Controller Changes

**File:** `src/controllers/course.controller.ts`

```typescript
// BEFORE: Always included enrollment data
const result = await CourseService.getCourseById(course_id, campus_id, user_id);

// AFTER: Pure course data
const result = await CourseService.getCourseById(course_id, campus_id);

// NEW: Dedicated enrollment endpoint
public static readonly getCourseEnrollment = async (ctx: Context) => {
    const result = await CourseService.getUserCourseEnrollment(course_id, user_id, campus_id);
    // Returns enrollment data only
};
```

### 4. Route Changes

**File:** `src/routes/course.route.ts`

```typescript
// UPDATED: Course endpoint description
app.get("/:id", describeRoute({
    summary: "Get course by ID",
    description: "Get detailed course information including sections and lectures. Course data only - no enrollment information."
}));

// NEW: Dedicated enrollment endpoint
app.get("/:course_id/enrollment", describeRoute({
    summary: "Get user's enrollment for a course",
    description: "Get the authenticated user's enrollment information and progress for a specific course."
}));
```

## Response Structure Changes

### Course Response (GET /courses/:id)

**BEFORE:**
```json
{
    "success": true,
    "data": {
        "id": "course_123",
        "title": "Course Title",
        "sections": [...],
        "enrollment_info": {  // ❌ This was wrong
            "enrollment_status": "active",
            "progress_percentage": 25
        }
    }
}
```

**AFTER:**
```json
{
    "success": true,
    "data": {
        "id": "course_123",
        "title": "Course Title",
        "sections": [...],
        // ✅ Clean course data only - no enrollment info
    }
}
```

### New Enrollment Response (GET /courses/:course_id/enrollment)

```json
{
    "success": true,
    "data": {
        "id": "enrollment_456",
        "course_id": "course_123",
        "enrollment_status": "active",
        "progress_percentage": 35,
        "course_details": {
            "id": "course_123",
            "title": "Course Title",
            "thumbnail": "...",
            "category": "Programming"
        },
        "progress_details": {
            "total_lectures": 43,
            "completed_lectures": 15,
            "time_remaining_hours": 16.25
        }
    }
}
```

## Benefits of This Approach

### 1. **Clear Separation of Concerns**
- Course data is static and can be cached effectively
- Enrollment data is user-specific and dynamic
- Each endpoint has a single, clear responsibility

### 2. **Better Performance**
- Course data can be cached without user-specific information
- Smaller response payloads for course browsing
- Enrollment data fetched only when needed

### 3. **Improved API Design**
- RESTful endpoints that follow standard conventions
- Predictable response structures
- Clear endpoint purposes

### 4. **Scalability**
- Course data can be served from CDN/cache
- User-specific data handled separately with appropriate auth
- Better database query optimization

## Migration Notes

### For Frontend/Client Applications:

1. **Course Browsing**: Use `GET /courses/:id` for course information
2. **Enrollment Status**: Use `GET /courses/:course_id/enrollment` for user progress
3. **User Dashboard**: Use `GET /courses/my/enrolled` for enrolled courses list

### Backward Compatibility:

- Existing course endpoints continue to work
- No breaking changes to core course functionality
- Enrollment endpoints are new additions

## Example Usage

```javascript
// Get course information (public data)
const course = await fetch('/api/courses/123');

// Get user's enrollment in that course (private data)
const enrollment = await fetch('/api/courses/123/enrollment', {
    headers: { Authorization: 'Bearer ...' }
});

// Combine data on frontend if needed
const courseWithProgress = {
    ...course.data,
    userEnrollment: enrollment.data
};
```

## Conclusion

This refactoring properly separates course metadata from user-specific enrollment data, resulting in:

- ✅ Cleaner API design
- ✅ Better performance and caching
- ✅ More scalable architecture
- ✅ Proper separation of concerns
- ✅ RESTful endpoint design

The course API now returns pure course data, while enrollment information is available through dedicated endpoints when needed.
