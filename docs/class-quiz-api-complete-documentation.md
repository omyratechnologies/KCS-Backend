# Class Quiz API - Complete Documentation

This document provides comprehensive documentation for all Class Quiz API endpoints, including request bodies, response examples, and usage instructions.

## Base URL
```
http://localhost:4500/api/class-quiz
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

---

## 1. Quiz Management Endpoints

### 1.1 Create Quiz
**POST** `/:class_id`

Creates a new quiz for a specific class.

**Parameters:**
- `class_id` (path): Class ID

**Request Body:**
```json
{
  "quiz_name": "Midterm Math Quiz",
  "quiz_description": "A comprehensive quiz covering algebra and geometry",
  "quiz_meta_data": {
    "duration_minutes": 60,
    "passing_score": 70,
    "total_points": 100,
    "max_attempts": 3,
    "available_from": "2023-12-01T00:00:00Z",
    "available_until": "2023-12-15T23:59:59Z",
    "shuffle_questions": true,
    "allow_review": true,
    "show_results_immediately": false
  }
}
```

**Response:**
```json
{
  "id": "quiz123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_name": "Midterm Math Quiz",
  "quiz_description": "A comprehensive quiz covering algebra and geometry",
  "quiz_meta_data": {
    "duration_minutes": 60,
    "passing_score": 70,
    "total_points": 100
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-01T00:00:00Z",
  "updated_at": "2023-05-01T00:00:00Z"
}
```

### 1.2 Get Quiz by ID
**GET** `/:quiz_id`

Retrieves a specific quiz by ID.

**Parameters:**
- `quiz_id` (path): Quiz ID

**Response:**
```json
{
  "id": "quiz123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_name": "Midterm Math Quiz",
  "quiz_description": "A comprehensive quiz covering algebra and geometry",
  "quiz_meta_data": {
    "duration_minutes": 60,
    "passing_score": 70,
    "total_points": 100
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-01T00:00:00Z",
  "updated_at": "2023-05-01T00:00:00Z"
}
```

### 1.3 Get Quizzes by Class ID
**GET** `/class/:class_id`

Retrieves all quizzes for a specific class.

**Parameters:**
- `class_id` (path): Class ID

**Response:**
```json
[
  {
    "id": "quiz123",
    "campus_id": "campus123",
    "class_id": "class123",
    "quiz_name": "Midterm Math Quiz",
    "quiz_description": "A comprehensive quiz covering algebra and geometry",
    "quiz_meta_data": {
      "duration_minutes": 60,
      "passing_score": 70,
      "total_points": 100
    },
    "is_active": true,
    "is_deleted": false,
    "created_at": "2023-05-01T00:00:00Z",
    "updated_at": "2023-05-01T00:00:00Z"
  }
]
```

### 1.4 Get Quizzes with Student Status
**GET** `/class/:class_id/student-status`

Retrieves all quizzes for a specific class with student's attempt status.

**Parameters:**
- `class_id` (path): Class ID
- `user_id` (query, optional): Student ID (uses logged-in user if not provided)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "quiz123",
      "quiz_name": "Midterm Math Quiz",
      "quiz_description": "A comprehensive quiz covering algebra and geometry",
      "quiz_meta_data": {
        "duration_minutes": 60,
        "passing_score": 70,
        "total_points": 100
      },
      "student_status": {
        "status": "completed",
        "availability_status": "available",
        "can_attempt": false,
        "max_attempts": 3,
        "attempts_made": 1,
        "attempt_data": {
          "score": 85,
          "percentage": 85,
          "submission_date": "2023-05-15T11:00:00Z"
        },
        "session_data": null
      }
    }
  ]
}
```

### 1.5 Update Quiz
**PUT** `/:quiz_id`

Updates a specific quiz by ID.

**Parameters:**
- `quiz_id` (path): Quiz ID

**Request Body:**
```json
{
  "quiz_name": "Updated Quiz Name",
  "quiz_description": "Updated description",
  "quiz_meta_data": {
    "duration_minutes": 90,
    "passing_score": 75
  }
}
```

**Response:**
```json
{
  "id": "quiz123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_name": "Updated Quiz Name",
  "quiz_description": "Updated description",
  "quiz_meta_data": {
    "duration_minutes": 90,
    "passing_score": 75
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-01T00:00:00Z",
  "updated_at": "2023-05-01T12:00:00Z"
}
```

### 1.6 Delete Quiz
**DELETE** `/:quiz_id`

Soft deletes a specific quiz by ID.

**Parameters:**
- `quiz_id` (path): Quiz ID

**Response:**
```json
{
  "id": "quiz123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_name": "Midterm Math Quiz",
  "quiz_description": "A comprehensive quiz covering algebra and geometry",
  "quiz_meta_data": {
    "duration_minutes": 60,
    "passing_score": 70
  },
  "is_active": false,
  "is_deleted": true,
  "created_at": "2023-05-01T00:00:00Z",
  "updated_at": "2023-05-01T12:00:00Z"
}
```

### 1.7 Get All Quizzes
**GET** `/all`

Retrieves all quizzes from all classes for the campus.

**Response:**
```json
[
  {
    "id": "quiz123",
    "campus_id": "campus123",
    "class_id": "class123",
    "quiz_name": "Midterm Math Quiz",
    "quiz_description": "A comprehensive quiz covering algebra and geometry",
    "quiz_meta_data": {
      "duration_minutes": 60,
      "passing_score": 70,
      "total_points": 100
    },
    "is_active": true,
    "is_deleted": false,
    "created_at": "2023-05-01T00:00:00Z",
    "updated_at": "2023-05-01T00:00:00Z"
  }
]
```

---

## 2. Question Management Endpoints

### 2.1 Create Quiz Questions
**POST** `/:class_id/:quiz_id/questions`

Creates multiple questions for a specific quiz.

**Parameters:**
- `class_id` (path): Class ID
- `quiz_id` (path): Quiz ID

**Request Body:**
```json
{
  "questionBank": [
    {
      "question_text": "What is the formula for the area of a circle?",
      "question_type": "multiple_choice",
      "options": ["πr", "2πr", "πr²", "2πr²"],
      "correct_answer": "πr²",
      "meta_data": {
        "points": 5,
        "difficulty": "medium"
      }
    },
    {
      "question_text": "Solve for x: 2x + 5 = 15",
      "question_type": "multiple_choice",
      "options": ["5", "10", "7.5", "5.5"],
      "correct_answer": "5",
      "meta_data": {
        "points": 5,
        "difficulty": "easy"
      }
    }
  ]
}
```

**Response:**
```json
"Class Quiz Questions created successfully"
```

### 2.2 Get Question by ID
**GET** `/questions/:question_id`

Retrieves a specific quiz question by ID.

**Parameters:**
- `question_id` (path): Question ID

**Response:**
```json
{
  "id": "question123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_id": "quiz123",
  "question_text": "What is the formula for the area of a circle?",
  "question_type": "multiple_choice",
  "options": ["πr", "2πr", "πr²", "2πr²"],
  "correct_answer": "πr²",
  "meta_data": {
    "points": 5,
    "difficulty": "medium"
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-01T00:00:00Z",
  "updated_at": "2023-05-01T00:00:00Z"
}
```

### 2.3 Get Questions by Class and Quiz ID
**GET** `/class/:class_id/:quiz_id/questions`

Retrieves all questions for a specific quiz in a class.

**Parameters:**
- `class_id` (path): Class ID
- `quiz_id` (path): Quiz ID

**Response:**
```json
[
  {
    "id": "question123",
    "campus_id": "campus123",
    "class_id": "class123",
    "quiz_id": "quiz123",
    "question_text": "What is the formula for the area of a circle?",
    "question_type": "multiple_choice",
    "options": ["πr", "2πr", "πr²", "2πr²"],
    "correct_answer": "πr²",
    "meta_data": {
      "points": 5,
      "difficulty": "medium"
    },
    "is_active": true,
    "is_deleted": false,
    "created_at": "2023-05-01T00:00:00Z",
    "updated_at": "2023-05-01T00:00:00Z"
  }
]
```

### 2.4 Update Question
**PUT** `/questions/:question_id`

Updates a specific quiz question by ID.

**Parameters:**
- `question_id` (path): Question ID

**Request Body:**
```json
{
  "question_text": "What is the formula for the circumference of a circle?",
  "question_type": "multiple_choice",
  "options": ["πr", "2πr", "πr²", "2πr²"],
  "correct_answer": "2πr",
  "meta_data": {
    "points": 10,
    "difficulty": "hard"
  }
}
```

**Response:**
```json
{
  "id": "question123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_id": "quiz123",
  "question_text": "What is the formula for the circumference of a circle?",
  "question_type": "multiple_choice",
  "options": ["πr", "2πr", "πr²", "2πr²"],
  "correct_answer": "2πr",
  "meta_data": {
    "points": 10,
    "difficulty": "hard"
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-01T00:00:00Z",
  "updated_at": "2023-05-01T12:00:00Z"
}
```

### 2.5 Delete Question
**DELETE** `/questions/:question_id`

Soft deletes a specific quiz question by ID.

**Parameters:**
- `question_id` (path): Question ID

**Response:**
```json
{
  "id": "question123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_id": "quiz123",
  "question_text": "What is the formula for the area of a circle?",
  "question_type": "multiple_choice",
  "options": ["πr", "2πr", "πr²", "2πr²"],
  "correct_answer": "πr²",
  "meta_data": {
    "points": 5,
    "difficulty": "medium"
  },
  "is_active": false,
  "is_deleted": true,
  "created_at": "2023-05-01T00:00:00Z",
  "updated_at": "2023-05-01T12:00:00Z"
}
```

---

## 3. Legacy Attempt & Submission Endpoints

### 3.1 Create Quiz Attempt (Legacy)
**POST** `/:class_id/:quiz_id/attempt`

Records a student's attempt at answering a quiz question (legacy endpoint).

**Parameters:**
- `class_id` (path): Class ID
- `quiz_id` (path): Quiz ID

**Request Body:**
```json
{
  "question_id": "question123",
  "opted_answer": {
    "option_id": "option2",
    "answer": "πr²"
  }
}
```

**Response:**
```json
{
  "id": "attempt123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_id": "quiz123",
  "question_id": "question123",
  "user_id": "student123",
  "attempt_data": {
    "option_id": "option2",
    "answer": "πr²"
  },
  "meta_data": {},
  "created_at": "2023-05-15T10:30:00Z",
  "updated_at": "2023-05-15T10:30:00Z"
}
```

### 3.2 Get Quiz Attempts by Quiz and Student ID
**GET** `/attempt/:quiz_id/:student_id`

Retrieves all attempts for a specific quiz by a student.

**Parameters:**
- `quiz_id` (path): Quiz ID
- `student_id` (path): Student ID

**Response:**
```json
[
  {
    "id": "attempt123",
    "campus_id": "campus123",
    "class_id": "class123",
    "quiz_id": "quiz123",
    "question_id": "question123",
    "user_id": "student123",
    "attempt_data": {
      "option_id": "option2",
      "answer": "πr²"
    },
    "meta_data": {},
    "created_at": "2023-05-15T10:30:00Z",
    "updated_at": "2023-05-15T10:30:00Z"
  }
]
```

### 3.3 Get Quiz Attempts by Class and Quiz ID
**GET** `/class/:class_id/:quiz_id/attempt`

Retrieves all attempts for a specific quiz in a class.

**Parameters:**
- `class_id` (path): Class ID
- `quiz_id` (path): Quiz ID

**Response:**
```json
[
  {
    "id": "attempt123",
    "campus_id": "campus123",
    "class_id": "class123",
    "quiz_id": "quiz123",
    "question_id": "question123",
    "user_id": "student123",
    "attempt_data": {
      "option_id": "option2",
      "answer": "πr²"
    },
    "meta_data": {},
    "created_at": "2023-05-15T10:30:00Z",
    "updated_at": "2023-05-15T10:30:00Z"
  }
]
```

### 3.4 Create Quiz Submission (Legacy)
**POST** `/:class_id/:quiz_id/submission`

Creates a final submission for a quiz, calculating the score (legacy endpoint).

**Parameters:**
- `class_id` (path): Class ID
- `quiz_id` (path): Quiz ID

**Response:**
```json
{
  "id": "submission123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_id": "quiz123",
  "user_id": "student123",
  "submission_date": "2023-05-15T11:00:00Z",
  "score": 85,
  "feedback": "Good work! Review chapter 5 for questions you missed.",
  "meta_data": {
    "time_taken_minutes": 45,
    "attempts_per_question": {
      "question123": 1,
      "question124": 2
    }
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-15T11:00:00Z",
  "updated_at": "2023-05-15T11:00:00Z"
}
```

### 3.5 Get Quiz Submission by ID
**GET** `/submission/:submission_id`

Retrieves a specific quiz submission by ID.

**Parameters:**
- `submission_id` (path): Submission ID

**Response:**
```json
{
  "id": "submission123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_id": "quiz123",
  "user_id": "student123",
  "submission_date": "2023-05-15T11:00:00Z",
  "score": 85,
  "feedback": "Good work! Review chapter 5 for questions you missed.",
  "meta_data": {
    "time_taken_minutes": 45,
    "attempts_per_question": {
      "question123": 1,
      "question124": 2
    }
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-15T11:00:00Z",
  "updated_at": "2023-05-15T11:00:00Z"
}
```

### 3.6 Update Quiz Submission
**PUT** `/submission/:submission_id`

Updates a specific quiz submission by ID.

**Parameters:**
- `submission_id` (path): Submission ID

**Request Body:**
```json
{
  "score": 90,
  "feedback": "Excellent work!",
  "meta_data": {
    "time_taken_minutes": 40,
    "attempts_per_question": {
      "question123": 1,
      "question124": 1
    }
  }
}
```

**Response:**
```json
{
  "id": "submission123",
  "campus_id": "campus123",
  "class_id": "class123",
  "quiz_id": "quiz123",
  "user_id": "student123",
  "submission_date": "2023-05-15T11:00:00Z",
  "score": 90,
  "feedback": "Excellent work!",
  "meta_data": {
    "time_taken_minutes": 40,
    "attempts_per_question": {
      "question123": 1,
      "question124": 1
    }
  },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2023-05-15T11:00:00Z",
  "updated_at": "2023-05-15T12:00:00Z"
}
```

---

## 4. Session-Based Quiz Endpoints

### 4.1 Start Quiz Session
**POST** `/session/:class_id/:quiz_id/start`

Starts a new quiz session for a student.

**Parameters:**
- `class_id` (path): Class ID
- `quiz_id` (path): Quiz ID

**Response:**
```json
{
  "success": true,
  "message": "Quiz session started successfully",
  "data": {
    "session": {
      "id": "session123",
      "session_token": "sess_abc123def456",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "status": "active",
      "started_at": "2023-05-15T10:00:00Z",
      "expires_at": "2023-05-15T11:00:00Z",
      "current_question_index": 0,
      "answers": {},
      "meta_data": {}
    },
    "quiz": {
      "id": "quiz123",
      "quiz_name": "Midterm Math Quiz",
      "quiz_description": "A comprehensive quiz covering algebra and geometry",
      "quiz_meta_data": {
        "duration_minutes": 60,
        "total_questions": 10
      }
    },
    "current_question": {
      "id": "question123",
      "question_text": "What is 2 + 2?",
      "question_type": "multiple_choice",
      "options": ["3", "4", "5", "6"],
      "meta_data": {
        "points": 5
      }
    },
    "questions_count": 10,
    "time_remaining_seconds": 3600
  }
}
```

### 4.2 Get Quiz Session
**GET** `/session/:session_token`

Retrieves current quiz session state.

**Parameters:**
- `session_token` (path): Session token

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session123",
      "session_token": "sess_abc123def456",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "status": "active",
      "started_at": "2023-05-15T10:00:00Z",
      "expires_at": "2023-05-15T11:00:00Z",
      "current_question_index": 2,
      "answers": {
        "question123": "4",
        "question124": "πr²"
      },
      "meta_data": {}
    },
    "quiz": {
      "id": "quiz123",
      "quiz_name": "Midterm Math Quiz",
      "quiz_description": "A comprehensive quiz covering algebra and geometry",
      "quiz_meta_data": {
        "duration_minutes": 60,
        "total_questions": 10
      }
    },
    "current_question": {
      "id": "question125",
      "question_text": "What is 10 × 5?",
      "question_type": "multiple_choice",
      "options": ["45", "50", "55", "60"],
      "meta_data": {
        "points": 5
      }
    },
    "questions_count": 10,
    "time_remaining_seconds": 2400
  }
}
```

### 4.3 Submit Quiz Answer
**POST** `/session/:session_token/answer`

Submits an answer for a quiz question.

**Parameters:**
- `session_token` (path): Session token

**Request Body:**
```json
{
  "question_id": "question123",
  "answer": "4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Answer saved successfully",
  "data": {
    "session": {
      "id": "session123",
      "session_token": "sess_abc123def456",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "status": "active",
      "started_at": "2023-05-15T10:00:00Z",
      "expires_at": "2023-05-15T11:00:00Z",
      "current_question_index": 1,
      "answers": {
        "question123": "4"
      },
      "meta_data": {}
    },
    "quiz": {
      "id": "quiz123",
      "quiz_name": "Midterm Math Quiz",
      "quiz_description": "A comprehensive quiz covering algebra and geometry"
    },
    "current_question": {
      "id": "question124",
      "question_text": "What is the square root of 16?",
      "question_type": "multiple_choice",
      "options": ["2", "3", "4", "5"]
    },
    "questions_count": 10,
    "time_remaining_seconds": 3540
  }
}
```

### 4.4 Navigate to Next Question
**POST** `/session/:session_token/next`

Moves to the next question in the quiz session.

**Parameters:**
- `session_token` (path): Session token

**Response:**
```json
{
  "success": true,
  "message": "Moved to next question",
  "data": {
    "session": {
      "id": "session123",
      "session_token": "sess_abc123def456",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "status": "active",
      "started_at": "2023-05-15T10:00:00Z",
      "expires_at": "2023-05-15T11:00:00Z",
      "current_question_index": 1,
      "answers": {
        "question123": "4"
      },
      "meta_data": {}
    },
    "quiz": {
      "id": "quiz123",
      "quiz_name": "Midterm Math Quiz",
      "quiz_description": "A comprehensive quiz covering algebra and geometry"
    },
    "current_question": {
      "id": "question124",
      "question_text": "What is the square root of 16?",
      "question_type": "multiple_choice",
      "options": ["2", "3", "4", "5"]
    },
    "questions_count": 10,
    "time_remaining_seconds": 3540,
    "can_go_previous": true,
    "can_go_next": true
  }
}
```

### 4.5 Navigate to Previous Question
**POST** `/session/:session_token/previous`

Moves to the previous question in the quiz session.

**Parameters:**
- `session_token` (path): Session token

**Response:**
```json
{
  "success": true,
  "message": "Moved to previous question",
  "data": {
    "session": {
      "id": "session123",
      "session_token": "sess_abc123def456",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "status": "active",
      "started_at": "2023-05-15T10:00:00Z",
      "expires_at": "2023-05-15T11:00:00Z",
      "current_question_index": 0,
      "answers": {
        "question123": "4"
      },
      "meta_data": {}
    },
    "quiz": {
      "id": "quiz123",
      "quiz_name": "Midterm Math Quiz",
      "quiz_description": "A comprehensive quiz covering algebra and geometry"
    },
    "current_question": {
      "id": "question123",
      "question_text": "What is 2 + 2?",
      "question_type": "multiple_choice",
      "options": ["3", "4", "5", "6"]
    },
    "questions_count": 10,
    "time_remaining_seconds": 3540,
    "can_go_previous": false,
    "can_go_next": true
  }
}
```

### 4.6 Complete Quiz Session
**POST** `/session/:session_token/complete`

Completes and submits the quiz.

**Parameters:**
- `session_token` (path): Session token

**Response:**
```json
{
  "success": true,
  "message": "Quiz completed successfully",
  "data": {
    "score": 8,
    "total_questions": 10,
    "percentage": 80,
    "correct_answers": 8,
    "incorrect_answers": 2,
    "time_taken_seconds": 1800,
    "submission": {
      "id": "submission123",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "score": 8,
      "submission_date": "2023-05-15T10:30:00Z",
      "feedback": "Good job! You scored 80%",
      "meta_data": {
        "time_taken_seconds": 1800,
        "auto_submitted": false,
        "session_token": "sess_abc123def456"
      }
    }
  }
}
```

### 4.7 Get Quiz Session History
**GET** `/session/history`

Retrieves the history of quiz sessions for the current user.

**Parameters:**
- `quiz_id` (query, optional): Filter by specific quiz ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session123",
      "session_token": "sess_abc123def456",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "status": "completed",
      "started_at": "2023-05-15T10:00:00Z",
      "completed_at": "2023-05-15T10:30:00Z",
      "expires_at": "2023-05-15T11:00:00Z",
      "quiz": {
        "quiz_name": "Midterm Math Quiz",
        "quiz_description": "A comprehensive quiz covering algebra and geometry"
      },
      "submission": {
        "id": "submission123",
        "score": 8,
        "percentage": 80
      }
    }
  ]
}
```

