# Meeting API Guide

## Overview

The KCS Meeting System is an enterprise-grade video conferencing platform that supports scheduled meetings, instant meetings, real-time collaboration, and comprehensive participant management. This guide provides clear instructions on how to use all meeting-related APIs.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Meeting Lifecycle](#meeting-lifecycle)
3. [Core APIs](#core-apis)
4. [Participant Management](#participant-management)
5. [Live Meeting Features](#live-meeting-features)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Security & Access Control](#security--access-control)
8. [Email Notifications](#email-notifications)
9. [Best Practices](#best-practices)

---

## Quick Start

### Authentication
All meeting APIs require authentication via JWT token in the header:
```
Authorization: Bearer <your-jwt-token>
```

### Base URL
```
https://your-domain.com/api/meeting
```

---

## Meeting Lifecycle

```
CREATE → SCHEDULED → START → LIVE → END → ENDED
         ↓                    ↓
      UPDATE              PARTICIPANTS
         ↓                JOIN/LEAVE
      CANCEL
```

---

## Core APIs

### 1. Create Meeting

Create a new scheduled or instant meeting.

**Endpoint:** `POST /api/meeting`

**Request Body:**
```json
{
  "meeting_name": "Team Standup",
  "meeting_description": "Daily team sync",
  "meeting_start_time": "2025-10-26T10:00:00Z",
  "meeting_end_time": "2025-10-26T10:30:00Z",
  "meeting_location": "Virtual Room A",
  "participants": ["user_001", "user_002"],
  "meeting_meta_data": {},
  "meeting_type": "scheduled",
  "max_participants": 100,
  "meeting_password": "secure123",
  "waiting_room_enabled": true,
  "features": {
    "video_enabled": true,
    "audio_enabled": true,
    "screen_sharing_enabled": true,
    "chat_enabled": true,
    "recording_enabled": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "meeting_12345",
    "meeting_name": "Team Standup",
    "meeting_status": "scheduled",
    "meeting_room_id": "room_abc123",
    "created_at": "2025-10-25T08:00:00Z"
  },
  "message": "Scheduled meeting created successfully"
}
```

**Use Cases:**
- Schedule recurring team meetings
- Create instant meetings for urgent discussions
- Set up client presentations with password protection
- Configure breakout sessions for training

---

### 2. Get All Meetings

Retrieve all meetings for the authenticated user.

**Endpoint:** `GET /api/meeting`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "meeting_12345",
      "meeting_name": "Team Standup",
      "meeting_status": "scheduled",
      "meeting_start_time": "2025-10-26T10:00:00Z",
      "participants": ["user_001", "user_002"]
    }
  ],
  "count": 1
}
```

**Use Cases:**
- Display user's meeting dashboard
- Show upcoming meetings calendar
- Filter meetings by status or date

---

### 3. Get Meeting Details

Retrieve detailed information about a specific meeting.

**Endpoint:** `GET /api/meeting/:meeting_id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "meeting_12345",
    "meeting_name": "Team Standup",
    "meeting_status": "live",
    "current_participants": ["user_001", "user_002"],
    "features": {
      "video_enabled": true,
      "chat_enabled": true
    },
    "liveStats": {
      "participant_count": 2,
      "duration_minutes": 15,
      "quality_score": 4.8
    }
  }
}
```

**Use Cases:**
- Show meeting lobby/waiting room
- Display real-time participant list
- Monitor meeting quality metrics

---

### 4. Update Meeting

Update meeting details (time, participants, settings).

**Endpoint:** `PUT /api/meeting/:meeting_id`

**Request Body:**
```json
{
  "meeting_name": "Updated Team Standup",
  "meeting_start_time": "2025-10-26T10:30:00Z",
  "participants": ["user_001", "user_002", "user_003"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "meeting_12345",
    "meeting_name": "Updated Team Standup",
    "updated_at": "2025-10-25T09:00:00Z"
  },
  "message": "Meeting updated successfully"
}
```

**Important:**
- Updates trigger email notifications to participants
- Cannot update meetings that have already ended
- Only hosts can update meeting details

---

### 5. Delete Meeting

Cancel and delete a meeting (soft delete).

**Endpoint:** `DELETE /api/meeting/:meeting_id`

**Response:**
```json
{
  "success": true,
  "message": "Meeting deleted successfully"
}
```

**Important:**
- Sends cancellation emails to all participants
- Cannot delete live meetings (must end first)
- Soft delete - data retained for audit

---

## Participant Management

### 6. Get Meeting Participants

Retrieve list of participants in a meeting.

**Endpoint:** `GET /api/meeting/:meeting_id/participants`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "participant_123",
      "user_id": "user_001",
      "name": "John Doe",
      "role": "host",
      "joined_at": "2025-10-26T10:00:00Z",
      "status": "connected",
      "media_status": {
        "audio": true,
        "video": true,
        "screen_share": false
      }
    }
  ],
  "count": 1
}
```

---

### 7. Add Participants (Microsoft Teams Style)

Add new participants to scheduled or live meetings.

**Endpoint:** `POST /api/meeting/:id/participants`

**Request Body:**
```json
{
  "participants": [
    {
      "user_id": "user_456",
      "role": "presenter"
    },
    {
      "email": "newuser@example.com",
      "name": "New User",
      "role": "attendee"
    }
  ],
  "send_invitation": true,
  "invitation_message": "You've been added to the team meeting",
  "notify_existing_participants": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meeting_id": "meeting_12345",
    "participants_added": [
      {
        "id": "participant_456",
        "user_id": "user_456",
        "role": "presenter",
        "status": "invited"
      }
    ],
    "invitations_sent": 2,
    "total_participants": 4
  },
  "message": "2 participants added successfully"
}
```

**Use Cases:**
- Add colleagues during a live meeting
- Invite external participants via email
- Expand team size for collaborative sessions

---

### 8. Remove Participants

Remove participants from a meeting.

**Endpoint:** `DELETE /api/meeting/:id/participants`

**Request Body:**
```json
{
  "participant_ids": ["participant_456", "participant_789"],
  "notify_removed_participants": true,
  "notify_existing_participants": false,
  "reason": "Meeting capacity limit reached"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meeting_id": "meeting_12345",
    "participants_removed": ["participant_456", "participant_789"],
    "remaining_count": 5
  },
  "message": "2 participants removed successfully"
}
```

**Use Cases:**
- Remove disruptive participants
- Manage capacity limits
- End breakout session participation

---

### 9. Update Participant Role

Change participant permissions and roles.

**Endpoint:** `PATCH /api/meeting/:id/participants/:participant_id/role`

**Request Body:**
```json
{
  "new_role": "co_host",
  "permissions": {
    "can_share_screen": true,
    "can_manage_participants": true,
    "can_record": true
  },
  "notify_participant": true,
  "notify_others": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "participant_id": "participant_456",
    "old_role": "attendee",
    "new_role": "co_host",
    "updated_at": "2025-10-26T10:15:00Z"
  },
  "message": "Participant role updated successfully"
}
```

**Roles:**
- **host**: Full control, can end meeting
- **co_host**: Can manage participants and settings
- **presenter**: Can share screen and present
- **attendee**: Basic participation rights

---

### 10. Search Users to Add

Search campus directory to find users to add.

**Endpoint:** `POST /api/meeting/:id/search-users`

**Request Body:**
```json
{
  "query": "john",
  "exclude_current_participants": true,
  "limit": 10,
  "user_types": ["teacher", "student"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "user_789",
      "name": "John Smith",
      "email": "john.smith@example.com",
      "role": "teacher",
      "profile_picture": "https://example.com/avatar.jpg"
    }
  ],
  "total_found": 1
}
```

---

## Live Meeting Features

### 11. Start Meeting

Initiate a scheduled meeting.

**Endpoint:** `POST /api/meeting/:meeting_id/start`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "meeting_12345",
    "status": "live",
    "webrtc_config": {
      "router_id": "router_abc123",
      "ice_servers": [...]
    },
    "live_stats": {
      "start_time": "2025-10-26T10:00:00Z",
      "participant_count": 0
    }
  },
  "message": "Meeting started successfully"
}
```

**Important:**
- Only hosts can start meetings
- Participants receive notifications
- WebRTC configuration is generated

---

### 12. Join Meeting

Validate access and join a meeting.

**Endpoint:** `POST /api/meeting/:meeting_id/join`

**Request Body:**
```json
{
  "meeting_password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meeting": {
      "id": "meeting_12345",
      "name": "Team Standup",
      "status": "live",
      "features": {
        "video_enabled": true,
        "chat_enabled": true
      },
      "current_participants": 3
    },
    "canJoin": true,
    "waitingRoomEnabled": true
  }
}
```

**Validations:**
- Password verification (if enabled)
- Participant limit check
- Waiting room approval

---

### 13. End Meeting

Terminate a live meeting.

**Endpoint:** `POST /api/meeting/:meeting_id/end`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "meeting_12345",
    "status": "ended",
    "final_stats": {
      "duration_minutes": 30,
      "max_participants": 8,
      "total_chat_messages": 25,
      "recording_url": "https://recordings.example.com/meeting_12345"
    }
  },
  "message": "Meeting ended successfully"
}
```

