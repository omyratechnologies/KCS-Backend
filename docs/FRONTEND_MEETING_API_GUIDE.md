# Meeting REST API Integration Guide for Frontend Developers

**Version:** 1.0.0  
**Last Updated:** November 3, 2025  
**Backend Framework:** Hono.js + TypeScript  
**Base URL:** `https://your-domain.com/api/meeting`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Examples](#request-response-examples)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)

---

## Overview

The Meeting API provides comprehensive REST endpoints for managing video conferencing meetings in the KCS platform. It supports:

- **Meeting Types:** Scheduled, Instant, Recurring
- **Max Participants:** Up to 10,000 concurrent users
- **Features:** Video, Audio, Screen Sharing, Chat, Recording, Whiteboard, Hand Raise
- **Security:** JWT authentication, campus isolation, role-based access control
- **Analytics:** Real-time statistics, connection quality monitoring

---

## Authentication

All API requests require JWT authentication via headers:

```javascript
const headers = {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
};
```

The JWT token should contain:
- `user_id`: User's unique identifier
- `campus_id`: Campus identifier for data isolation
- `role`: User role (admin, teacher, student, etc.)

---

## API Endpoints

### 1. Create Meeting

**Endpoint:** `POST /meeting`

Creates a new meeting with enhanced real-time features.

**Request Body:**

```typescript
{
  // Required fields
  meeting_name: string;
  meeting_description: string;
  meeting_start_time: string; // ISO 8601 format
  meeting_end_time: string;   // ISO 8601 format
  meeting_location: string;
  participants: string[];     // Array of user IDs
  meeting_meta_data: object;
  
  // Optional enhanced features
  meeting_type?: "scheduled" | "instant" | "recurring";
  max_participants?: number; // Default: 100, Max: 10,000
  waiting_room_enabled?: boolean;
  require_host_approval?: boolean;
  
  features?: {
    video_enabled?: boolean;
    audio_enabled?: boolean;
    screen_sharing_enabled?: boolean;
    chat_enabled?: boolean;
    recording_enabled?: boolean;
    breakout_rooms_enabled?: boolean;
    whiteboard_enabled?: boolean;
    hand_raise_enabled?: boolean;
  };
  
  recording_config?: {
    auto_record?: boolean;
    record_video?: boolean;
    record_audio?: boolean;
    record_chat?: boolean;
    storage_location?: "local" | "cloud";
    retention_days?: number; // 1-365 days
  };
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "meeting_abc123xyz",
    "campus_id": "campus_001",
    "creator_id": "user_123",
    "meeting_name": "Weekly Staff Meeting",
    "meeting_room_id": "room_xyz789",
    "meeting_type": "scheduled",
    "meeting_status": "scheduled",
    "max_participants": 100,
    "current_participants": [],
    "waiting_room_enabled": false,
    "require_host_approval": false,
    "features": {
      "video_enabled": true,
      "audio_enabled": true,
      "screen_sharing_enabled": true,
      "chat_enabled": true,
      "recording_enabled": false,
      "breakout_rooms_enabled": false,
      "whiteboard_enabled": false,
      "hand_raise_enabled": true
    },
    "webrtc_config": {
      "ice_servers": [
        { "urls": ["stun:stun.l.google.com:19302"] },
        { "urls": ["stun:stun1.l.google.com:19302"] }
      ],
      "media_constraints": {
        "video": {
          "enabled": true,
          "quality": "medium",
          "frameRate": 30
        },
        "audio": {
          "enabled": true,
          "noise_suppression": true,
          "echo_cancellation": true
        }
      }
    },
    "created_at": "2025-11-03T10:00:00Z",
    "updated_at": "2025-11-03T10:00:00Z"
  },
  "message": "Scheduled meeting created successfully"
}
```

**Example Usage:**

```javascript
async function createMeeting() {
  const response = await fetch('https://api.example.com/meeting', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meeting_name: "Team Standup",
      meeting_description: "Daily team sync",
      meeting_start_time: "2025-11-04T09:00:00Z",
      meeting_end_time: "2025-11-04T09:30:00Z",
      meeting_location: "Virtual",
      participants: ["user_001", "user_002", "user_003"],
      meeting_meta_data: { department: "Engineering" },
      meeting_type: "scheduled",
      max_participants: 50,
      features: {
        video_enabled: true,
        audio_enabled: true,
        screen_sharing_enabled: true,
        chat_enabled: true,
        recording_enabled: true
      }
    })
  });
  
  const data = await response.json();
  return data;
}
```

---

### 2. Get All Meetings

**Endpoint:** `GET /meeting`

Retrieves all meetings where the authenticated user is either creator or participant.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "meeting_abc123",
      "meeting_name": "Weekly Staff Meeting",
      "meeting_status": "scheduled",
      "meeting_start_time": "2025-11-04T10:00:00Z",
      "current_participants": ["user_001", "user_002"],
      "max_participants": 100
    }
  ],
  "count": 1
}
```

---

### 3. Get Meeting by ID

**Endpoint:** `GET /meeting/:meeting_id`

Retrieves detailed information about a specific meeting.

**Security:** Validates that the user has access (is creator or participant).

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "meeting_abc123",
    "meeting_name": "Team Meeting",
    "meeting_status": "live",
    "current_participants": ["user_001", "user_002"],
    "analytics": {
      "total_duration_minutes": 45,
      "peak_participants": 8,
      "total_participants_joined": 10,
      "connection_quality_avg": 3.5,
      "chat_messages_count": 25,
      "screen_shares_count": 2
    },
    "liveStats": {
      "activeParticipants": 8,
      "producers": 16,
      "consumers": 112,
      "bitrate": {
        "incoming": 2500000,
        "outgoing": 1800000
      }
    }
  }
}
```

