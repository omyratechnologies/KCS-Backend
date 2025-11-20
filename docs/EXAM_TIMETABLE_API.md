# Exam Timetable CRUD API

This module provides a complete CRUD (Create, Read, Update, Delete) system for managing exam timetables. The system is designed for administrative users only, with published timetables being visible to students and parents.

## New Workflow (Updated)

The exam timetable creation follows a **three-step process** as shown in the UI:

### Step 1: Create New Term
When creating an exam term, you **must specify the classes** that will participate in the exam:

```json
POST /api/exam/
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

### Step 2: View Classes in Term
After creating the term, click on it to see the list of classes. Each class will be displayed as a separate card (e.g., "Class 2 - Section A", "Class 4 - Section B").

### Step 3: Create Timetable for a Specific Class
Select ONE class and create its timetable by choosing subjects, dates, and times. **Each timetable is for a single class only**:

```json
POST /api/exam/timetable
{
  "exam_term_id": "term123",
  "exam_name": "Mid-Term Examination",
  "class_id": "class7a",  // Single class only
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
    }
  ]
}
```

### Step 4: Review & Create
The final step shows a review of all information before creating the timetable. The API automatically enriches the response with:
- Subject details (code, name, credits)
- Class name
- Exam term information
- Invigilator names

**Important**: Repeat Step 3 & 4 for each class in the term to create individual timetables.

## Architecture

The exam timetable system follows a **reference-only architecture** for data integrity and consistency:

### Storage Strategy
- **References Only**: The database stores only IDs for related entities (subjects, classes, exam terms, invigilators)
- **No Data Duplication**: Subject codes, names, and credits are not stored redundantly in exam timetables
- **Consistent Data**: All subject information comes from the authoritative Subject entity

### Response Enhancement
- **Automatic Enrichment**: GET endpoints automatically populate related data for client convenience
- **Performance Optimized**: Uses Promise.all() for concurrent data fetching
- **Graceful Degradation**: Shows "Unknown" values if referenced entities are missing

This approach ensures that any updates to subject details, class names, or exam terms are immediately reflected in all exam timetables without requiring manual updates.

## Features

- **Complete CRUD Operations**: Create, read, update, and delete exam timetables
- **Admin-Only Access**: All management operations require admin permissions
- **Publication Control**: Timetables can be published/unpublished for student visibility
- **Schedule Conflict Detection**: Built-in validation to prevent scheduling conflicts
- **Multi-Class Support**: Timetables can be assigned to multiple classes
- **Subject Management**: Each timetable includes detailed subject information with credits, times, and rooms
- **Invigilator Assignment**: Support for assigning multiple invigilators per exam

## Data Structure

### Exam Term (Updated)
Each exam term now includes:
- **Term Name**: e.g., "Mid-Term Examination"
- **Class IDs**: Array of class IDs that will participate in this exam term
- **Date Range**: Start and End dates for the term
- **Meta Data**: Additional information like academic year, type, etc.

### Exam Timetable
Based on the provided UI workflow, each exam timetable includes:

- **Exam Term ID**: Reference to the exam term (includes class_ids)
- **Exam Name**: e.g., "Mid-Term Examination"
- **Classes**: Inherited from exam term (or can be overridden)
- **Date Range**: Start and End dates for exams
- **Subjects**: Array of subjects with:
  - Subject ID (reference to subject entity)
  - Exam Date and Time
  - Room assignment (optional)
  - Invigilator IDs (optional, references to teacher entities)

**Response Enhancement**: When retrieving exam timetables through GET endpoints, the system automatically enriches the data with:
- Subject Code (e.g., "MAT101")
- Subject Name (e.g., "Mathematics") 
- Credits (e.g., 4)
- Class Names (e.g., "Class 7A, 7B, 7C")
- Exam Term Details
- Invigilator Names

## API Endpoints

### Exam Term Endpoints

#### Create Exam Term (Step 1)
- **POST** `/api/exam/`
- Create a new exam term with class selection
- **Required Fields**: name, class_ids, start_date, end_date
- Classes must be selected at this stage

#### Get All Exam Terms
- **GET** `/api/exam/`
- Retrieve all exam terms for the campus

#### Get Exam Term by ID
- **GET** `/api/exam/:id`
- Retrieve a specific exam term with its class assignments

#### Update Exam Term
- **PATCH** `/api/exam/:id`
- Update an existing exam term, including class assignments

#### Delete Exam Term
- **DELETE** `/api/exam/:id`
- Soft delete an exam term

### Exam Timetable Endpoints (Step 2 & 3)

#### Create Exam Timetable
- **POST** `/api/exam/timetable`
- Create a new exam timetable (automatically inherits class_ids from exam term)

#### Get All Exam Timetables
- **GET** `/api/exam/timetable/all`
- Retrieve all exam timetables for the campus

#### Get Exam Timetable by ID
- **GET** `/api/exam/timetable/:id`
- Retrieve a specific exam timetable with enriched data

#### Update Exam Timetable
- **PATCH** `/api/exam/timetable/:id`
- Update an existing exam timetable

#### Delete Exam Timetable
- **DELETE** `/api/exam/timetable/:id`
- Soft delete an exam timetable

#### Publish Exam Timetable
- **POST** `/api/exam/timetable/:id/publish`
- Make timetable visible to students and parents

#### Unpublish Exam Timetable
- **POST** `/api/exam/timetable/:id/unpublish`
- Hide timetable from students and parents

#### Get Timetables by Exam Term
- **GET** `/api/exam/timetable/exam-term/:exam_term_id`
- Retrieve all timetables for a specific exam term

#### Check Schedule Conflicts
- **POST** `/api/exam/timetable/check-conflicts`
- Validate potential scheduling conflicts

### Public Endpoints (No Authentication Required)

#### Get Published Timetables
- **GET** `/api/exam/timetable/published`
- Retrieve all published exam timetables

#### Get Timetables by Class
- **GET** `/api/exam/timetable/class/:class_id`
- Retrieve published timetables for a specific class

## Usage Example

### Creating Exam Timetables

#### Step 1: Create the Term
```json
POST /api/exam/
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