**Important:**
- Only hosts can end meetings
- All participants are disconnected
- Final analytics are generated

---

### 14. Get Chat History

Retrieve meeting chat messages.

**Endpoint:** `GET /api/meeting/:meeting_id/chat?limit=100`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_123",
      "participant_id": "participant_123",
      "participant_name": "John Doe",
      "message": "Hello everyone!",
      "timestamp": "2025-10-26T10:05:00Z",
      "type": "text"
    }
  ],
  "count": 1
}
```

---

### 15. Get Recordings

Access meeting recordings.

**Endpoint:** `GET /api/meeting/:meeting_id/recordings`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "recording_123",
      "type": "video",
      "url": "https://recordings.example.com/meeting_12345.mp4",
      "duration_seconds": 1800,
      "size_mb": 250,
      "created_at": "2025-10-26T10:30:00Z"
    }
  ]
}
```

---

## Analytics & Monitoring

### 16. Get Meeting Analytics

Detailed analytics for a completed meeting.

**Endpoint:** `GET /api/meeting/:meeting_id/analytics`

**Response:**
```json
{
  "success": true,
  "data": {
    "duration_minutes": 30,
    "peak_participants": 8,
    "average_participants": 6,
    "total_chat_messages": 25,
    "screen_share_duration": 15,
    "participant_engagement": {
      "high_engagement": 5,
      "medium_engagement": 2,
      "low_engagement": 1
    }
  }
}
```

