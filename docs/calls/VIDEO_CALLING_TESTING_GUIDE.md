# Video Calling API Testing Guide

This guide demonstrates how to test the new video calling endpoints with practical examples.

## Prerequisites

1. Ensure you have GetStream credentials configured:
```bash
export GETSTREAM_API_KEY="your_api_key"
export GETSTREAM_API_SECRET="your_api_secret"
```

2. Have a valid JWT token for authentication
3. Know the user IDs and campus ID for testing

## Testing Audio Calls

### 1. Create an Audio Call

```bash
# Create an audio call between two users
curl -X POST "http://localhost:3000/api/video-calls/audio" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "user_id": "target_user_id",
        "name": "John Doe",
        "role": "participant"
      }
    ],
    "recording_enabled": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "call": {
      "call_id": "call_1725097200_abc123",
      "call_type": "audio",
      "call_status": "created",
      "call_settings": {
        "audio_enabled": true,
        "video_enabled": false,
        "screen_sharing_enabled": false,
        "recording_enabled": false
      }
    },
    "tokens": [...]
  },
  "message": "Audio call created successfully"
}
```

### 2. Join the Audio Call

```bash
# Join the created call using the call_id from above
curl -X POST "http://localhost:3000/api/video-calls/call_1725097200_abc123/join" \
  -H "Authorization: Bearer PARTICIPANT_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Testing Video Calls

### 1. Create a Video Call

```bash
# Create a video call with screen sharing enabled
curl -X POST "http://localhost:3000/api/video-calls/video" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "user_id": "target_user_id",
        "name": "Jane Smith",
        "role": "participant"
      }
    ],
    "screen_sharing_enabled": true,
    "recording_enabled": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "call": {
      "call_id": "call_1725097260_def456",
      "call_type": "video",
      "call_status": "created",
      "call_settings": {
        "audio_enabled": true,
        "video_enabled": true,
        "screen_sharing_enabled": true,
        "recording_enabled": false
      }
    },
    "tokens": [...]
  },
  "message": "Video call created successfully"
}
```

### 2. End a Call

```bash
# End the video call
curl -X POST "http://localhost:3000/api/video-calls/call_1725097260_def456/end" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Testing Generic Call Creation

### Create Call with Explicit Type

```bash
# Create a call using the generic endpoint
curl -X POST "http://localhost:3000/api/video-calls" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "user_id": "target_user_id",
        "name": "Bob Wilson"
      }
    ],
    "call_type": "audio",
    "screen_sharing_enabled": false,
    "recording_enabled": false
  }'
```

## Testing Call History

### Get User's Call History

```bash
# Get call history with pagination
curl -X GET "http://localhost:3000/api/video-calls/history?page=1&limit=10&status=ended" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing Call Details

### Get Specific Call Information

```bash
# Get details of a specific call
curl -X GET "http://localhost:3000/api/video-calls/call_1725097200_abc123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Permission Testing Scenarios

### Test Teacher-Student Call
```bash
# Teacher creates call to student
curl -X POST "http://localhost:3000/api/video-calls/audio" \
  -H "Authorization: Bearer TEACHER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "user_id": "student_user_id",
        "name": "Student Name"
      }
    ]
  }'
```

### Test Student-Teacher Call
```bash
# Student creates call to teacher
curl -X POST "http://localhost:3000/api/video-calls/video" \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "user_id": "teacher_user_id",
        "name": "Teacher Name"
      }
    ]
  }'
```

### Test Unauthorized Call (Should Fail)
```bash
# Student trying to call another student from different class
curl -X POST "http://localhost:3000/api/video-calls/audio" \
  -H "Authorization: Bearer STUDENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": [
      {
        "user_id": "other_student_id",
        "name": "Other Student"
      }
    ]
  }'
```

**Expected Error Response:**
```json
{
  "success": false,
  "error": "Cannot call Other Student: Insufficient permissions"
}
```

## WebSocket Integration (Future Enhancement)

The video calling system can be integrated with existing WebSocket chat functionality for real-time call notifications:

```javascript
// Example WebSocket message for incoming call
{
  "type": "incoming_call",
  "data": {
    "call_id": "call_1725097200_abc123",
    "call_type": "video",
    "caller": {
      "user_id": "caller_id",
      "name": "Caller Name"
    },
    "token": "jwt_token_for_call"
  }
}
```

## Frontend Integration Example

```javascript
// Example React component integration
const initiateAudioCall = async (targetUserId, targetUserName) => {
  try {
    const response = await fetch('/api/video-calls/audio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        participants: [{
          user_id: targetUserId,
          name: targetUserName
        }]
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Initialize GetStream SDK with the returned token
      const { call, tokens } = result.data;
      const userToken = tokens.find(t => t.user_id === currentUserId);
      
      // Set up GetStream call
      initializeGetStreamCall(call.call_id, userToken.token);
    }
  } catch (error) {
    console.error('Failed to create audio call:', error);
  }
};

const initiateVideoCall = async (targetUserId, targetUserName) => {
  // Similar implementation for video calls
  const response = await fetch('/api/video-calls/video', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      participants: [{
        user_id: targetUserId,
        name: targetUserName
      }],
      screen_sharing_enabled: true
    })
  });
  // Handle response...
};
```

## Environment Variables for Testing

```bash
# .env file for testing
GETSTREAM_API_KEY=your_getstream_api_key
GETSTREAM_API_SECRET=your_getstream_api_secret
JWT_SECRET=your_jwt_secret
```

## Common Error Scenarios to Test

1. **Missing Authentication**: Call without JWT token
2. **Invalid Participants**: Empty participants array
3. **Permission Denied**: Student calling unauthorized user
4. **Invalid Call Type**: Using invalid call_type value
5. **Call Not Found**: Joining non-existent call
6. **Campus Mismatch**: Cross-campus call attempts

This completes the video calling implementation with separate audio and video call endpoints, proper permission handling, and comprehensive testing documentation.
