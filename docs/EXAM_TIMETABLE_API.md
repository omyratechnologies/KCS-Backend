# Exam Timetable CRUD API

This module provides a complete CRUD (Create, Read, Update, Delete) system for managing exam timetables. The system is designed for administrative users only, with published timetables being visible to students and parents.

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

### Exam Timetable
Based on the provided image, each exam timetable includes:

- **Exam Name**: e.g., "Mid-Term Examination"
- **Classes**: Multiple classes (e.g., "Class 7A, 7B, 7C")
- **Date Range**: Start and End dates
- **Subjects**: Array of subjects with:
  - Subject ID (reference to subject entity)
  - Exam Date and Time
  - Room assignment (optional)
  - Invigilator IDs (optional, references to teacher entities)

**Response Enhancement**: When retrieving exam timetables through GET endpoints, the system automatically enriches the data with:
- Subject Code (e.g., "MAT101")
- Subject Name (e.g., "Mathematics") 
- Credits (e.g., 4)
- Class Names
- Exam Term Details
- Invigilator Names

## API Endpoints

### Admin Endpoints (Require Admin Permissions)

#### Create Exam Timetable
- **POST** `/api/exam/timetable`
- Create a new exam timetable

#### Get All Exam Timetables
- **GET** `/api/exam/timetable`
- Retrieve all exam timetables for the campus

#### Get Exam Timetable by ID
- **GET** `/api/exam/timetable/:id`
- Retrieve a specific exam timetable

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

### Creating an Exam Timetable

```json
POST /api/exam/timetable
{
  "exam_term_id": "term123",
  "exam_name": "Mid-Term Examination",
  "class_ids": ["class7a", "class7b", "class7c"],
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
      "end_time": "11:00",
      "room": "Room B202"
    }
  ]
}
```

**Note**: The API accepts only subject IDs and other reference IDs. When retrieving exam timetables, the system automatically enriches the response with complete subject details (code, name, credits) by looking up the referenced subjects, classes, and exam terms.

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