**Error Responses:**

```json
// 403 Forbidden
{
  "success": false,
  "message": "Access denied - you are not a participant in this meeting"
}

// 404 Not Found
{
  "success": false,
  "message": "Meeting not found"
}
```

---

### 4. Update Meeting

**Endpoint:** `PUT /meeting/:meeting_id`

Updates meeting details. Only the creator can update meetings.

**Request Body:**

```typescript
{
  meeting_name?: string;
  meeting_description?: string;
  meeting_start_time?: string;
  meeting_end_time?: string;
  participants?: string[];
  meeting_meta_data?: object;
  is_active?: boolean;
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "meeting_abc123",
    "meeting_name": "Updated Meeting Name",
    "updated_at": "2025-11-03T10:30:00Z"
  }
}
```

---

### 5. Delete Meeting

**Endpoint:** `DELETE /meeting/:meeting_id`

Soft deletes a meeting (sets `is_deleted: true`). Only the creator can delete.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "meeting_abc123",
    "is_deleted": true,
    "updated_at": "2025-11-03T10:45:00Z"
  }
}
```

---

### 6. Start Meeting

**Endpoint:** `POST /meeting/:meeting_id/start`

Starts a scheduled meeting (changes status from "scheduled" to "live").

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "meeting_abc123",
    "meeting_status": "live",
    "meeting_room_id": "room_xyz789",
    "webrtc_config": {
      "ice_servers": [...]
    }
  }
}
```

---

### 7. End Meeting

**Endpoint:** `POST /meeting/:meeting_id/end`

Ends a live meeting (changes status to "ended").

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "meeting_abc123",
    "meeting_status": "ended",
    "analytics": {
      "total_duration_minutes": 65,
      "peak_participants": 12,
      "total_participants_joined": 15
    }
  }
}
```

---

### 8. Join Meeting

**Endpoint:** `POST /meeting/:meeting_id/join`

Validates that the user can join the meeting. Returns meeting details needed for WebRTC connection.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "meeting": {
      "id": "meeting_abc123",
      "meeting_name": "Team Meeting",
      "meeting_room_id": "room_xyz789",
      "features": {
        "video_enabled": true,
        "audio_enabled": true,
        "screen_sharing_enabled": true,
        "chat_enabled": true
      },
      "webrtc_config": {
        "ice_servers": [
          { "urls": ["stun:stun.l.google.com:19302"] }
        ],
        "media_constraints": {
          "video": {
            "enabled": true,
            "quality": "medium",
            "frameRate": 30
          },
          "audio": {
            "enabled": true,
            "noise_suppression": true,
            "echo_cancellation": true
          }
        }
      }
    },
    "participant": {
      "id": "participant_xyz",
      "user_id": "user_123",
      "permissions": {
        "can_share_screen": true,
        "can_use_chat": true,
        "can_use_whiteboard": true,
        "is_moderator": false,
        "is_host": false
      }
    }
  }
}
```

