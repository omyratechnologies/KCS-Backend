# Exam Timetable System - Complete Flow Analysis

## Overview
The exam timetable system has been redesigned to follow a **3-step workflow** as shown in the UI. This document provides a comprehensive analysis of the complete implementation.

---

## UI Flow Analysis

### Screen 1: Exam Term List
**Location**: `Timetable` → `Exam Timetable`
- Shows all exam terms (Mid Term 2025, Final Term 2025, Unit Test)
- Each term displays:
  - Term name
  - Date range (e.g., "01 Mar 2025 - 15 Mar 2025")
  - Status badge (Draft/Published)
  - Action buttons (View, Edit, Delete)
- "Create Term" button initiates the workflow

### Screen 2: Create New Term (Step 1)
**Purpose**: Define the exam term and select participating classes
**Fields**:
- **Term Name** (text input) - Required
- **Start Date** (date picker) - Required
- **End Date** (date picker) - Required
- **Class/Section** (multi-checkbox) - Required
  - Class 1, Class 2, Class 3, Class 4, Class 5
  - Class 6, Class 7, Class 8, Class 9, Class 10
- "Cancel" and "Next" buttons

### Screen 3: Add Subjects (Step 2)
**Purpose**: Select subjects and schedule exam dates/times
**Shows**:
- Selected class from Step 1 (e.g., "Selected Class 1")
- Search bar for subjects
- List of subjects with:
  - Subject name (e.g., "Mathematics")
  - Subject code (e.g., "MAT101")
  - Credits (e.g., "4 Credits")
  - Date picker for exam date
  - Time picker for exam time
  - Checkbox to select/deselect
- "Back" and "Next" buttons

### Screen 4: Review & Create (Step 3)
**Purpose**: Final review before creating the timetable
**Shows**:
- **Basic Details**:
  - Exam Name: "Mid-Term Examination"
  - Classes: "Class 7A, 7B, 7C"
  - Start Date: "15 May 2023"
  - End Date: "25 May 2023"
- **Selected Subjects** (table):
  - Subject name
  - Subject code
  - Credits
  - Date and time (e.g., "15 May, 09:00 AM")
- Summary:
  - Total Subjects: 3
  - Total Credits: 12
  - Conflict status: "All exams scheduled without conflicts"
- "Back" and "Create Timetable" buttons

### Screen 5: Timetable List (After Creation)
**Shows**: All timetables grouped by class
- Each card shows:
  - Class name (e.g., "Class 2 - Section A")
  - Number of subjects (e.g., "8 Subjects")
  - Date range (e.g., "15 Oct 2025 - 25 Oct 2025")
  - Action buttons (Edit, Delete, View Details)

---

## Database Schema

### 1. Exam Term Model
```typescript
interface IExamTermData {
    id: string;
    campus_id: string;
    name: string;                    // ✅ NEW: Term name
    class_ids: string[];             // ✅ NEW: Selected classes
    start_date: Date;
    end_date: Date;
    meta_data: object;
    is_active: boolean;              // ✅ ADDED
    is_deleted: boolean;             // ✅ ADDED
    created_at: Date;
    updated_at: Date;
}
```

**Key Changes**:
- ✅ Added `class_ids` array to store selected classes
- ✅ Added `is_active` and `is_deleted` flags for soft delete
- ✅ Term now contains class selection from Step 1

### 2. Exam Timetable Model
```typescript
interface IExamTimetableData {
    id: string;
    campus_id: string;
    exam_term_id: string;           // References exam term
    exam_name: string;
    class_ids: string[];            // Inherited from term or overridden
    start_date: Date;
    end_date: Date;
    subjects: Array<{
        subject_id: string;
        exam_date: Date;
        start_time: string;
        end_time: string;
        room?: string;
        invigilator_ids?: string[];
    }>;
    is_published: boolean;
    is_active: boolean;
    is_deleted: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}
```

---

## API Endpoints Flow

### Step 1: Create Exam Term
**Endpoint**: `POST /api/exam/`

**Request**:
```json
{
  "name": "Mid-Term Examination",
  "class_ids": ["class7a", "class7b", "class7c"],
  "start_date": "2023-05-15T00:00:00Z",
  "end_date": "2023-05-25T00:00:00Z",
  "meta_data": {
    "type": "midterm",
    "academic_year": "2022-2023"
  }
}
```

**Validation**:
- ✅ Validates all class IDs exist
- ✅ Ensures classes belong to the same campus
- ✅ Automatically sets `is_active: true` and `is_deleted: false`

**Response**: Returns created exam term with ID

---

### Step 2: Create Exam Timetable (with subjects)
**Endpoint**: `POST /api/exam/timetable`

