# Get All Class Quizzes Route Implementation

## Overview
Created a new API endpoint to retrieve all quizzes from all classes for a given campus.

## Changes Made

### 1. Service Layer (`src/services/class_quiz.service.ts`)
Added a new static method `getAllClassQuizzes`:
- Takes `campus_id` as parameter
- Retrieves all quizzes from all classes for the specified campus
- Filters out deleted quizzes (`is_deleted: false`)
- Returns results sorted by `updated_at` in descending order

### 2. Controller Layer (`src/controllers/class_quiz.controller.ts`)
Added a new static method `getAllClassQuizzes`:
- Extracts `campus_id` from the authentication context
- Calls the service method
- Returns JSON response with all quizzes
- Includes proper error handling

### 3. Routes Layer (`src/routes/class_quiz.route.ts`)
Added a new GET route `/all`:
- Endpoint: `GET /api/class-quiz/all`
- Uses OpenAPI documentation with `describeRoute`
- Includes proper response schemas
- Maps to the controller method

## API Endpoint
```
GET /api/class-quiz/all
```

### Response
Returns an array of quiz objects containing:
- Quiz ID
- Class ID
- Campus ID
- Quiz name and description
- Quiz metadata
- Creation and update timestamps
- Active status

### Authentication
Requires authentication middleware (campus_id is extracted from the authenticated user context)

## Usage
This endpoint allows administrators and authorized users to retrieve all quizzes across all classes within their campus, providing a comprehensive view of quiz activities.
