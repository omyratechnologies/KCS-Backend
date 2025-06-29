# Student Quiz List API Documentation

## Overview
This API endpoint provides a comprehensive view of all quizzes for a class with each student's attempt status. It shows whether quizzes are completed, in progress, or not yet attempted.

## Endpoint

```http
GET /api/class-quiz/class/{class_id}/student-status?user_id={student_id}
```

**URL:** `https://dev-api.letscatchup-kcs.com/api/class-quiz/class/{class_id}/student-status`

## Parameters

| Parameter | Type | Required | Location | Description |
|-----------|------|----------|----------|-------------|
| `class_id` | string | Yes | Path | The ID of the class |
| `user_id` | string | No | Query | Student ID (uses logged-in user if not provided) |

## Authentication

```http
Authorization: Bearer {jwt_token}
```

## Response Format

```json
{
    "success": true,
    "data": [
        {
            "id": "quiz_id",
            "campus_id": "campus_id",
            "class_id": "class_id", 
            "quiz_name": "Mathematics Quiz 1",
            "quiz_description": "Basic algebra and geometry questions",
            "quiz_meta_data": {
                "time_limit_minutes": 60,
                "shuffle_questions": true,
                "allow_review": true,
                "show_results_immediately": true,
                "max_attempts": 3,
                "available_from": "2025-06-28T00:00:00.000Z",
                "available_until": "2025-06-30T00:00:00.000Z",
                "passing_score": 60,
                "total_points": 100
            },
            "is_active": true,
            "is_deleted": false,
            "created_at": "2025-06-28T04:46:49.822Z",
            "updated_at": "2025-06-28T04:46:49.822Z",
            "student_status": {
                "status": "completed",
                "availability_status": "available",
                "can_attempt": false,
                "max_attempts": 3,
                "attempts_made": 1,
                "attempt_data": {
                    "submission_id": "submission_id",
                    "score": 85,
                    "submission_date": "2025-06-28T12:05:47.671Z",
                    "feedback": "Great job!",
                    "meta_data": {
                        "percentage": 85,
                        "time_taken_seconds": 1706,
                        "total_questions": 20
                    }
                },
                "session_data": null
            }
        }
    ]
}
```

## Student Status Values

### Status Types

| Status | Description | Icon | Action Available |
|--------|-------------|------|------------------|
| `not_attempted` | Quiz not yet started | ⭕ | Start Quiz |
| `in_progress` | Quiz session active | 🚀 | Resume Quiz |
| `completed` | Quiz submitted | ✅ | View Results |
| `expired` | Quiz session timed out | ⏰ | View Results (if auto-submitted) |

### Availability Status

| Status | Description | Can Start? |
|--------|-------------|------------|
| `available` | Quiz is available for taking | Yes |
| `not_yet_available` | Quiz not yet open | No |
| `expired` | Quiz deadline passed | No |

### Attempt Data (when completed)

```json
{
    "submission_id": "string",
    "score": "number",
    "submission_date": "ISO date string",
    "feedback": "string",
    "meta_data": {
        "percentage": "number",
        "time_taken_seconds": "number",
        "total_questions": "number"
    }
}
```

### Session Data (when in progress)

```json
{
    "session_id": "string",
    "session_token": "string",
    "started_at": "ISO date string",
    "expires_at": "ISO date string",
    "answers_count": "number",
    "total_questions": "number",
    "time_remaining_seconds": "number or null"
}
```

## Usage Examples

### 1. Student Dashboard - Show My Quizzes
```javascript
// Get quizzes for current logged-in student
const response = await fetch(`/api/class-quiz/class/${classId}/student-status`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

const { data: quizzes } = await response.json();

// Display different UI based on status
quizzes.forEach(quiz => {
    const status = quiz.student_status;
    
    switch(status.status) {
        case 'not_attempted':
            if (status.can_attempt && status.availability_status === 'available') {
                showStartButton(quiz);
            } else {
                showUnavailableMessage(quiz);
            }
            break;
            
        case 'in_progress':
            showResumeButton(quiz, status.session_data);
            break;
            
        case 'completed':
            showResultsButton(quiz, status.attempt_data);
            break;
            
        case 'expired':
            showExpiredMessage(quiz);
            break;
    }
});
```

### 2. Teacher Dashboard - Monitor Student Progress
```javascript
// Get quiz status for a specific student
const response = await fetch(`/api/class-quiz/class/${classId}/student-status?user_id=${studentId}`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

const { data: quizzes } = await response.json();

// Generate progress report
const report = {
    total_quizzes: quizzes.length,
    completed: quizzes.filter(q => q.student_status.status === 'completed').length,
    in_progress: quizzes.filter(q => q.student_status.status === 'in_progress').length,
    not_attempted: quizzes.filter(q => q.student_status.status === 'not_attempted').length,
    average_score: calculateAverageScore(quizzes)
};
```