**Request**:
```json
{
  "exam_term_id": "term123",
  "exam_name": "Mid-Term Examination",
  // class_ids is OPTIONAL - automatically uses exam term's class_ids
  "start_date": "2023-05-15T00:00:00Z",
  "end_date": "2023-05-25T00:00:00Z",
  "subjects": [
    {
      "subject_id": "math101",
      "exam_date": "2023-05-15T00:00:00Z",
      "start_time": "09:00",
      "end_time": "11:00",
      "room": "Room A101",
      "invigilator_ids": ["teacher123", "teacher456"]
    },
    {
      "subject_id": "phys101",
      "exam_date": "2023-05-17T00:00:00Z",
      "start_time": "09:00",
      "end_time": "11:00"
    },
    {
      "subject_id": "cs101",
      "exam_date": "2023-05-19T00:00:00Z",
      "start_time": "09:00",
      "end_time": "11:00"
    }
  ]
}
```

**Validation**:
- ✅ Validates exam term exists
- ✅ Auto-populates `class_ids` from exam term if not provided
- ✅ Validates all subjects exist
- ✅ Checks for schedule conflicts
- ✅ Validates classes belong to campus

**Response**: Returns enriched timetable with:
- Subject names and codes
- Class names
- Exam term details
- Invigilator names

---

### Step 3: Get Timetable (for review/display)
**Endpoint**: `GET /api/exam/timetable/:id`

**Response** (Auto-enriched):
```json
{
  "success": true,
  "data": {
    "id": "timetable123",
    "exam_term_id": "term123",
    "exam_name": "Mid-Term Examination",
    "class_ids": ["class7a", "class7b", "class7c"],
    "start_date": "2023-05-15T00:00:00Z",
    "end_date": "2023-05-25T00:00:00Z",
    "exam_term": {
      "id": "term123",
      "name": "Mid-Term Examination",
      "start_date": "2023-05-15T00:00:00Z",
      "end_date": "2023-05-25T00:00:00Z"
    },
    "classes": [
      { "id": "class7a", "name": "Class 7A" },
      { "id": "class7b", "name": "Class 7B" },
      { "id": "class7c", "name": "Class 7C" }
    ],
    "subjects": [
      {
        "subject_id": "math101",
        "subject_code": "MAT101",
        "subject_name": "Mathematics",
        "credits": 4,
        "exam_date": "2023-05-15T00:00:00Z",
        "start_time": "09:00",
        "end_time": "11:00",
        "room": "Room A101",
        "invigilators": [
          { "id": "teacher123", "name": "John Doe" }
        ]
      }
    ],
    "is_published": false
  }
}
```

---

## Service Layer Logic

### ExamService.createExamTerm()
```typescript
✅ Validates all class_ids exist
✅ Ensures classes belong to campus
✅ Sets is_active: true, is_deleted: false
✅ Creates exam term with class_ids
```

### ExamService.getExamTerms()
```typescript
✅ Filters by campus_id and is_deleted: false
✅ Returns empty array if no results (no error)
✅ Sorted by updated_at DESC
```

### ExamTimetableService.createExamTimetable()
```typescript
✅ Validates exam term exists
✅ Auto-populates class_ids from exam term if not provided
✅ Falls back to provided class_ids if given
✅ Validates all classes exist and belong to campus
✅ Validates all subjects exist
✅ Checks for schedule conflicts with existing timetables
✅ Creates timetable with is_published: false
```

### ExamTimetableService.enrichExamTimetable()
```typescript
✅ Fetches exam term details
✅ Fetches and formats class names
✅ Fetches subject details (code, name, credits)
✅ Fetches invigilator names from teacher/user
✅ Gracefully handles missing data with "Unknown" fallbacks
```

---

## Data Flow Summary

```
Step 1: Create Term
==================
Frontend → POST /api/exam/
          ↓
   Validate classes exist
          ↓
   Create ExamTerm {
     name,
     class_ids: [selected classes],
     dates,
     is_active: true,
     is_deleted: false
   }
          ↓
   Return term_id


Step 2: Add Subjects
===================
Frontend → POST /api/exam/timetable
          ↓
   Get ExamTerm by term_id
          ↓
   Use term.class_ids (if not overridden)
          ↓
   Validate subjects exist
          ↓
   Check schedule conflicts
          ↓
   Create ExamTimetable {
     exam_term_id,
     class_ids: from term,
     subjects: [with dates/times],
     is_published: false
   }
          ↓
   Return timetable_id


Step 3: Review & Display
========================
Frontend → GET /api/exam/timetable/:id
          ↓
   Fetch timetable
          ↓
   Enrich with:
     - Exam term details
     - Class names
     - Subject details (code, name, credits)
     - Invigilator names
          ↓
   Return enriched data
          ↓
   Frontend displays in review screen
          ↓
   User clicks "Create Timetable" → Publish
          ↓
   Frontend → POST /api/exam/timetable/:id/publish
```