**Error Responses:**

```json
// Meeting Full
{
  "success": false,
  "message": "Meeting is full"
}

// Meeting Ended
{
  "success": false,
  "message": "Meeting has ended"
}

// Access Denied
{
  "success": false,
  "message": "Access denied"
}
```

---

### 9. Get Meeting Participants

**Endpoint:** `GET /meeting/:meeting_id/participants`

Retrieves all participants in a meeting with their connection status.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "participant_001",
      "user_id": "user_123",
      "participant_name": "John Doe",
      "connection_status": "connected",
      "connection_quality": "excellent",
      "joined_at": "2025-11-03T10:00:00Z",
      "media_status": {
        "video_enabled": true,
        "audio_enabled": true,
        "screen_sharing": false,
        "is_speaking": false,
        "is_muted_by_host": false
      },
      "permissions": {
        "can_share_screen": true,
        "can_use_chat": true,
        "can_use_whiteboard": true,
        "is_moderator": false,
        "is_host": true
      }
    }
  ]
}
```

---

### 10. Get Meeting Chat History

**Endpoint:** `GET /meeting/:meeting_id/chat`

Retrieves chat message history for a meeting.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg_001",
      "meeting_id": "meeting_abc123",
      "sender_id": "user_123",
      "sender_name": "John Doe",
      "message": "Hello everyone!",
      "message_type": "text",
      "recipient_type": "all",
      "timestamp": "2025-11-03T10:05:00Z",
      "is_deleted": false
    }
  ]
}
```

---

### 11. Get Meeting Recordings

**Endpoint:** `GET /meeting/:meeting_id/recordings`

Retrieves all recordings for a meeting.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "recording_001",
      "meeting_id": "meeting_abc123",
      "recording_type": "video",
      "file_path": "/recordings/meeting_abc123_001.mp4",
      "file_size_bytes": 157286400,
      "duration_seconds": 3600,
      "format": "mp4",
      "quality": "720p",
      "started_at": "2025-11-03T10:00:00Z",
      "ended_at": "2025-11-03T11:00:00Z",
      "is_available": true,
      "download_count": 5
    }
  ]
}
```

---

### 12. Get Meeting Analytics

**Endpoint:** `GET /meeting/:meeting_id/analytics`

Retrieves comprehensive analytics for a meeting.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "meeting_id": "meeting_abc123",
    "analytics": {
      "total_duration_minutes": 65,
      "peak_participants": 12,
      "total_participants_joined": 15,
      "connection_quality_avg": 3.5,
      "chat_messages_count": 45,
      "screen_shares_count": 3
    },
    "participant_analytics": [
      {
        "user_id": "user_123",
        "participant_name": "John Doe",
        "total_time_minutes": 60,
        "connection_quality_avg": 4.0,
        "messages_sent": 8,
        "screen_shares": 1
      }
    ]
  }
}
```

---

### 13. Get WebRTC Configuration

**Endpoint:** `GET /meeting/:meeting_id/webrtc-config`

Retrieves WebRTC configuration including ICE servers and media constraints.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "meeting_id": "meeting_abc123",
    "webrtc_config": {
      "ice_servers": [
        {
          "urls": ["stun:stun.l.google.com:19302"]
        },
        {
          "urls": ["stun:stun1.l.google.com:19302"]
        },
        {
          "urls": ["turn:turn.example.com:3478"],
          "username": "user",
          "credential": "pass"
        }
      ],
      "media_constraints": {
        "video": {
          "enabled": true,
          "quality": "medium",
          "frameRate": 30
        },
        "audio": {
          "enabled": true,
          "noise_suppression": true,
          "echo_cancellation": true
        }
      }
    }
  }
}
```

---

### 14. Get Live Meeting Statistics

**Endpoint:** `GET /meeting/:meeting_id/live-stats`

Retrieves real-time statistics for a live meeting.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "meeting_id": "meeting_abc123",
    "timestamp": "2025-11-03T10:30:00Z",
    "active_participants": 8,
    "producers": 16,
    "consumers": 112,
    "bitrate": {
      "incoming": 2500000,
      "outgoing": 1800000
    },
    "quality_stats": {
      "average_rtt": 45,
      "packet_loss_rate": 0.02,
      "jitter": 12
    }
  }
}
```