---

### 17. Get Live Stats

Real-time statistics during a meeting.

**Endpoint:** `GET /api/meeting/:meeting_id/live-stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "current_participants": 6,
    "duration_minutes": 15,
    "active_speakers": 2,
    "screen_sharing": true,
    "recording_active": true,
    "bandwidth_usage": {
      "total_mbps": 15.5,
      "per_participant_avg": 2.6
    },
    "quality_metrics": {
      "average_video_quality": "720p",
      "connection_quality": "excellent",
      "latency_ms": 45
    }
  }
}
```

---

### 18. Get System Stats (Admin Only)

System-wide meeting statistics.

**Endpoint:** `GET /api/meeting/system/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_meetings": 150,
    "active_meetings": 12,
    "total_participants": 2847,
    "active_participants": 156,
    "mediasoup_workers": {
      "total": 4,
      "active": 4,
      "load_distribution": [25, 30, 22, 28]
    }
  }
}
```

---

### 19. Get WebRTC Config

WebRTC configuration for client-side connection.

**Endpoint:** `GET /api/meeting/:meeting_id/webrtc-config`

**Response:**
```json
{
  "success": true,
  "data": {
    "webrtcConfig": {
      "router_id": "router_abc123",
      "ice_servers": [
        {
          "urls": "stun:stun.example.com:3478"
        }
      ]
    },
    "meetingFeatures": {
      "video_enabled": true,
      "chat_enabled": true
    },
    "maxParticipants": 100
  }
}
```

---

## Security & Access Control