### 4.6 Abandon Quiz Session
**POST** `/session/:session_token/abandon`

Manually abandon a quiz session without submitting.

**Parameters:**
- `session_token` (path): Session token

**Response:**
```json
{
  "success": true,
  "message": "Quiz session abandoned successfully"
}
```

### 4.7 Get Quiz Results by Session
**GET** `/session/:session_token/results`

Retrieves detailed quiz results for a completed session.

**Parameters:**
- `session_token` (path): Session token

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session123",
      "session_token": "sess_abc123def456",
      "status": "completed",
      "started_at": "2023-05-15T10:00:00Z",
      "completed_at": "2023-05-15T10:30:00Z",
      "time_taken_seconds": 1800
    },
    "quiz": {
      "id": "quiz123",
      "quiz_name": "Midterm Math Quiz",
      "quiz_description": "A comprehensive quiz covering algebra and geometry",
      "quiz_meta_data": {
        "duration_minutes": 60,
        "total_points": 100
      }
    },
    "results": {
      "submission_id": "submission123",
      "score": 8,
      "total_questions": 10,
      "correct_answers": 8,
      "incorrect_answers": 2,
      "percentage": 80,
      "submission_date": "2023-05-15T10:30:00Z",
      "feedback": "Good job! You scored 80%",
      "time_taken_seconds": 1800,
      "auto_submitted": false
    },
    "question_details": [
      {
        "question_id": "question123",
        "question_text": "What is 2 + 2?",
        "question_type": "multiple_choice",
        "options": ["3", "4", "5", "6"],
        "correct_answer": "4",
        "user_answer": "4",
        "is_correct": true,
        "points_earned": 5,
        "meta_data": {
          "difficulty": "easy"
        }
      },
      {
        "question_id": "question124",
        "question_text": "What is the square root of 16?",
        "question_type": "multiple_choice",
        "options": ["2", "3", "4", "5"],
        "correct_answer": "4",
        "user_answer": "3",
        "is_correct": false,
        "points_earned": 0,
        "meta_data": {
          "difficulty": "medium"
        }
      }
    ],
    "meta_data": {}
  }
}
```

---

## 5. Statistics & Administration Endpoints

### 5.1 Get Quiz Statistics
**GET** `/class/:class_id/:quiz_id/statistics`

Retrieves detailed statistics for a specific quiz.

**Parameters:**
- `class_id` (path): Class ID
- `quiz_id` (path): Quiz ID

**Response:**
```json
{
  "total_attempts": 25,
  "average_score": 85.4,
  "highest_score": 100,
  "lowest_score": 65,
  "completion_rate": 25,
  "submissions": [
    {
      "id": "submission123",
      "campus_id": "campus123",
      "class_id": "class123",
      "quiz_id": "quiz123",
      "user_id": "student123",
      "submission_date": "2023-05-15T11:00:00Z",
      "score": 85,
      "feedback": "Good work! Review chapter 5 for questions you missed.",
      "meta_data": {
        "time_taken_minutes": 45,
        "attempts_per_question": {
          "question123": 1,
          "question124": 2
        }
      },
      "is_active": true,
      "is_deleted": false,
      "created_at": "2023-05-15T11:00:00Z",
      "updated_at": "2023-05-15T11:00:00Z"
    }
  ]
}
```

### 5.2 Check Expired Sessions (Admin)
**POST** `/admin/check-expired-sessions`

Checks for expired quiz sessions and auto-submits them (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Processed 3 expired sessions",
  "data": [
    {
      "session_id": "session123",
      "user_id": "student123",
      "quiz_id": "quiz123",
      "result": {
        "auto_submitted": true,
        "score": 5,
        "total_questions": 10,
        "percentage": 50
      }
    },
    {
      "session_id": "session124",
      "user_id": "student124",
      "quiz_id": "quiz123",
      "result": {
        "auto_submitted": true,
        "score": 3,
        "total_questions": 10,
        "percentage": 30
      }
    }
  ]
}
```