---

### 15. Add Participants (Microsoft Teams-style)

**Endpoint:** `POST /meeting/:id/participants`

Add people to meeting during or before the meeting (like Microsoft Teams).

**Request Body:**

```typescript
{
  participants: Array<{
    user_id?: string;
    email?: string;
    name?: string;
    phone?: string;
    role?: "host" | "co_host" | "presenter" | "attendee";
  }>;
  send_invitation?: boolean;
  invitation_message?: string;
  participant_role?: "host" | "co_host" | "presenter" | "attendee";
  notify_existing_participants?: boolean;
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "added_count": 3,
    "participants": [
      {
        "user_id": "user_456",
        "participant_name": "Jane Smith",
        "role": "attendee",
        "invitation_sent": true
      }
    ]
  }
}
```

---

### 16. Remove Participants

**Endpoint:** `DELETE /meeting/:id/participants`

Remove people from meeting (host/co-host only).

**Request Body:**

```typescript
{
  participant_ids: string[];
  notify_removed_participants?: boolean;
  notify_existing_participants?: boolean;
  reason?: string;
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "removed_count": 2,
    "participants_removed": ["participant_001", "participant_002"]
  }
}
```

---

### 17. Update Participant Role

**Endpoint:** `PATCH /meeting/:id/participants/:participant_id/role`

Change participant role and permissions (host only).

**Request Body:**

```typescript
{
  new_role: "host" | "co_host" | "presenter" | "attendee";
  permissions?: {
    can_share_screen?: boolean;
    can_unmute_others?: boolean;
    can_manage_participants?: boolean;
    can_record?: boolean;
    can_manage_breakout_rooms?: boolean;
  };
  notify_participant?: boolean;
  notify_others?: boolean;
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "participant_id": "participant_001",
    "new_role": "co_host",
    "permissions": {
      "can_share_screen": true,
      "can_unmute_others": true,
      "can_manage_participants": true,
      "can_record": true,
      "can_manage_breakout_rooms": true
    }
  }
}
```

---

### 18. Search Users to Add

**Endpoint:** `POST /meeting/:id/search-users`

Search campus directory to find people to add (like Microsoft Teams).

**Request Body:**

```typescript
{
  query: string;
  exclude_current_participants?: boolean;
  limit?: number;
  user_types?: string[];
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": "user_789",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "role": "teacher",
        "department": "Science"
      }
    ],
    "total": 15,
    "limit": 10
  }
}
```

---

### 19. Get System Statistics

**Endpoint:** `GET /meeting/system/stats`

Retrieves system-wide meeting statistics (admin only).

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total_meetings": 1250,
    "active_meetings": 45,
    "total_participants_online": 380,
    "webrtc_stats": {
      "available": true,
      "workers": 4,
      "routers": 45,
      "active_rooms": 45
    },
    "performance": {
      "avg_connection_quality": 3.8,
      "avg_bitrate_mbps": 2.5,
      "cpu_usage": 45,
      "memory_usage": 62
    }
  }
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common HTTP Status Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Common Error Codes

```javascript
const ERROR_CODES = {
  MEETING_NOT_FOUND: "Meeting not found",
  ACCESS_DENIED: "Access denied",
  MEETING_FULL: "Meeting is full",
  MEETING_ENDED: "Meeting has ended",
  INVALID_MEETING_TIME: "Meeting end time must be after start time",
  UNAUTHORIZED_RECORDING: "Only hosts and moderators can control recording",
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded. Please slow down.",
  AUTHENTICATION_REQUIRED: "Authentication required"
};
```

### Error Handling Example

```javascript
async function handleMeetingAPI() {
  try {
    const response = await fetch('https://api.example.com/meeting/abc123', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific errors
      switch (response.status) {
        case 401:
          console.error('Not authenticated');
          // Redirect to login
          break;
        case 403:
          console.error('Access denied:', data.message);
          break;
        case 404:
          console.error('Meeting not found');
          break;
        case 429:
          console.error('Rate limit exceeded');
          // Implement retry with exponential backoff
          break;
        default:
          console.error('API error:', data.message);
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

---

## Rate Limiting

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| General API | 100 requests/minute per user |
| Meeting Creation | 10 requests/minute per user |
| Join Meeting | 20 requests/minute per user |
| Participant Management | 30 requests/minute per user |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699012800
```