### Password Protection
```json
{
  "meeting_password": "secure123"
}
```

### Waiting Room
```json
{
  "waiting_room_enabled": true,
  "require_host_approval": true
}
```

### Participant Permissions
```json
{
  "permissions": {
    "can_share_screen": true,
    "can_use_chat": true,
    "can_record": false
  }
}
```

---

## Email Notifications

The system automatically sends emails for:

### 1. Meeting Invitations
- Sent when meeting is created
- Includes meeting details and join link
- Calendar integration option

### 2. Meeting Updates
- Sent when time/date/details change
- Shows old vs new information
- Option to decline changes

### 3. Meeting Reminders
- 1 hour before meeting
- 15 minutes before meeting
- 5 minutes before meeting (urgent)

### 4. Meeting Cancellations
- Sent when meeting is deleted
- Includes cancellation reason
- Reschedule options

---

## Best Practices

### 1. Meeting Creation
- Set realistic participant limits
- Enable waiting room for sensitive meetings
- Use password protection for external participants
- Configure features based on meeting type

### 2. Participant Management
- Assign co-hosts for large meetings
- Use roles appropriately (host, presenter, attendee)
- Remove disruptive participants promptly
- Monitor participant count vs capacity

### 3. Security
- Use unique passwords for each meeting
- Enable waiting room for public meetings
- Require host approval for sensitive discussions
- Review participant list before starting

### 4. Performance
- Keep meetings under 100 participants for best performance
- Use separate breakout rooms for large groups
- Monitor connection quality metrics
- Enable recording only when needed

### 5. User Experience
- Send invitations well in advance
- Provide clear meeting descriptions
- Test audio/video before important meetings
- Use chat for non-verbal communication

---

## Error Handling

### Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 401 | Invalid meeting password | Check password and retry |
| 403 | Access denied | Only hosts can perform this action |
| 404 | Meeting not found | Verify meeting ID |
| 410 | Meeting has ended | Cannot join ended meetings |
| 429 | Too many requests | Rate limit exceeded, wait and retry |
| 500 | Internal server error | Contact support |

---

## Rate Limits

- **Meeting Creation**: 10 per minute
- **Participant Updates**: 20 per minute
- **API Calls**: 100 per minute per user

---

## WebSocket Events (Real-time)

### Subscribe to meeting events:
```javascript
socket.on('meeting:participant_joined', (data) => {
  // Handle new participant
});

socket.on('meeting:participant_left', (data) => {
  // Handle participant leaving
});

socket.on('meeting:chat_message', (data) => {
  // Handle new chat message
});

socket.on('meeting:role_updated', (data) => {
  // Handle role change
});
```

---

## Meeting Types

### 1. Scheduled Meeting
- Pre-planned with specific start/end time
- Participants invited in advance
- Email invitations sent automatically
- Best for: Regular team meetings, client calls

### 2. Instant Meeting
- Created and started immediately
- No scheduling required
- Participants can be added on the fly
- Best for: Quick discussions, urgent issues

### 3. Recurring Meeting
- Same meeting ID for multiple sessions
- Automatically repeats at intervals
- Participants remain consistent
- Best for: Daily standups, weekly reviews

---

## Features Configuration

### Video Settings
```json
{
  "features": {
    "video_enabled": true,
    "quality": "high",
    "frameRate": 30
  }
}
```

### Audio Settings
```json
{
  "features": {
    "audio_enabled": true,
    "noise_suppression": true,
    "echo_cancellation": true
  }
}
```

### Recording Settings
```json
{
  "recording_config": {
    "auto_record": true,
    "record_video": true,
    "record_audio": true,
    "record_chat": true,
    "storage_location": "cloud",
    "retention_days": 30
  }
}
```

---

## Support & Resources

- **API Documentation**: Full OpenAPI/Swagger specs available
- **WebSocket Guide**: Real-time integration documentation
- **Video Calling**: Detailed WebRTC implementation guide
- **Email Integration**: SMTP setup and templates

For technical support, contact: support@omyra.dev

---

*Last Updated: October 25, 2025*
*Version: 2.0*