---

## Status Codes

- **200 OK**: Request successful
- **400 Bad Request**: Invalid request parameters or data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description here"
}
```

---

## Quiz Flow Examples

### Complete Session-Based Quiz Flow

1. **Start Quiz Session**
   ```bash
   POST /api/class-quiz/session/class123/quiz123/start
   ```

2. **Get Current Question**
   ```bash
   GET /api/class-quiz/session/sess_abc123def456
   ```

3. **Submit Answer (repeat for each question)**
   ```bash
   POST /api/class-quiz/session/sess_abc123def456/answer
   Body: {"question_id": "question123", "answer": "4"}
   ```

4. **Navigate Between Questions (optional)**
   ```bash
   # Move to next question
   POST /api/class-quiz/session/sess_abc123def456/next
   
   # Move to previous question
   POST /api/class-quiz/session/sess_abc123def456/previous
   ```

5. **Complete Quiz**
   ```bash
   POST /api/class-quiz/session/sess_abc123def456/complete
   ```

6. **Get Results**
   ```bash
   GET /api/class-quiz/session/sess_abc123def456/results
   ```

### Legacy Quiz Flow

1. **Get Quiz Questions**
   ```bash
   GET /api/class-quiz/class/class123/quiz123/questions
   ```

2. **Submit Attempts (one per question)**
   ```bash
   POST /api/class-quiz/class123/quiz123/attempt
   Body: {"question_id": "question123", "opted_answer": {"option_id": "option2", "answer": "4"}}
   ```

3. **Submit Final Quiz**
   ```bash
   POST /api/class-quiz/class123/quiz123/submission
   ```

4. **Get Submission**
   ```bash
   GET /api/class-quiz/submission/submission123
   ```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Session tokens expire based on quiz time limits
- Auto-submission occurs when sessions expire
- Background service periodically checks for expired sessions
- Both legacy and session-based flows are supported for backward compatibility
- Student status API provides availability and attempt information for frontend display
- Statistics endpoint provides comprehensive quiz analytics for instructors