### Handling Rate Limits

```javascript
async function apiWithRateLimit(url, options) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const waitTime = (resetTime * 1000) - Date.now();
    
    console.log(`Rate limited. Retry after ${waitTime}ms`);
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return apiWithRateLimit(url, options);
  }
  
  return response.json();
}
```

---

## Best Practices

### 1. Connection Management

```javascript
// Always check meeting status before joining
async function joinMeetingFlow(meetingId) {
  // Step 1: Get meeting details
  const meeting = await fetch(`/meeting/${meetingId}`);
  
  if (meeting.data.meeting_status !== 'live') {
    console.error('Meeting is not live');
    return;
  }
  
  // Step 2: Validate join access
  const joinResponse = await fetch(`/meeting/${meetingId}/join`, {
    method: 'POST'
  });
  
  if (!joinResponse.success) {
    console.error('Cannot join:', joinResponse.message);
    return;
  }
  
  // Step 3: Initialize WebRTC with returned config
  initializeWebRTC(joinResponse.data);
}
```

### 2. Polling for Live Stats

```javascript
// Poll live stats every 5 seconds for active meetings
function startLiveStatsPolling(meetingId) {
  const intervalId = setInterval(async () => {
    const stats = await fetch(`/meeting/${meetingId}/live-stats`);
    
    if (stats.success) {
      updateUI(stats.data);
    }
  }, 5000);
  
  // Clean up when leaving meeting
  return () => clearInterval(intervalId);
}
```

### 3. Optimistic UI Updates

```javascript
// Update UI immediately, sync with server
async function updateMeetingOptimistic(meetingId, updates) {
  // Update UI immediately
  updateLocalState(updates);
  
  try {
    // Sync with server
    const response = await fetch(`/meeting/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      // Rollback on failure
      rollbackLocalState();
    }
  } catch (error) {
    rollbackLocalState();
  }
}
```

### 4. Batch Operations

```javascript
// Add multiple participants in one request
async function addMultipleParticipants(meetingId, userIds) {
  const participants = userIds.map(id => ({ user_id: id }));
  
  return fetch(`/meeting/${meetingId}/participants`, {
    method: 'POST',
    body: JSON.stringify({
      participants,
      send_invitation: true,
      notify_existing_participants: true
    })
  });
}
```

### 5. Error Recovery

```javascript
// Implement exponential backoff for retries
async function apiWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response.json();
      }
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      // Retry server errors (5xx) with exponential backoff
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### 6. TypeScript Integration

```typescript
// Define interfaces for type safety
interface Meeting {
  id: string;
  campus_id: string;
  creator_id: string;
  meeting_name: string;
  meeting_status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  max_participants: number;
  current_participants: string[];
  features: MeetingFeatures;
  webrtc_config: WebRTCConfig;
}

interface MeetingFeatures {
  video_enabled: boolean;
  audio_enabled: boolean;
  screen_sharing_enabled: boolean;
  chat_enabled: boolean;
  recording_enabled: boolean;
  breakout_rooms_enabled: boolean;
  whiteboard_enabled: boolean;
  hand_raise_enabled: boolean;
}

interface WebRTCConfig {
  ice_servers: RTCIceServer[];
  media_constraints: {
    video: VideoConstraints;
    audio: AudioConstraints;
  };
}

// Type-safe API calls
async function getMeeting(meetingId: string): Promise<Meeting> {
  const response = await fetch(`/meeting/${meetingId}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data as Meeting;
}
```

---

## Summary

This API provides comprehensive meeting management with:

✅ **20 REST endpoints** for complete meeting lifecycle  
✅ **Real-time statistics** and analytics  
✅ **Role-based access control** (host, co-host, presenter, attendee)  
✅ **Campus isolation** for multi-tenant security  
✅ **Rate limiting** to prevent abuse  
✅ **WebRTC configuration** for video/audio streaming  
✅ **Recording management** with cloud storage  
✅ **Microsoft Teams-style** participant management  

For real-time features (video, audio, chat), see the **WebSocket/WebRTC Integration Guide**.

---

**Need Help?**
- API Issues: Check error codes and status codes
- Rate Limits: Implement exponential backoff
- Authentication: Ensure valid JWT token in headers
- WebRTC: See companion WebSocket guide

**Last Updated:** November 3, 2025