#### Step 2: Create Timetable for Class 7A
```json
POST /api/exam/timetable
{
  "exam_term_id": "term123",
  "exam_name": "Mid-Term Examination",
  "class_id": "class7a",
  "start_date": "2023-05-15T00:00:00Z",
  "end_date": "2023-05-25T00:00:00Z",
  "subjects": [
    {
      "subject_id": "math101",
      "exam_date": "2023-05-15T00:00:00Z",
      "start_time": "09:00",
      "end_time": "11:00",
      "room": "Room A101"
    },
    {
      "subject_id": "phys101",
      "exam_date": "2023-05-17T00:00:00Z",
      "start_time": "09:00",
      "end_time": "11:00",
      "room": "Room B202"
    }
  ]
}
```

#### Step 3: Create Timetable for Class 7B
```json
POST /api/exam/timetable
{
  "exam_term_id": "term123",
  "exam_name": "Mid-Term Examination",
  "class_id": "class7b",
  "start_date": "2023-05-15T00:00:00Z",
  "end_date": "2023-05-25T00:00:00Z",
  "subjects": [
    {
      "subject_id": "math101",
      "exam_date": "2023-05-15T00:00:00Z",
      "start_time": "09:00",
      "end_time": "11:00"
    }
  ]
}
```

**Note**: Each class gets its own timetable. Repeat for all classes in the term.

## Security

- All administrative operations require appropriate role-based permissions
- Published timetables are publicly accessible to allow student/parent access
- Schedule conflict validation prevents double-booking
- Soft delete ensures data integrity

## Integration

The exam timetable system integrates with:
- **Exam Terms**: Links to existing exam term periods
- **Classes**: Associates with multiple class entities
- **Subjects**: References subject catalog
- **Users**: Tracks invigilator assignments

## File Structure

```
src/
├── models/exam_timetable.model.ts      # Database model
├── services/exam_timetable.service.ts   # Business logic
├── controllers/exam_timetable.controller.ts # Request handlers
├── schema/exam_timetable.ts            # Validation schemas
└── routes/exam_timetable.route.ts      # API routes
```

The routes are automatically mounted under `/api/exam/timetable` through the existing exam route structure.