---

## Key Design Decisions

### 1. **Class Selection at Term Level** ✅
- Classes are selected when creating the term (Step 1)
- This ensures all timetables under a term share the same classes
- Reduces redundancy and ensures consistency

### 2. **Auto-Population of class_ids** ✅
- When creating a timetable, class_ids are auto-populated from the exam term
- Can be overridden if needed (though not recommended)
- Simplifies API calls - frontend doesn't need to pass class_ids again

### 3. **Reference-Only Architecture** ✅
- Database stores only IDs (subject_id, class_id, invigilator_ids)
- GET endpoints auto-enrich with full details
- Ensures data consistency - updates to subjects automatically reflect

### 4. **Soft Delete** ✅
- Both ExamTerm and ExamTimetable use `is_deleted` flag
- Data is never hard-deleted
- Allows for audit trails and recovery

### 5. **Conflict Detection** ✅
- Service checks for overlapping date ranges
- Prevents scheduling conflicts
- Shown in Step 3 review screen

---

## Testing Checklist

- [ ] Create exam term with multiple classes
- [ ] Verify class validation (non-existent class)
- [ ] Verify campus validation (class from different campus)
- [ ] Create timetable without providing class_ids (should use term's)
- [ ] Create timetable with custom class_ids (should override)
- [ ] Verify subject enrichment (code, name, credits)
- [ ] Verify class name enrichment
- [ ] Verify invigilator name enrichment
- [ ] Test schedule conflict detection
- [ ] Test publish/unpublish flow
- [ ] Test soft delete (should not appear in GET requests)
- [ ] Test GET by class_id (should filter correctly)
- [ ] Test empty results (should return [] not error)

---

## Frontend Integration Guide

### Step 1: Create Term Form
```javascript
const createTerm = async (formData) => {
  const response = await fetch('/api/exam/', {
    method: 'POST',
    body: JSON.stringify({
      name: formData.termName,
      class_ids: formData.selectedClasses, // Array of class IDs
      start_date: formData.startDate,
      end_date: formData.endDate,
      meta_data: {
        type: 'midterm',
        academic_year: '2023-2024'
      }
    })
  });
  
  const term = await response.json();
  return term.id; // Save for Step 2
};
```

### Step 2: Add Subjects
```javascript
const createTimetable = async (termId, subjects) => {
  const response = await fetch('/api/exam/timetable', {
    method: 'POST',
    body: JSON.stringify({
      exam_term_id: termId,
      exam_name: "Mid-Term Examination",
      // No need to pass class_ids - auto-populated from term
      start_date: "2023-05-15T00:00:00Z",
      end_date: "2023-05-25T00:00:00Z",
      subjects: subjects.map(s => ({
        subject_id: s.id,
        exam_date: s.date,
        start_time: s.startTime,
        end_time: s.endTime,
        room: s.room,
        invigilator_ids: s.invigilators
      }))
    })
  });
  
  const timetable = await response.json();
  return timetable.data.id;
};
```

### Step 3: Review & Display
```javascript
const getTimetableForReview = async (timetableId) => {
  const response = await fetch(`/api/exam/timetable/${timetableId}`);
  const data = await response.json();
  
  // Data is already enriched with:
  // - Class names
  // - Subject details (code, name, credits)
  // - Invigilator names
  // - Exam term info
  
  return data.data;
};
```

---

## Changes Summary

### Models Updated
- ✅ `exam_term.model.ts` - Added `class_ids`, `is_active`, `is_deleted`
- ✅ `exam_timetable.model.ts` - Already had correct structure

### Schemas Updated
- ✅ `exam.ts` - Added `class_ids` to term schema, added `is_active`, `is_deleted`
- ✅ `exam_timetable.ts` - Made `class_ids` optional in create request

### Services Updated
- ✅ `exam.service.ts` - Added class validation, soft delete, default flags
- ✅ `exam_timetable.service.ts` - Added auto-population logic, enrichment

### Controllers Updated
- ✅ `exam.controller.ts` - Handle `class_ids` in requests
- ✅ `exam_timetable.controller.ts` - Handle optional `class_ids`

### Documentation Updated
- ✅ `EXAM_TIMETABLE_API.md` - Updated with new 3-step flow
- ✅ `EXAM_TIMETABLE_FLOW_ANALYSIS.md` - This comprehensive document

---

## Conclusion

The exam timetable system now perfectly aligns with the UI workflow:

1. **Step 1 (Create Term)**: Select term name, dates, and classes
2. **Step 2 (Add Subjects)**: Select subjects and schedule exam dates/times
3. **Step 3 (Review)**: Display enriched data for final confirmation

All backend changes support this flow with proper validation, auto-population, and data enrichment.