### 3. React Component Example
```jsx
import React, { useState, useEffect } from 'react';

const StudentQuizList = ({ classId, authToken }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizzes();
    }, [classId]);

    const fetchQuizzes = async () => {
        try {
            const response = await fetch(`/api/class-quiz/class/${classId}/student-status`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            setQuizzes(data.data || []);
        } catch (error) {
            console.error('Failed to fetch quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'not_attempted': { color: 'gray', text: 'Not Started', icon: '⭕' },
            'in_progress': { color: 'blue', text: 'In Progress', icon: '🚀' },
            'completed': { color: 'green', text: 'Completed', icon: '✅' },
            'expired': { color: 'red', text: 'Expired', icon: '⏰' }
        };
        
        return badges[status] || badges['not_attempted'];
    };

    const handleQuizAction = (quiz) => {
        const status = quiz.student_status;
        
        switch(status.status) {
            case 'not_attempted':
                if (status.can_attempt && status.availability_status === 'available') {
                    // Start new quiz
                    window.location.href = `/quiz/start/${quiz.id}`;
                }
                break;
                
            case 'in_progress':
                // Resume quiz
                window.location.href = `/quiz/resume/${status.session_data.session_token}`;
                break;
                
            case 'completed':
                // View results
                window.location.href = `/quiz/results/${status.attempt_data.submission_id}`;
                break;
        }
    };

    if (loading) return <div className="loading">Loading quizzes...</div>;

    return (
        <div className="quiz-list">
            <h2>My Quizzes</h2>
            
            {quizzes.map(quiz => {
                const status = quiz.student_status;
                const badge = getStatusBadge(status.status);
                
                return (
                    <div key={quiz.id} className="quiz-card">
                        <div className="quiz-header">
                            <h3>{quiz.quiz_name}</h3>
                            <span className={`badge ${badge.color}`}>
                                {badge.icon} {badge.text}
                            </span>
                        </div>
                        
                        <p className="quiz-description">{quiz.quiz_description}</p>
                        
                        {status.attempt_data && (
                            <div className="attempt-info">
                                <strong>Score: {status.attempt_data.score}</strong>
                                <span>Submitted: {new Date(status.attempt_data.submission_date).toLocaleDateString()}</span>
                            </div>
                        )}
                        
                        {status.session_data && (
                            <div className="session-info">
                                <span>Progress: {status.session_data.answers_count}/{status.session_data.total_questions}</span>
                                {status.session_data.time_remaining_seconds > 0 && (
                                    <span>Time Left: {Math.floor(status.session_data.time_remaining_seconds / 60)} min</span>
                                )}
                            </div>
                        )}
                        
                        <div className="quiz-actions">
                            {status.status === 'not_attempted' && status.can_attempt && status.availability_status === 'available' && (
                                <button onClick={() => handleQuizAction(quiz)} className="btn-primary">
                                    Start Quiz
                                </button>
                            )}
                            
                            {status.status === 'in_progress' && (
                                <button onClick={() => handleQuizAction(quiz)} className="btn-secondary">
                                    Resume Quiz
                                </button>
                            )}
                            
                            {status.status === 'completed' && (
                                <button onClick={() => handleQuizAction(quiz)} className="btn-info">
                                    View Results
                                </button>
                            )}
                            
                            {status.availability_status === 'not_yet_available' && (
                                <span className="text-muted">Available from: {new Date(quiz.quiz_meta_data.available_from).toLocaleDateString()}</span>
                            )}
                            
                            {status.availability_status === 'expired' && (
                                <span className="text-muted">Deadline passed</span>
                            )}
                        </div>
                        
                        <div className="quiz-meta">
                            <small>Attempts: {status.attempts_made}/{status.max_attempts}</small>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StudentQuizList;
```

## Error Responses

### 400 Bad Request
```json
{
    "success": false,
    "message": "Student ID is required"
}
```

### 401 Unauthorized
```json
{
    "success": false,
    "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Class not found"
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "message": "Internal server error"
}
```

## Frontend Implementation Guidelines

### 1. UI States for Different Statuses

```css
.quiz-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

.badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
}

.badge.green { background: #d4edda; color: #155724; }
.badge.blue { background: #cce5ff; color: #004085; }
.badge.gray { background: #f8f9fa; color: #6c757d; }
.badge.red { background: #f8d7da; color: #721c24; }

.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-info { background: #17a2b8; color: white; }
```

### 2. Progress Tracking

```javascript
const calculateProgress = (quizzes) => {
    const total = quizzes.length;
    const completed = quizzes.filter(q => q.student_status.status === 'completed').length;
    const inProgress = quizzes.filter(q => q.student_status.status === 'in_progress').length;
    
    return {
        total,
        completed,
        inProgress,
        notStarted: total - completed - inProgress,
        completionRate: (completed / total) * 100
    };
};
```

### 3. Filtering and Sorting

```javascript
const filterQuizzes = (quizzes, filter) => {
    switch(filter) {
        case 'pending':
            return quizzes.filter(q => q.student_status.status === 'not_attempted');
        case 'completed':
            return quizzes.filter(q => q.student_status.status === 'completed');
        case 'in_progress':
            return quizzes.filter(q => q.student_status.status === 'in_progress');
        default:
            return quizzes;
    }
};

const sortQuizzes = (quizzes, sortBy) => {
    return [...quizzes].sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.quiz_name.localeCompare(b.quiz_name);
            case 'status':
                return a.student_status.status.localeCompare(b.student_status.status);
            case 'date':
                return new Date(b.created_at) - new Date(a.created_at);
            default:
                return 0;
        }
    });
};
```

This API provides everything needed to create a comprehensive student quiz dashboard with full visibility into quiz status and progress.
