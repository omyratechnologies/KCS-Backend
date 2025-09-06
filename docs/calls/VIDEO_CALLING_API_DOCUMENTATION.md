# Video Calling API Documentation

## Overview
This document describes the video calling API endpoints integrated with GetStream.io for the KCS Backend. The system supports both audio-only and video calls with role-based permissions.

## Environment Setup
Before using the video calling features, ensure these environment variables are configured:

```bash
GETSTREAM_API_KEY=your_getstream_api_key
GETSTREAM_API_SECRET=your_getstream_api_secret
```

## Authentication
All video calling endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Create Audio Call
**POST** `/api/video-calls/audio`

Creates an audio-only call between participants.

**Request Body:**
```json
{
    "participants": [
        {
            "user_id": "participant_user_id",
            "name": "Participant Name",
            "role": "participant"
        }
    ],
    "recording_enabled": false
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "call": {
            "id": "call_uuid",
            "call_id": "call_1234567890_abcdef",
            "campus_id": "campus_id",
            "call_type": "audio",
            "caller_id": "caller_user_id",
            "participants": ["caller_id", "participant_id"],
            "call_status": "created",
            "call_settings": {
                "audio_enabled": true,
                "video_enabled": false,
                "screen_sharing_enabled": false,
                "recording_enabled": false
            }
        },
        "tokens": [
            {
                "token": "jwt_token_for_participant_1",
                "call_id": "call_1234567890_abcdef",
                "user_id": "user_id_1",
                "expires_at": "2025-09-01T12:00:00Z"
            }
        ]
    },
    "message": "Audio call created successfully"
}
```

### 2. Create Video Call
**POST** `/api/video-calls/video`

Creates a video call with audio between participants.

**Request Body:**
```json
{
    "participants": [
        {
            "user_id": "participant_user_id",
            "name": "Participant Name",
            "role": "participant"
        }
    ],
    "screen_sharing_enabled": false,
    "recording_enabled": false
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "call": {
            "id": "call_uuid",
            "call_id": "call_1234567890_abcdef",
            "campus_id": "campus_id",
            "call_type": "video",
            "caller_id": "caller_user_id",
            "participants": ["caller_id", "participant_id"],
            "call_status": "created",
            "call_settings": {
                "audio_enabled": true,
                "video_enabled": true,
                "screen_sharing_enabled": false,
                "recording_enabled": false
            }
        },
        "tokens": [...]
    },
    "message": "Video call created successfully"
}
```

### 3. Create Generic Call
**POST** `/api/video-calls`

Creates a call with specified type (audio or video).

**Request Body:**
```json
{
    "participants": [
        {
            "user_id": "participant_user_id",
            "name": "Participant Name",
            "role": "participant"
        }
    ],
    "call_type": "audio", // or "video"
    "screen_sharing_enabled": false,
    "recording_enabled": false
}
```

### 4. Join Call
**POST** `/api/video-calls/:call_id/join`

Join an existing call as a participant.

**Response:**
```json
{
    "success": true,
    "data": {
        "token": "jwt_token_for_user",
        "call": {
            "call_id": "call_1234567890_abcdef",
            "call_type": "video",
            "call_status": "created",
            "participants": ["caller_id", "participant_id"]
        }
    }
}
```

### 5. End Call
**POST** `/api/video-calls/:call_id/end`

End an ongoing call (only participants can end calls).

**Response:**
```json
{
    "success": true,
    "message": "Call ended successfully"
}
```

### 6. Get Call History
**GET** `/api/video-calls/history`

Get call history for the authenticated user.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by call status

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "call_id": "call_1234567890_abcdef",
            "call_type": "video",
            "call_status": "ended",
            "duration": 300,
            "started_at": "2025-08-31T10:00:00Z",
            "ended_at": "2025-08-31T10:05:00Z",
            "participants": ["user1", "user2"]
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 15
    }
}
```

### 7. Get Call Details
**GET** `/api/video-calls/:call_id`

Get details of a specific call.

**Response:**
```json
{
    "success": true,
    "data": {
        "call": {
            "call_id": "call_1234567890_abcdef",
            "call_type": "video",
            "call_status": "created",
            "participants": ["caller_id", "participant_id"],
            "call_settings": {
                "audio_enabled": true,
                "video_enabled": true,
                "screen_sharing_enabled": false
            }
        }
    }
}
```

### 8. Update Call Status (Webhook/Internal)
**POST** `/api/video-calls/:call_id/status`

Update call status (typically used by webhooks or client-side updates).

**Request Body:**
```json
{
    "status": "ongoing", // "ongoing" | "ended" | "missed" | "rejected"
    "metadata": {
        "end_reason": "normal",
        "quality_score": 4.5
    }
}
```

## Permission System

The video calling system integrates with the existing contact permission system:

### Teachers
- Can call any student in their campus
- Can call other teachers in their campus
- Can call admins and super admins

### Students
- Can call teachers in their campus
- Can call classmates (students in same class)
- Cannot call students from other classes directly

### Admins/Super Admins
- Can call anyone in their campus
- Have full access to all calling features

## Call Types

### Audio Calls
- Audio-only communication
- No video stream
- No screen sharing capability
- Lower bandwidth usage
- Ideal for voice discussions

### Video Calls
- Audio + video communication
- Camera enabled by default
- Optional screen sharing
- Higher bandwidth usage
- Full multimedia experience

## Integration with Frontend

### For Audio Calls:
```javascript
// Create audio call
const response = await fetch('/api/video-calls/audio', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        participants: [{
            user_id: 'target_user_id',
            name: 'Target User Name'
        }],
        recording_enabled: false
    })
});
```

### For Video Calls:
```javascript
// Create video call
const response = await fetch('/api/video-calls/video', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        participants: [{
            user_id: 'target_user_id',
            name: 'Target User Name'
        }],
        screen_sharing_enabled: true,
        recording_enabled: false
    })
});
```

## Error Responses

All endpoints return consistent error responses:

```json
{
    "success": false,
    "error": "Error message description"
}
```

Common error codes:
- `400` - Bad request (validation errors)
- `401` - Authentication required
- `403` - Permission denied
- `404` - Resource not found
- `500` - Internal server error

## GetStream Token Usage

Each participant receives a JWT token that must be used with the GetStream SDK:

```javascript
// Example GetStream client initialization (frontend)
import { StreamVideoClient } from '@stream-io/video-react-sdk';

const client = new StreamVideoClient({
    apiKey: 'your_getstream_api_key',
    user: { id: 'user_id' },
    token: 'jwt_token_from_api'
});

const call = client.call('default', 'call_id');
await call.join();
```

## Notes

1. **Call IDs**: Each call gets a unique ID in format `call_{timestamp}_{random}`
2. **Token Expiry**: JWT tokens expire after 24 hours
3. **Permissions**: All calls respect existing contact permission system
4. **Personal Rooms**: For 1:1 calls, the system tries to associate with existing personal chat rooms
5. **Campus Isolation**: All calls are isolated per campus
