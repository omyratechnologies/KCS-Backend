# Quiz Timeout and Auto-Save Documentation

## Overview
The quiz system now includes comprehensive timeout handling and auto-save functionality to ensure students don't lose their progress when time expires.

## Key Features

### 1. Automatic Answer Saving
- **All answers are saved immediately** when submitted via `submitAnswer`
- **No answers are lost** when timeout occurs
- **Progress is preserved** throughout the quiz session

### 2. Timeout Handling
- **Automatic submission** when time expires
- **Grace period** handling for network delays
- **Background monitoring** of expired sessions
- **Audit logging** of auto-submissions

### 3. Session States
- `in_progress` - Quiz is active and student can submit answers
- `completed` - Quiz submitted normally by student
- `expired` - Quiz auto-submitted due to timeout
- `abandoned` - Quiz manually abandoned by student

## Implementation

### Background Service Integration

Add this to your main application startup (e.g., `src/index.ts` or `src/app/index.ts`):

```typescript
import { QuizBackgroundService } from '@/utils/quiz-background.service';

// Start the background service when your app starts
QuizBackgroundService.start(1); // Check every 1 minute

// Graceful shutdown
process.on('SIGTERM', () => {
    QuizBackgroundService.stop();
    // ... other cleanup
});

process.on('SIGINT', () => {
    QuizBackgroundService.stop();
    // ... other cleanup
});
```

### API Endpoints

#### New Timeout-Related Endpoints:
```
POST   /api/class-quiz/admin/check-expired-sessions    # Manual check for expired sessions (admin)
GET    /api/class-quiz/session/history                 # Get user's session history
POST   /api/class-quiz/session/:token/abandon          # Manually abandon session
```

### Quiz Flow with Timeout Protection

```javascript
// 1. Start Quiz (same as before)
const response = await fetch('/api/class-quiz/session/class123/quiz456/start', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer <token>' }
});

// 2. Submit Answers (now with timeout protection)
const submitAnswer = async (questionId, answer) => {
    try {
        const response = await fetch(`/api/class-quiz/session/${sessionToken}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id: questionId,
                answer: answer
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            
            // Handle timeout scenarios
            if (error.message.includes('expired and has been auto-submitted')) {
                alert('Time has expired! Your answers have been automatically saved and submitted.');
                // Redirect to results page
                window.location.href = '/quiz-results';
                return;
            }
            
            throw new Error(error.message);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error submitting answer:', error);
        // Handle network errors gracefully
    }
};

// 3. Monitor Time Remaining
const monitorTimeRemaining = (sessionData) => {
    if (sessionData.time_remaining_seconds > 0) {
        // Update UI with remaining time
        updateTimerDisplay(sessionData.time_remaining_seconds);
        
        // Warn user when time is running low
        if (sessionData.time_remaining_seconds <= 300) { // 5 minutes
            showTimeWarning('Only 5 minutes remaining!');
        }
        
        if (sessionData.time_remaining_seconds <= 60) { // 1 minute
            showTimeWarning('Only 1 minute remaining!');
        }
    }
};

// 4. Complete Quiz (handles timeout gracefully)
const completeQuiz = async () => {
    try {
        const response = await fetch(`/api/class-quiz/session/${sessionToken}/complete`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show results
            showQuizResults(result.data);
        }
    } catch (error) {
        // If completion fails due to timeout, the background service will handle it
        console.error('Error completing quiz:', error);
    }
};
```

## Database Schema Changes

### Enhanced `class_quiz_submission` metadata:
```javascript
{
    time_taken_seconds: 1800,
    percentage: 85.5,
    total_questions: 20,
    auto_submitted: true,      // NEW: Indicates auto-submission
    timeout_submission: true,  // NEW: Indicates timeout scenario
    answered_questions: 18     // NEW: Number of questions answered
}
```

### Enhanced `class_quiz_session` metadata:
```javascript
{
    question_order: ["q1", "q2", "q3"],
    quiz_settings: { time_limit_minutes: 30 },
    auto_submitted: true,      // NEW: Auto-submission flag
    timeout_submission: true   // NEW: Timeout flag
}
```

## Error Handling

The system provides clear error messages for different timeout scenarios:

1. **During Answer Submission:**
   ```
   "Quiz session has expired and has been auto-submitted. Your previous answers have been saved."
   ```

2. **When Accessing Expired Session:**
   ```
   "Quiz session has expired and has been auto-submitted"
   ```

3. **When Trying to Complete Expired Quiz:**
   ```
   "Quiz already completed"
   ```

## Monitoring and Logging

### Background Service Logs:
```
[2025-06-28T15:30:00.000Z] Auto-submitted 3 expired quiz sessions
  - User user123: Quiz quiz456, Score: 15/20
  - User user789: Quiz quiz456, Score: 18/20
  - User user456: Quiz quiz789, Score: 12/15
```

### Admin Endpoint Response:
```json
{
    "success": true,
    "message": "Processed 3 expired sessions",
    "data": [
        {
            "session_id": "session123",
            "user_id": "user123", 
            "quiz_id": "quiz456",
            "result": {
                "score": 15,
                "total_questions": 20,
                "percentage": 75,
                "time_taken_seconds": 1800
            }
        }
    ]
}
```

## Best Practices

1. **Always run the background service** in production
2. **Set appropriate check intervals** (1-2 minutes recommended)
3. **Monitor logs** for auto-submissions
4. **Provide clear UI feedback** about time remaining
5. **Handle network failures gracefully** on the frontend
6. **Use the admin endpoint** for manual checks during maintenance

## Security Considerations

- Background service only processes truly expired sessions
- Session tokens prevent unauthorized access
- Auto-submissions are clearly marked in the database
- Audit trail maintained for all timeout events

The system now ensures **no student loses their progress** due to timeout, providing a robust and reliable quiz experience.
