# Class Quiz API Flow Documentation

## Overview
This document outlines the complete quiz flow using the Class Quiz APIs. The system supports both modern session-based quiz management and legacy compatibility.

## Prerequisites
- Valid authentication token (JWT)
- Campus ID, Class ID, and User ID
- Backend server running on `http://localhost:4500`

## Complete Quiz Flow

### 1. System Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok!"
}
```

---

### 2. Quiz Management Flow

#### A. Create a Quiz
```http
POST /api/class-quiz/{class_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "quiz_name": "Mathematics Quiz 1",
  "quiz_description": "Basic algebra and geometry questions",
  "quiz_meta_data": {
    "time_limit_minutes": 30,
    "shuffle_questions": true,
    "allow_review": true,
    "show_results_immediately": true,
    "max_attempts": 1,
    "available_from": "2025-06-27T20:00:00.000Z",
    "available_until": "2025-07-04T20:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "id": "quiz_id_123",
  "campus_id": "campus_123",
  "class_id": "class_456",
  "quiz_name": "Mathematics Quiz 1",
  "quiz_description": "Basic algebra and geometry questions",
  "quiz_meta_data": { ... },
  "is_active": true,
  "is_deleted": false,
  "created_at": "2025-06-27T20:00:00.000Z",
  "updated_at": "2025-06-27T20:00:00.000Z"
}
```

#### B. Get Quiz Details
```http
GET /api/class-quiz/{quiz_id}
Authorization: Bearer {access_token}
```

#### C. Get All Quizzes for a Class
```http
GET /api/class-quiz/class/{class_id}
Authorization: Bearer {access_token}
```

---

### 3. Question Management Flow

#### A. Add Questions to Quiz
```http
POST /api/class-quiz/{class_id}/{quiz_id}/questions
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "questionBank": [
    {
      "question_text": "What is 2 + 2?",
      "question_type": "multiple_choice",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "4",
      "meta_data": {
        "difficulty": "easy"
      }
    },
    {
      "question_text": "What is the square root of 16?",
      "question_type": "multiple_choice",
      "options": ["2", "3", "4", "5"],
      "correct_answer": "4",
      "meta_data": {
        "difficulty": "medium"
      }
    }
  ]
}
```

**Response:**
```json
{
  "message": "Quiz questions created successfully",
  "questions_count": 2,
  "questions": [
    {
      "id": "question_id_1",
      "question_text": "What is 2 + 2?",
      "question_type": "multiple_choice",
      "options": ["3", "4", "5", "6"],
      "correct_answer": "4",
      "meta_data": { "difficulty": "easy" },
      "created_at": "2025-06-27T20:00:00.000Z"
    }
  ]
}
```

#### B. Get Quiz Questions
```http
GET /api/class-quiz/class/{class_id}/{quiz_id}/questions
Authorization: Bearer {access_token}
```

---

### 4. Student Quiz Taking Flow

#### A. Start Quiz Session
```http
POST /api/class-quiz/session/{class_id}/{quiz_id}/start
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz session started successfully",
  "data": {
    "session": {
      "id": "session_id_123",
      "session_token": "secure_session_token_abc123...",
      "status": "in_progress",
      "started_at": "2025-06-27T20:00:00.000Z",
      "expires_at": "2025-06-27T20:30:00.000Z",
      "time_limit_minutes": 30,
      "answers_count": 0,
      "total_questions": 3,
      "current_question_index": 0,
      "meta_data": {
        "question_order": ["q1", "q2", "q3"],
        "quiz_settings": { ... }
      }
    },
    "quiz": { ... },
    "current_question": {
      "id": "question_id_1",
      "question_text": "What is 2 + 2?",
      "question_type": "multiple_choice",
      "options": ["3", "4", "5", "6"]
    },
    "questions_count": 3,
    "time_remaining_seconds": 1800
  }
}
```

**Key Information:**
- `session_token`: Use this for all subsequent API calls
- `expires_at`: When the quiz will auto-submit
- `current_question`: The question to display
- `time_remaining_seconds`: Real-time countdown

#### B. Get Current Session Status
```http
GET /api/class-quiz/session/{session_token}
Authorization: Bearer {access_token}
```

This returns the same structure as starting a session, with updated progress.

#### C. Submit Answer
```http
POST /api/class-quiz/session/{session_token}/answer
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "question_id": "question_id_1",
  "answer": "4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "session": {
      "answers_count": 1,
      "last_activity_at": "2025-06-27T20:05:00.000Z"
    },
    "quiz": { ... },
    "current_question": { ... },
    "time_remaining_seconds": 1500
  }
}
```

**Important Notes:**
- Answers are automatically saved
- You can update an answer by submitting again for the same question
- Session automatically expires when time limit is reached

#### D. Complete Quiz
```http
POST /api/class-quiz/session/{session_token}/complete
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz completed successfully",
  "data": {
    "score": 3,
    "total_questions": 3,
    "percentage": 100,
    "correct_answers": 3,
    "incorrect_answers": 0,
    "time_taken_seconds": 180,
    "submission": {
      "id": "submission_id_123",
      "score": 3,
      "feedback": "Quiz submitted successfully",
      "submission_date": "2025-06-27T20:03:00.000Z",
      "meta_data": {
        "percentage": 100,
        "total_questions": 3,
        "time_taken_seconds": 180
      }
    }
  }
}
```

---

### 5. Admin/Teacher Management Flow

#### A. Check for Expired Sessions
```http
POST /api/class-quiz/admin/check-expired-sessions
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 expired sessions",
  "data": [
    {
      "session_id": "session_123",
      "user_id": "user_456",
      "quiz_id": "quiz_789",
      "result": {
        "score": 2,
        "total_questions": 3,
        "percentage": 66.67,
        "auto_submitted": true
      }
    }
  ]
}
```

#### B. Get Quiz Statistics
```http
GET /api/class-quiz/{class_id}/{quiz_id}/statistics
Authorization: Bearer {access_token}
```

#### C. Get Active Sessions
```http
GET /api/class-quiz/sessions/active?campus_id={campus_id}&class_id={class_id}
Authorization: Bearer {access_token}
```

---

### 6. Legacy API Compatibility

#### A. Create Attempt (Legacy)
```http
POST /api/class-quiz/{class_id}/{quiz_id}/attempt
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "question_id": "question_id_1",
  "opted_answer": {
    "option_id": "1",
    "answer": "4"
  }
}
```

#### B. Create Submission (Legacy)
```http
POST /api/class-quiz/{class_id}/{quiz_id}/submission
Authorization: Bearer {access_token}
```

---

## Error Handling

### Common Error Responses

#### Session Expired
```json
{
  "success": false,
  "message": "Quiz session has expired and has been auto-submitted"
}
```

#### Invalid Session
```json
{
  "success": false,
  "message": "Invalid session"
}
```

#### Quiz Already Completed
```json
{
  "success": false,
  "message": "Quiz already completed"
}
```

#### Authentication Error
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## Frontend Implementation Guide

### 1. Quiz List Page
```javascript
// Get all quizzes for a class
const response = await fetch(`/api/class-quiz/class/${classId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const quizzes = await response.json();
```

### 2. Quiz Taking Interface

#### Initialize Quiz
```javascript
// Start quiz session
const startResponse = await fetch(`/api/class-quiz/session/${classId}/${quizId}/start`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const sessionData = await startResponse.json();
const sessionToken = sessionData.data.session.session_token;
```

#### Timer Management
```javascript
// Update timer every second
const timer = setInterval(async () => {
  try {
    const statusResponse = await fetch(`/api/class-quiz/session/${sessionToken}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const status = await statusResponse.json();
    const timeRemaining = status.data.time_remaining_seconds;
    
    updateTimerDisplay(timeRemaining);
    
    if (timeRemaining <= 0) {
      clearInterval(timer);
      handleAutoSubmission();
    }
  } catch (error) {
    if (error.message.includes('expired')) {
      clearInterval(timer);
      showExpiredMessage();
    }
  }
}, 1000);
```

#### Submit Answer
```javascript
const submitAnswer = async (questionId, answer) => {
  try {
    const response = await fetch(`/api/class-quiz/session/${sessionToken}/answer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question_id: questionId,
        answer: answer
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      updateProgress(result.data.session.answers_count);
    }
  } catch (error) {
    if (error.message.includes('expired')) {
      handleSessionExpired();
    }
  }
};
```

#### Complete Quiz
```javascript
const completeQuiz = async () => {
  try {
    const response = await fetch(`/api/class-quiz/session/${sessionToken}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      showResults(result.data);
    }
  } catch (error) {
    console.error('Error completing quiz:', error);
  }
};
```

---

## Best Practices

### 1. Session Management
- Always store the session token securely
- Implement periodic session status checks
- Handle session expiration gracefully
- Show real-time timer to users

### 2. Answer Saving
- Auto-save answers as users make selections
- Implement optimistic UI updates
- Handle network failures gracefully
- Debounce rapid answer changes

### 3. Error Handling
- Always check for session expiration
- Provide clear feedback to users
- Implement retry mechanisms for network failures
- Log errors for debugging

### 4. Performance
- Cache quiz questions after loading
- Minimize API calls during quiz taking
- Use WebSockets for real-time updates (future enhancement)
- Implement offline capabilities (future enhancement)

### 5. Security
- Never expose correct answers in frontend
- Validate all inputs on backend
- Use HTTPS for all API calls
- Implement rate limiting for quiz attempts

---

## Testing the APIs

You can use the provided test script to validate all endpoints:

```bash
node test-class-quiz-api.js
```

This will run a comprehensive test suite covering all quiz flow scenarios including timeout handling and error cases.

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | System health check |
| `/api/class-quiz/{class_id}` | POST | Create quiz |
| `/api/class-quiz/{quiz_id}` | GET | Get quiz details |
| `/api/class-quiz/class/{class_id}` | GET | Get class quizzes |
| `/api/class-quiz/{class_id}/{quiz_id}/questions` | POST | Add questions |
| `/api/class-quiz/class/{class_id}/{quiz_id}/questions` | GET | Get questions |
| `/api/class-quiz/session/{class_id}/{quiz_id}/start` | POST | Start quiz session |
| `/api/class-quiz/session/{session_token}` | GET | Get session status |
| `/api/class-quiz/session/{session_token}/answer` | POST | Submit answer |
| `/api/class-quiz/session/{session_token}/complete` | POST | Complete quiz |
| `/api/class-quiz/admin/check-expired-sessions` | POST | Admin: Check expired sessions |

---

This documentation provides a complete guide for implementing quiz functionality using the Class Quiz APIs. The system is designed to be robust, user-friendly, and production-ready.
