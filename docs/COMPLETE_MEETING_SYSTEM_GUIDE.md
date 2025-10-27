# Complete Meeting System Guide

**Version:** 2.1  
**Last Updated:** October 27, 2025  
**System:** KCS Real-time Video Conferencing Platform  
**Security Status:** ✅ All Critical Issues Fixed

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [REST API Reference](#rest-api-reference)
5. [WebSocket Events Reference](#websocket-events-reference)
6. [Meeting Lifecycle](#meeting-lifecycle)
7. [Security & Access Control](#security--access-control)
8. [Error Handling](#error-handling)
9. [Rate Limits](#rate-limits)
10. [Best Practices](#best-practices)
11. [Recent Updates & Security Fixes](#recent-updates--security-fixes)

---

## System Overview

### What is KCS Meeting System?

KCS Meeting System is an enterprise-grade video conferencing platform that provides:

- **Scheduled & Instant Meetings** - Pre-planned or on-demand video conferences
- **Real-time Video/Audio** - HD quality media streaming with adaptive bitrate
- **Screen Sharing** - Desktop and application sharing capabilities
- **Live Chat** - Text messaging, file sharing, and reactions during meetings
- **Recording** - Save meetings for future reference
- **Participant Management** - Add, remove, and manage attendees dynamically
- **Analytics** - Track engagement, duration, and quality metrics
- **Security** - Password protection, waiting rooms, and host controls

### Architecture

- **REST API** - For meeting CRUD operations and data retrieval
- **WebSocket (Socket.IO)** - For real-time signaling and live updates
- **WebRTC (MediaSoup)** - For peer-to-peer media streaming
- **Authentication** - JWT token-based security

### Scalability

The system uses MediaSoup SFU architecture with multiple workers to support:
- **Concurrent Users:** Millions
- **Per Meeting:** Up to 10,000 participants (configurable)
- **Workers:** 4 parallel processing units (expandable)

---

## Quick Start

### Connection Requirements

1. **Base URL (REST):** `https://your-domain.com/api/meeting`
2. **WebSocket URL:** `https://your-domain.com` (Socket.IO on port 4501)
3. **Authentication:** JWT token required for all operations
4. **Transport:** HTTPS for REST, WSS for WebSocket

### Typical Workflow

1. **Authenticate** → Obtain JWT token from login API
2. **Create Meeting** → POST to `/api/meeting`
3. **Connect WebSocket** → Establish Socket.IO connection with token
4. **Join Meeting** → Emit `join-meeting` event
5. **Start Media** → Use WebRTC signaling events
6. **Interact** → Send messages, reactions, screen shares
7. **Leave Meeting** → Emit `leave-meeting` event
8. **End Meeting** → POST to `/api/meeting/:id/end` (host only)

---

## Authentication

### How Authentication Works

All API calls and WebSocket connections require a valid JWT token.

**Token Structure:**
- **Type:** Bearer token
- **Algorithm:** HS512
- **Expiry:** Configurable (typically 24 hours)
- **Payload:** Contains `user_id`, `user_type`, `campus_id`

**Where to Include Token:**

1. **REST API:** Include in `Authorization` header as `Bearer <token>`
2. **WebSocket:** Include in `auth.token` during connection handshake

**Token Validation:**
- Server validates token on every request
- Invalid or expired tokens result in 401 Unauthorized
- WebSocket connections are rejected if token is invalid

---

## REST API Reference

### Core Meeting Operations

#### 1. Create Meeting

**Endpoint:** `POST /api/meeting`

**Purpose:** Create a new scheduled or instant meeting

**Required Fields:**
- `meeting_name` - Display name for the meeting
- `meeting_description` - Brief description
- `meeting_start_time` - ISO 8601 datetime
- `meeting_end_time` - ISO 8601 datetime
- `meeting_location` - Virtual location identifier
- `participants` - Array of user IDs to invite

**Optional Enhanced Fields:**
- `meeting_type` - "scheduled", "instant", or "recurring" (default: "scheduled")
- `max_participants` - Maximum attendees (2-10,000, default: 100)
- `meeting_password` - 6-50 character password for access control
- `waiting_room_enabled` - Enable pre-meeting waiting area (default: false)
- `require_host_approval` - Host must approve participants (default: false)
- `features` - Object containing feature flags:
  - `video_enabled` - Allow video streaming (default: true)
  - `audio_enabled` - Allow audio streaming (default: true)
  - `screen_sharing_enabled` - Allow screen sharing (default: true)
  - `chat_enabled` - Enable text chat (default: true)
  - `recording_enabled` - Allow recording (default: false)
  - `breakout_rooms_enabled` - Enable breakout sessions (default: false)
  - `whiteboard_enabled` - Enable collaborative whiteboard (default: false)
  - `hand_raise_enabled` - Allow hand raising (default: true)
- `recording_config` - Object containing recording settings:
  - `auto_record` - Start recording automatically (default: false)
  - `record_video` - Include video in recording (default: true)
  - `record_audio` - Include audio in recording (default: true)
  - `record_chat` - Include chat transcript (default: false)
  - `storage_location` - "local" or "cloud" (default: "cloud")
  - `retention_days` - Days to keep recording (1-365, default: 30)

**Response Fields:**
- `success` - Boolean indicating operation status
- `data` - Meeting object containing:
  - `id` - Unique meeting identifier
  - `meeting_room_id` - Virtual room identifier
  - `meeting_status` - "scheduled", "live", "ended", or "cancelled"
  - `created_at` - Timestamp of creation
  - All other meeting details
- `message` - Human-readable success message

**Use Cases:**
- Schedule weekly team meetings
- Create instant meetings for urgent discussions
- Set up client presentations with password protection
- Configure training sessions with recording

---

#### 2. Get All Meetings

**Endpoint:** `GET /api/meeting`

**Purpose:** Retrieve all meetings for the authenticated user

**Query Parameters:** None required

**Response Fields:**
- `success` - Boolean status
- `data` - Array of meeting objects
- `count` - Total number of meetings returned

**Security Note:**
- ✅ **Updated (Oct 27, 2025):** Now returns meetings where user is creator OR participant
- Checks both user_id and email-based invitations
- Properly filters by campus isolation

**Use Cases:**
- Display user's meeting dashboard
- Show upcoming meetings calendar
- List past meetings for review

---

#### 3. Get Meeting Details

**Endpoint:** `GET /api/meeting/:meeting_id`

**Purpose:** Retrieve detailed information about a specific meeting

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Complete meeting object including:
  - All meeting details
  - Current participants list
  - Live statistics (if meeting is active)
  - WebRTC configuration (if meeting is live)

**Security Note:**
- ✅ **Updated (Oct 27, 2025):** Access control now enforced
- Only creator and invited participants can view meeting details
- Campus isolation enforced (cross-campus access denied)
- Returns 403 Forbidden for unauthorized users

**Use Cases:**
- Show meeting lobby before joining
- Display meeting details for scheduling
- Monitor live meeting status

---

#### 4. Get Meetings by Participant

**Endpoint:** `GET /api/meeting/participant/:participant_id?`

**Purpose:** Retrieve meetings where user is a participant

**Path Parameters:**
- `participant_id` - Optional. If not provided, uses authenticated user's ID

**Response Fields:**
- `success` - Boolean status
- `data` - Array of meetings user is invited to
- `count` - Total number of meetings

**Note:**
- ✅ **Updated (Oct 27, 2025):** Now includes meetings where user is creator
- Checks both user_id and email-based participant matching
- Returns empty array instead of 404 when no meetings found
- **Deprecated:** Consider using GET `/api/meeting` for same functionality

**Use Cases:**
- Show meetings user has been invited to
- Display participant's meeting history
- Check meeting assignments

---

#### 5. Update Meeting

**Endpoint:** `PUT /api/meeting/:meeting_id`

**Purpose:** Update meeting details (time, participants, settings)

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Updatable Fields:**
- Any meeting creation field can be updated
- Cannot update meetings that have ended
- Only host/creator can update meetings

**Response Fields:**
- `success` - Boolean status
- `data` - Updated meeting object
- `message` - Confirmation message

**Important Notes:**
- Updates trigger email notifications to participants
- Cannot update past meetings
- Time changes require start_time < end_time validation

**Use Cases:**
- Reschedule meeting time
- Add more participants to scheduled meeting
- Update meeting description or settings
- Change security settings (password, waiting room)

---

#### 6. Delete Meeting

**Endpoint:** `DELETE /api/meeting/:meeting_id`

**Purpose:** Cancel and soft-delete a meeting

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `message` - Confirmation message

**Important Notes:**
- Performs soft delete (data retained for audit)
- Sends cancellation emails to all participants
- Cannot delete live meetings (must end first)
- Only host/creator can delete meetings

**Use Cases:**
- Cancel scheduled meetings
- Remove unwanted recurring meetings
- Clean up meeting list

---

### Live Meeting Control

#### 7. Start Meeting

**Endpoint:** `POST /api/meeting/:meeting_id/start`

**Purpose:** Initiate a scheduled meeting and open the room

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Meeting object with:
  - `status` - Changed to "live"
  - `webrtc_config` - WebRTC connection configuration
  - `live_stats` - Initial statistics (participant count: 0)
- `message` - Confirmation message

**Important Notes:**
- Only hosts can start meetings
- Participants receive notifications
- WebRTC infrastructure is initialized
- Meeting room becomes accessible

**Use Cases:**
- Begin scheduled meeting at designated time
- Open meeting room for early joiners
- Activate waiting room for approval process

---

#### 8. End Meeting

**Endpoint:** `POST /api/meeting/:meeting_id/end`

**Purpose:** Terminate a live meeting and close the room

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Meeting object with:
  - `status` - Changed to "ended"
  - `final_stats` - Complete analytics:
    - `duration_minutes` - Total meeting duration
    - `max_participants` - Peak attendance
    - `total_chat_messages` - Message count
    - `recording_url` - Link to recording (if recorded)
- `message` - Confirmation message

**Important Notes:**
- Only hosts can end meetings
- All participants are disconnected immediately
- Final analytics are generated and stored
- Recordings are processed and saved
- Meeting cannot be restarted after ending

**Use Cases:**
- Conclude meeting at scheduled end time
- Terminate meeting early if needed
- Trigger recording processing

---

#### 9. Join Meeting

**Endpoint:** `POST /api/meeting/:meeting_id/join`

**Purpose:** Validate access and retrieve join information

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Request Fields:**
- `meeting_password` - Required if meeting is password-protected

**Response Fields:**
- `success` - Boolean status
- `data` - Join information:
  - `meeting` - Basic meeting details (id, name, status, features)
  - `canJoin` - Boolean permission to join
  - `waitingRoomEnabled` - Whether waiting room is active
  - `requiresPassword` - Whether password is needed
- `message` - Status message

**Validation Checks:**
1. Meeting exists and is active
2. User has permission (participant list or campus member)
3. Password matches (if required)
4. Meeting not ended or cancelled
5. Participant limit not exceeded

**Security Note:**
- ✅ **Updated (Oct 27, 2025):** Participant validation now enforced
- Only invited participants (by user_id or email) can join
- Guests can join only if `allow_guests` is enabled
- Campus isolation enforced

**Response Codes:**
- `200` - Access granted, can join
- `401` - Invalid password
- `403` - Access denied (not invited)
- `410` - Meeting has ended
- `429` - Meeting is full

**Use Cases:**
- Pre-join validation before connecting WebSocket
- Display waiting room or lobby
- Check password before attempting connection
- Verify meeting availability

---

### Participant Management

#### 10. Get Meeting Participants

**Endpoint:** `GET /api/meeting/:meeting_id/participants`

**Purpose:** Retrieve list of all participants in a meeting

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Array of participant objects containing:
  - `id` - Participant record ID
  - `user_id` - User identifier
  - `participant_name` - Display name
  - `participant_email` - Email address
  - `connection_status` - "connected", "disconnected", "reconnecting"
  - `connection_quality` - "excellent", "good", "fair", "poor"
  - `joined_at` - Timestamp of join
  - `left_at` - Timestamp of leave (if applicable)
  - `media_status` - Object with video/audio/screen sharing status
  - `permissions` - Object with participant capabilities
- `count` - Total participant count

**Use Cases:**
- Display participant roster during meeting
- Show connection status indicators
- Monitor participant engagement
- Track attendance for reports

---

#### 11. Add Participants (Microsoft Teams Style)

**Endpoint:** `POST /api/meeting/:id/participants`

**Purpose:** Add new participants to scheduled or live meetings

**Path Parameters:**
- `id` - Unique identifier of the meeting (note: uses `:id` not `:meeting_id`)

**Request Fields:**
- `participants` - Array of objects, each containing:
  - `user_id` - Internal user identifier (optional)
  - `email` - Email address (optional, required if no user_id)
  - `name` - Display name (optional)
  - `phone` - Phone number (optional)
  - `role` - "host", "co_host", "presenter", or "attendee" (optional)
  - **Note:** Each participant must have either `user_id` OR `email`
- `send_invitation` - Boolean to send email invites (default: true)
- `invitation_message` - Custom message in invitation (max 500 chars)
- `participant_role` - Default role for all participants if not specified individually
- `notify_existing_participants` - Notify current attendees of additions (default: true)

**Response Fields:**
- `success` - Boolean status
- `data` - Object containing:
  - `meeting_id` - Meeting identifier
  - `participants_added` - Array of newly added participant objects
  - `invitations_sent` - Count of email invitations sent
  - `total_participants` - Updated participant count
- `message` - Confirmation message

**Authorization:**
- Only hosts and co-hosts can add participants
- Validates campus membership for user_id additions
- External emails allowed for guest invitations

**Use Cases:**
- Add colleagues during a live meeting
- Invite external participants via email
- Expand team size for collaborative sessions
- Grant presenter access to specific users

---

#### 12. Remove Participants

**Endpoint:** `DELETE /api/meeting/:id/participants`

**Purpose:** Remove participants from scheduled or live meetings

**Path Parameters:**
- `id` - Unique identifier of the meeting

**Request Fields:**
- `participant_ids` - Array of participant IDs to remove
- `notify_removed_participants` - Send removal notification (default: true)
- `notify_existing_participants` - Notify remaining attendees (default: false)
- `reason` - Explanation for removal (optional, for audit trail)

**Response Fields:**
- `success` - Boolean status
- `data` - Object containing:
  - `meeting_id` - Meeting identifier
  - `participants_removed` - Array of removed participant IDs
  - `remaining_count` - Updated participant count
- `message` - Confirmation message

**Authorization:**
- Only hosts and co-hosts can remove participants
- Cannot remove the meeting host
- Validates campus membership

**Important Notes:**
- If meeting is live, participants are disconnected immediately
- Removal is logged in audit trail
- Email notifications sent to removed users (if enabled)

**Use Cases:**
- Remove disruptive participants
- Manage capacity limits
- End participant's access after their segment
- Remove accidental invitations

---

#### 13. Update Participant Role

**Endpoint:** `PATCH /api/meeting/:id/participants/:participant_id/role`

**Purpose:** Change participant permissions and role during meeting

**Path Parameters:**
- `id` - Unique identifier of the meeting
- `participant_id` - Unique identifier of the participant

**Request Fields:**
- `new_role` - Role to assign: "host", "co_host", "presenter", or "attendee"
- `permissions` - Object with granular permissions (optional):
  - `can_share_screen` - Allow screen sharing
  - `can_unmute_others` - Allow unmuting other participants
  - `can_manage_participants` - Allow add/remove participants
  - `can_record` - Allow starting/stopping recording
  - `can_manage_breakout_rooms` - Allow creating breakout sessions
- `notify_participant` - Notify the user of role change (default: true)
- `notify_others` - Notify other participants (default: false)

**Response Fields:**
- `success` - Boolean status
- `data` - Object containing:
  - `participant_id` - Participant identifier
  - `old_role` - Previous role
  - `new_role` - Updated role
  - `updated_at` - Timestamp of change
- `message` - Confirmation message

**Role Descriptions:**
- **host** - Full control, can end meeting, manage all settings
- **co_host** - Can manage participants and settings, cannot end meeting
- **presenter** - Can share screen and present, limited management access
- **attendee** - Basic participation rights (view, listen, chat)

**Authorization:**
- Only hosts can change roles
- Cannot demote the original meeting creator
- Role changes logged in audit trail

**Use Cases:**
- Promote co-host for meeting management support
- Grant presenter access for screen sharing
- Demote disruptive co-host
- Delegate meeting control temporarily

---

#### 14. Search Users to Add

**Endpoint:** `POST /api/meeting/:id/search-users`

**Purpose:** Search campus directory to find users to invite

**Path Parameters:**
- `id` - Unique identifier of the meeting

**Request Fields:**
- `query` - Search term (name, email, or partial match)
- `exclude_current_participants` - Filter out existing attendees (default: true)
- `limit` - Maximum results to return (default: 20, max: 100)
- `user_types` - Array of user categories to search: ["teachers", "students", "staff"]

**Response Fields:**
- `success` - Boolean status
- `data` - Object containing:
  - `users` - Array of user objects:
    - `user_id` - Unique identifier
    - `name` - Full name
    - `email` - Email address
    - `user_type` - Category (teacher, student, staff)
    - `profile_picture` - Avatar URL
    - `department` - Organizational unit
  - `total_found` - Total matching users
  - `search_query` - Echo of search term
- `count` - Number of results returned

**Search Behavior:**
- Case-insensitive matching
- Searches across name, email, and username fields
- Results sorted by relevance
- Only returns users from same campus

**Use Cases:**
- Quick lookup when adding participants
- Directory search for meeting invitations
- Find colleagues by partial name
- Locate users by email domain

---

### Meeting Content & Analytics

#### 15. Get Meeting Chat History

**Endpoint:** `GET /api/meeting/:meeting_id/chat`

**Purpose:** Retrieve all chat messages from a meeting

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Query Parameters:**
- `limit` - Maximum messages to return (default: 100)

**Response Fields:**
- `success` - Boolean status
- `data` - Array of message objects:
  - `id` - Message identifier
  - `meeting_id` - Meeting reference
  - `sender_id` - User who sent message
  - `sender_name` - Display name of sender
  - `message` - Text content
  - `message_type` - "text", "file", "poll", or "announcement"
  - `recipient_type` - "all", "private", or "host"
  - `recipient_id` - Target user (for private messages)
  - `timestamp` - When message was sent
  - `edited_at` - Last edit timestamp (if edited)
  - `is_deleted` - Deletion status
- `count` - Total messages returned

**Use Cases:**
- Review meeting discussions
- Export chat transcript
- Search for shared links or information
- Audit meeting communications

---

#### 16. Get Meeting Recordings

**Endpoint:** `GET /api/meeting/:meeting_id/recordings`

**Purpose:** Access recorded meeting files

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Array of recording objects:
  - `id` - Recording identifier
  - `recording_type` - "video", "audio", "screen", or "chat"
  - `file_path` - Storage location
  - `file_size_bytes` - File size in bytes
  - `duration_seconds` - Recording length
  - `format` - File format (mp4, webm, etc.)
  - `quality` - Resolution/bitrate quality
  - `started_at` - Recording start time
  - `ended_at` - Recording end time
  - `processed_at` - When processing completed
  - `is_available` - Ready for download
  - `download_count` - Access statistics
- `count` - Total recordings available

**Access Control:**
- Only meeting participants can access recordings
- Host can control recording visibility
- Download counts are tracked

**Use Cases:**
- Download meeting recordings
- Review past meetings
- Share recordings with absent participants
- Archive important meetings

---

#### 17. Get Meeting Analytics

**Endpoint:** `GET /api/meeting/:meeting_id/analytics`

**Purpose:** Retrieve detailed analytics for completed meeting

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Analytics object:
  - `duration_minutes` - Total meeting length
  - `peak_participants` - Maximum concurrent attendees
  - `average_participants` - Mean attendance throughout
  - `total_participants_joined` - Unique participants
  - `total_chat_messages` - Message count
  - `screen_share_duration` - Minutes of screen sharing
  - `recording_duration` - Minutes recorded
  - `participant_engagement` - Breakdown by activity level:
    - `high_engagement` - Very active participants
    - `medium_engagement` - Moderately active
    - `low_engagement` - Minimal activity
  - `connection_quality_avg` - Average quality score (0-100)
  - `bandwidth_usage` - Total data transferred

**Use Cases:**
- Generate meeting reports
- Track team engagement
- Measure meeting effectiveness
- Monitor technical performance

---

#### 18. Get Live Meeting Statistics

**Endpoint:** `GET /api/meeting/:meeting_id/live-stats`

**Purpose:** Retrieve real-time statistics during active meeting

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Live statistics object:
  - `current_participants` - Active attendee count
  - `duration_minutes` - Meeting length so far
  - `chat_messages` - Total messages sent
  - `active_speakers` - Currently speaking participants
  - `screen_sharing` - Boolean if anyone sharing
  - `recording_active` - Boolean if recording
  - `bandwidth_usage` - Current data transfer:
    - `total_mbps` - Aggregate bandwidth
    - `per_participant_avg` - Average per user
  - `quality_metrics` - Performance indicators:
    - `average_video_quality` - Resolution (e.g., "720p")
    - `connection_quality` - "excellent", "good", "fair", "poor"
    - `latency_ms` - Average latency
    - `packet_loss_percent` - Network packet loss

**Refresh Rate:**
- Updates every 5 seconds
- Real-time metrics available during meeting only

**Use Cases:**
- Monitor meeting health
- Display live participant counter
- Track bandwidth usage
- Detect connection issues

---

#### 19. Get WebRTC Configuration

**Endpoint:** `GET /api/meeting/:meeting_id/webrtc-config`

**Purpose:** Retrieve WebRTC connection parameters for client

**Path Parameters:**
- `meeting_id` - Unique identifier of the meeting

**Response Fields:**
- `success` - Boolean status
- `data` - Configuration object:
  - `webrtc_config` - WebRTC settings:
    - `router_id` - MediaSoup router identifier
    - `router_capabilities` - Codec support information
    - `ice_servers` - STUN/TURN server array
  - `meeting_features` - Enabled features for this meeting
  - `max_participants` - Participant limit

**Important Notes:**
- Required before establishing WebRTC connection
- ICE servers enable NAT traversal
- Router capabilities determine codec negotiation
- Configuration is meeting-specific

**Use Cases:**
- Initialize WebRTC peer connection
- Configure media codecs
- Establish STUN/TURN connectivity
- Prepare for media streaming

---

### System Administration

#### 20. Get System Statistics

**Endpoint:** `GET /api/meeting/system/stats`

**Purpose:** Retrieve system-wide meeting statistics (Admin only)

**Response Fields:**
- `success` - Boolean status
- `data` - System statistics:
  - `total_meetings` - All meetings created
  - `active_meetings` - Currently live meetings
  - `scheduled_meetings` - Upcoming meetings
  - `total_participants` - All-time participant count
  - `active_participants` - Currently connected users
  - `mediasoup_workers` - WebRTC infrastructure:
    - `total` - Total workers available
    - `active` - Currently processing
    - `load_distribution` - Load percentage per worker
  - `system_health` - Health status indicators
  - `uptime_hours` - System uptime

**Authorization:**
- Admin users only
- Campus administrators have limited view

**Use Cases:**
- Monitor system load
- Capacity planning
- Infrastructure scaling decisions
- Health monitoring dashboards

---

## WebSocket Events Reference

### Connection & Authentication

#### Establishing Connection

**Connection URL:** `wss://your-domain.com` or `ws://localhost:4501` (development)

**Authentication Method:** Include JWT token in connection handshake

**Connection Options:**
- Transport: WebSocket (preferred) or Polling (fallback)
- Ping Timeout: 60 seconds
- Ping Interval: 25 seconds

**Connection Events:**

**`connect`** - Successfully connected to server
- **Direction:** Server → Client
- **Payload:** None
- **Action:** Initialize meeting features, subscribe to rooms

**`disconnect`** - Connection lost
- **Direction:** Server → Client
- **Payload:** None
- **Action:** Clean up resources, show offline status

**`connect_error`** - Connection failed
- **Direction:** Server → Client
- **Payload:** Error object with message
- **Common Reasons:**
  - Authentication token missing
  - Invalid token
  - Token expired
  - User not found

**`error`** - General error during operation
- **Direction:** Server → Client
- **Payload:** Object with `message` field
- **Action:** Display error to user, handle appropriately

---

### Meeting Events (Video Conferencing)

#### Client → Server Events

**`join-meeting`** - Request to join a meeting room

**Payload:**
- `meetingId` - Meeting identifier (required)
- `meeting_password` - Access password (optional, required if protected)

**Server Actions:**
1. Validates meeting exists and is active
2. Checks user permissions (participant list or campus member)
3. Verifies password if required
4. Checks participant capacity
5. Adds user to meeting room
6. Broadcasts join to other participants

**Success Response:** `meeting-joined` event
**Error Response:** `error` event with specific message

---

**`leave-meeting`** - Leave a meeting room

**Payload:**
- `meetingId` - Meeting identifier

**Server Actions:**
1. Removes user from meeting room
2. Updates participant count
3. Broadcasts departure to other participants
4. Cleans up WebRTC resources

**Broadcast:** `participant-left` to remaining participants

---

**`send-message`** - Send chat message in meeting

**Payload:**
- `meetingId` - Meeting identifier
- `message` - Text content (required)
- `recipientType` - "all", "private", or "host"
- `recipientId` - Target user ID (for private messages)

**Server Actions:**
1. Validates user is in meeting
2. Stores message in database
3. Broadcasts to appropriate recipients

**Broadcast:** `new-message` to recipients

---

**`typing`** - Indicate typing status in meeting chat

**Payload:**
- `meetingId` - Meeting identifier
- `typing` - Boolean (true when typing, false when stopped)

**Server Actions:**
- Broadcasts typing indicator to other participants
- Auto-clears after 3 seconds of inactivity

**Broadcast:** `user-typing` to other participants

---

**`raise-hand`** - Raise or lower hand to speak

**Payload:**
- `meetingId` - Meeting identifier
- `raised` - Boolean (true to raise, false to lower)

**Server Actions:**
- Updates participant status
- Broadcasts hand status to all participants
- Maintains hand-raised queue

**Broadcast:** `hand-raised` to all participants

---

**`send-reaction`** - Send emoji reaction

**Payload:**
- `meetingId` - Meeting identifier
- `reaction` - Emoji character or code

**Server Actions:**
- Validates reaction format
- Broadcasts to all participants
- Reaction expires after display (client-side)

**Broadcast:** `participant-reaction` to all participants

---

**`media-status-update`** - Update own media status

**Payload:**
- `meetingId` - Meeting identifier
- `video` - Boolean (camera on/off)
- `audio` - Boolean (microphone on/off)
- `screenSharing` - Boolean (screen share active/inactive)

**Server Actions:**
- Updates participant media status
- Broadcasts change to all participants
- Updates meeting analytics

**Broadcast:** `participant-media-updated` to all participants

---

**`mute-participant`** - Host mutes a participant (host only)

**Payload:**
- `meetingId` - Meeting identifier
- `participantId` - User to mute
- `mute` - Boolean (true to mute, false to unmute)

**Server Actions:**
- Validates requester is host/co-host
- Updates participant status
- Sends direct message to muted user
- Broadcasts to all participants

**Direct Message:** `muted-by-host` to affected participant
**Broadcast:** `participant-media-updated` to all

---

**`toggle-recording`** - Start or stop meeting recording (host only)

**Payload:**
- `meetingId` - Meeting identifier
- `start` - Boolean (true to start, false to stop)

**Server Actions:**
- Validates requester is host
- Initiates or terminates recording
- Updates meeting status
- Broadcasts recording status

**Broadcast:** `recording-status-changed` to all participants

---

#### Server → Client Events

**`meeting-joined`** - Successful join confirmation

**Payload:**
- `meeting` - Meeting object with details
- `participantId` - Your participant ID
- `participants` - Array of current participants
- `webrtcConfig` - WebRTC connection configuration

**Action:** Initialize media streams, display participant list

---

**`participant-joined`** - Another user joined

**Payload:**
- `participantId` - New participant ID
- `userName` - Display name
- `userId` - User identifier
- `permissions` - Participant capabilities

**Action:** Add participant to UI, update counter

---

**`participant-left`** - Another user left

**Payload:**
- `participantId` - Departing participant ID
- `userName` - Display name

**Action:** Remove participant from UI, update counter

---

**`participant-media-updated`** - Participant changed media status

**Payload:**
- `participantId` - Affected participant
- `video` - Camera status
- `audio` - Microphone status
- `screenSharing` - Screen share status

**Action:** Update media indicators in UI

---

**`new-message`** - Chat message received

**Payload:**
- `message` - Message object:
  - `id` - Message identifier
  - `sender_id` - Sender user ID
  - `sender_name` - Sender display name
  - `message` - Text content
  - `timestamp` - ISO 8601 timestamp
  - `recipientType` - Visibility scope

**Action:** Display message in chat window

---

**`user-typing`** - Someone is typing

**Payload:**
- `userId` - Typing user ID
- `userName` - Display name
- `typing` - Boolean status

**Action:** Show/hide typing indicator

---

**`participant-reaction`** - Emoji reaction received

**Payload:**
- `participantId` - Reacting participant
- `userName` - Display name
- `reaction` - Emoji character
- `timestamp` - When reaction was sent

**Action:** Display floating emoji animation

---

**`hand-raised`** - Hand raise status changed

**Payload:**
- `participantId` - Affected participant
- `userName` - Display name
- `raised` - Boolean status
- `timestamp` - When status changed

**Action:** Update hand icon, maintain queue

---

**`recording-status-changed`** - Recording started/stopped

**Payload:**
- `recording` - Boolean (true if recording, false if stopped)
- `startedBy` - User who initiated action (optional)

**Action:** Display recording indicator, update UI

---

**`muted-by-host`** - You were muted by host

**Payload:**
- `muted` - Boolean status
- `reason` - Optional explanation

**Action:** Disable microphone, show notification

---

### Chat Events (General Messaging)

#### Client → Server Events

**`join-chat-rooms`** - Subscribe to multiple chat rooms

**Payload:**
- `roomIds` - Array of room identifiers

**Server Actions:**
- Subscribes socket to each room
- Validates user has access to each room
- Returns confirmation with joined rooms

**Response:** `chat-rooms-joined`

---

**`leave-chat-room`** - Unsubscribe from a chat room

**Payload:**
- `roomId` - Room identifier

**Server Actions:**
- Removes socket from room
- Cleans up room-specific resources

**Response:** `chat-room-left`

---

**`chat-typing`** - Typing indicator in chat room

**Payload:**
- `roomId` - Room identifier
- `isTyping` - Boolean status

**Server Actions:**
- Broadcasts to room members
- Auto-expires after 3 seconds

**Broadcast:** `chat-user-typing`

---

**`mark-messages-seen`** - Mark messages as read

**Payload:**
- `roomId` - Room identifier
- `messageIds` - Array of message IDs

**Server Actions:**
- Updates message seen status
- Records timestamp and user
- Broadcasts read receipts

**Response:** `messages-seen-acknowledged`
**Broadcast:** `messages-seen` to room

---

**`update-chat-status`** - Change online status

**Payload:**
- `status` - "online", "away", or "busy"

**Server Actions:**
- Updates user status
- Broadcasts to all chat rooms user is in

**Broadcast:** `chat-user-status-changed` to relevant rooms

---

**`get-room-online-users`** - Request list of online users in room

**Payload:**
- `roomId` - Room identifier

**Server Actions:**
- Queries online users in room
- Returns user list with status

**Response:** `room-online-users`

---

#### Server → Client Events

**`chat-rooms-joined`** - Room join confirmation

**Payload:**
- `success` - Boolean status
- `rooms` - Array of successfully joined room IDs
- `message` - Status message

**Action:** Update local room subscription list

---

**`chat-room-left`** - Room leave confirmation

**Payload:**
- `success` - Boolean status
- `roomId` - Room identifier

**Action:** Clean up room-specific UI elements

---

**`new-chat-message`** - New message in subscribed room

**Payload:**
- `type` - "new-message"
- `data` - Message object:
  - `messageId` - Unique identifier
  - `roomId` - Room identifier
  - `userId` - Sender ID
  - `userName` - Sender name
  - `content` - Message text
  - `timestamp` - ISO 8601 datetime
  - `attachments` - Array of file objects (if any)
- `timestamp` - Event timestamp

**Action:** Display message in chat UI

**Note:** Messages are created via REST API, then broadcast via WebSocket

---

**`chat-user-typing`** - Someone is typing in room

**Payload:**
- `userId` - Typing user ID
- `userName` - Display name
- `roomId` - Room identifier
- `isTyping` - Boolean status
- `timestamp` - Event time

**Action:** Show/hide typing indicator for user

---

**`messages-seen`** - Someone read messages

**Payload:**
- `userId` - User who read messages
- `roomId` - Room identifier
- `messageIds` - Array of read message IDs
- `timestamp` - Read timestamp

**Action:** Update read receipt indicators

---

**`messages-seen-acknowledged`** - Read receipt confirmation

**Payload:**
- `success` - Boolean status
- `roomId` - Room identifier
- `messageIds` - Array of marked message IDs

**Action:** Update local message status

---

**`chat-message-seen`** - Individual message seen by someone

**Payload:**
- `type` - "message-seen"
- `data`:
  - `messageId` - Message identifier
  - `seenBy` - User ID who saw message
  - `timestamp` - When seen

**Action:** Update read receipt UI for specific message

---

**`chat-message-deleted`** - Message was deleted

**Payload:**
- `type` - "message-deleted"
- `data`:
  - `messageId` - Deleted message ID
  - `deletedBy` - User who deleted
  - `timestamp` - Deletion time

**Action:** Remove message from UI or show "deleted" placeholder

---

**`chat-message-edited`** - Message was edited

**Payload:**
- `type` - "message-edited"
- `data`:
  - `messageId` - Message identifier
  - `newContent` - Updated text
  - `editedBy` - User who edited
  - `timestamp` - Edit time

**Action:** Update message content, show edited indicator

---

**`chat-message-reaction`** - Reaction added/removed

**Payload:**
- `type` - "message-reaction"
- `data`:
  - `messageId` - Message identifier
  - `emoji` - Reaction character
  - `userId` - Reacting user
  - `action` - "add" or "remove"
  - `timestamp` - Reaction time

**Action:** Update reaction counter on message

---

**`chat-message-delivered`** - Message delivered to user

**Payload:**
- `type` - "message-delivered"
- `data`:
  - `messageId` - Message identifier
  - `deliveredTo` - User ID
  - `timestamp` - Delivery time

**Action:** Show delivery checkmark

---

**`chat-user-status-changed`** - User changed online status

**Payload:**
- `userId` - User identifier
- `status` - "online", "away", "busy", or "offline"
- `timestamp` - Status change time

**Action:** Update user status indicator

---

**`chat-notification`** - General notification

**Payload:**
- `type` - Notification category:
  - "new-chat" - New room created
  - "mention" - You were mentioned
  - "room-update" - Room settings changed
  - "user-joined" - User joined room
  - "user-left" - User left room
- `data` - Notification-specific data
- `timestamp` - Event time

**Action:** Show notification banner or update badges

---

**`room-online-users`** - List of online users

**Payload:**
- `roomId` - Room identifier
- `users` - Array of user objects:
  - `userId` - User identifier
  - `userName` - Display name
  - `status` - "online", "away", "busy"
  - `lastSeen` - Last activity timestamp
- `count` - Total online users

**Action:** Display online user list

---

### WebRTC Signaling Events

#### Client → Server Events

**`create-transport`** - Create WebRTC transport

**Payload:**
- `meetingId` - Meeting identifier
- `direction` - "send" or "recv" (for sending or receiving media)

**Server Actions:**
- Creates MediaSoup transport
- Returns transport parameters

**Response:** `transport-created`

---

**`connect-transport`** - Connect WebRTC transport

**Payload:**
- `transportId` - Transport identifier
- `dtlsParameters` - DTLS connection parameters

**Server Actions:**
- Connects MediaSoup transport
- Establishes secure connection

**Response:** `transport-connected`

---

**`produce`** - Start sending media

**Payload:**
- `meetingId` - Meeting identifier
- `kind` - "audio" or "video"
- `rtpParameters` - RTP encoding parameters

**Server Actions:**
- Creates MediaSoup producer
- Returns producer ID

**Response:** `produced`

---

**`consume`** - Start receiving media

**Payload:**
- `meetingId` - Meeting identifier
- `producerParticipantId` - Source participant
- `kind` - "audio" or "video"
- `rtpCapabilities` - Client RTP capabilities

**Server Actions:**
- Creates MediaSoup consumer
- Returns consumer parameters

**Response:** `consumed`

---

**`resume-consumer`** - Resume paused media stream

**Payload:**
- `consumerId` - Consumer identifier

**Response:** `consumer-resumed`

---

**`pause-consumer`** - Pause active media stream

**Payload:**
- `consumerId` - Consumer identifier

**Response:** `consumer-paused`

---

#### Server → Client Events

**`transport-created`** - Transport creation success

**Payload:**
- `transportId` - Transport identifier
- `iceParameters` - ICE connection parameters
- `iceCandidates` - ICE candidate list
- `dtlsParameters` - DTLS security parameters

**Action:** Configure WebRTC peer connection

---

**`transport-connected`** - Transport connection success

**Payload:**
- `success` - Boolean status

**Action:** Proceed with media streaming

---

**`produced`** - Producer creation success

**Payload:**
- `kind` - "audio" or "video"
- `producerId` - Producer identifier

**Action:** Start sending media

---

**`consumed`** - Consumer creation success

**Payload:**
- `consumerId` - Consumer identifier
- `producerId` - Source producer
- `kind` - Media type
- `rtpParameters` - RTP parameters

**Action:** Start receiving media

---

**`consumer-resumed`** - Consumer resume success

**Payload:**
- `consumerId` - Consumer identifier

---

**`consumer-paused`** - Consumer pause success

**Payload:**
- `consumerId` - Consumer identifier

---

### Presence Events

**`user-online`** - User came online

**Payload:**
- `userId` - User identifier
- `userName` - Display name
- `timestamp` - Online timestamp

---

**`user-offline`** - User went offline

**Payload:**
- `userId` - User identifier
- `userName` - Display name
- `timestamp` - Offline timestamp
- `lastSeen` - Last activity time

---

## Meeting Lifecycle

### Complete Meeting Flow

#### Phase 1: Creation (Pre-Meeting)

1. **Create Meeting** (REST API)
   - Host creates meeting via POST `/api/meeting`
   - System generates meeting ID and room ID
   - Participants receive email invitations
   - Meeting status: "scheduled"

2. **Invite Participants** (Optional)
   - Add participants via POST `/api/meeting/:id/participants`
   - System sends invitations
   - Participants added to participant list

#### Phase 2: Pre-Join (Lobby)

3. **Validate Access** (REST API)
   - Participant calls POST `/api/meeting/:id/join`
   - System validates:
     - Meeting exists and is active
     - User has permission
     - Password correct (if required)
     - Capacity not exceeded
   - Returns join permissions

4. **Get Configuration** (REST API)
   - Client fetches GET `/api/meeting/:id/webrtc-config`
   - Receives WebRTC parameters
   - Prepares media devices

#### Phase 3: Starting Meeting

5. **Host Starts Meeting** (REST API)
   - Host calls POST `/api/meeting/:id/start`
   - System changes status to "live"
   - WebRTC infrastructure initialized
   - Waiting room activated (if enabled)

#### Phase 4: Joining Meeting

6. **Connect WebSocket**
   - Participant establishes Socket.IO connection
   - Authenticates with JWT token
   - Receives `connect` event

7. **Join Meeting Room** (WebSocket)
   - Emit `join-meeting` event
   - Server validates and adds to room
   - Receives `meeting-joined` confirmation
   - Receives list of current participants

8. **Announce Join**
   - Server broadcasts `participant-joined` to others
   - Other participants display new attendee

#### Phase 5: Active Meeting

9. **Establish Media Streams** (WebRTC Signaling)
   - Create transports: `create-transport`
   - Connect transports: `connect-transport`
   - Start producing: `produce` (for camera/mic)
   - Start consuming: `consume` (for others' streams)

10. **Participate in Meeting**
    - Toggle video: `media-status-update`
    - Toggle audio: `media-status-update`
    - Share screen: `media-status-update` + WebRTC
    - Send messages: `send-message`
    - React: `send-reaction`
    - Raise hand: `raise-hand`
    - Type: `typing` indicator

11. **Receive Updates** (WebSocket)
    - `participant-joined` - New attendees
    - `participant-left` - Departures
    - `participant-media-updated` - Media changes
    - `new-message` - Chat messages
    - `participant-reaction` - Reactions
    - `hand-raised` - Hand raising

#### Phase 6: Host Controls

12. **Manage Participants** (REST API + WebSocket)
    - Add: POST `/api/meeting/:id/participants`
    - Remove: DELETE `/api/meeting/:id/participants`
    - Change role: PATCH `/api/meeting/:id/participants/:id/role`
    - Mute: `mute-participant` event

13. **Recording** (WebSocket)
    - Start: `toggle-recording` with start: true
    - Stop: `toggle-recording` with start: false
    - All receive: `recording-status-changed`

#### Phase 7: Leaving Meeting

14. **Participant Leaves** (WebSocket)
    - Emit `leave-meeting` event
    - Server removes from room
    - Cleans up WebRTC resources
    - Broadcasts `participant-left` to others

#### Phase 8: Ending Meeting

15. **Host Ends Meeting** (REST API)
    - Host calls POST `/api/meeting/:id/end`
    - All participants disconnected
    - Status changed to "ended"
    - Analytics generated

#### Phase 9: Post-Meeting

16. **Access Content** (REST API)
    - View recordings: GET `/api/meeting/:id/recordings`
    - Read chat: GET `/api/meeting/:id/chat`
    - See analytics: GET `/api/meeting/:id/analytics`

### Status Transitions

```
scheduled → live → ended
    ↓
cancelled
```

- **scheduled** - Created but not started
- **live** - Active with participants
- **ended** - Completed normally
- **cancelled** - Deleted before starting

---

## Security & Access Control

### Authentication

**JWT Token Requirements:**
- All API calls require valid JWT token
- Token must be included in Authorization header for REST
- Token must be included in auth object for WebSocket
- Token validates user identity, campus, and permissions

### Authorization Levels

**Meeting Creator/Host:**
- Create, update, delete meetings
- Start and end meetings
- Add and remove participants
- Change participant roles
- Enable/disable features
- Start/stop recording
- Mute participants
- Full meeting control

**Co-Host:**
- Add and remove participants
- Change participant roles (except to host)
- Mute participants
- Start recording (if enabled)
- Manage meeting features
- Cannot end meeting
- Cannot delete meeting

**Presenter:**
- Share screen
- Share whiteboard
- Send messages to all
- Raise hand
- Send reactions
- Cannot manage participants

**Attendee:**
- View video/audio
- Send messages (if enabled)
- Raise hand
- Send reactions
- Basic participation only

### Meeting Security Features

**Password Protection:**
- Optional password for meeting access
- Minimum 6 characters
- Validated on join attempt
- Prevents unauthorized access

**Waiting Room:**
- Pre-meeting lobby
- Host reviews and approves participants
- Prevents disruptions
- Host receives join requests

**Participant Limits:**
- Configurable maximum (2-10,000)
- Prevents overload
- Enforced on join

**Campus Isolation:**
- Users can only access meetings in their campus
- Cross-campus meetings require special permissions
- Data segregation

### Data Security

**Encryption:**
- All REST API calls over HTTPS
- WebSocket connections over WSS
- WebRTC media streams encrypted (DTLS)
- Token encryption with HS512

**Privacy:**
- Meeting data visible only to participants
- Chat messages stored securely
- Recordings access-controlled
- Audit trail for compliance

**Access Logging:**
- All join/leave events logged
- Participant actions recorded
- Administrative actions audited
- Compliance-ready logs

---

## Error Handling

### HTTP Status Codes

**Success Codes:**
- **200 OK** - Request successful, data returned
- **201 Created** - Resource created successfully

**Client Error Codes:**
- **400 Bad Request** - Invalid input, validation failed
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **410 Gone** - Meeting has ended
- **429 Too Many Requests** - Rate limit exceeded

**Server Error Codes:**
- **500 Internal Server Error** - Server-side error occurred
- **503 Service Unavailable** - System overloaded or maintenance

### Common Error Messages

**Authentication Errors:**
- "Authentication token missing" - No JWT provided
- "Invalid token" - Token malformed or signature invalid
- "Token expired" - JWT past expiration time
- "User not found" - Token user doesn't exist

**Meeting Errors:**
- "Meeting not found" - Invalid meeting ID
- "Meeting has ended" - Trying to join ended meeting
- "Meeting is full" - Participant limit reached
- "Access denied" - Not invited or wrong campus
- "Access denied - meeting not found in your campus" - Cross-campus access blocked
- "Access denied - you are not a participant in this meeting" - Not invited to meeting

**Password Errors:**
- "Invalid meeting password" - Wrong password provided
- "Meeting password required" - Password needed but not provided

**Participant Errors:**
- "Access denied: You are not invited to this meeting" - Not in participant list and guests not allowed

**Permission Errors:**
- "Only hosts can start meetings" - Non-host trying to start
- "Only hosts can end meetings" - Non-host trying to end
- "Only hosts and co-hosts can add participants" - Insufficient permissions
- "Cannot remove meeting host" - Trying to remove creator

**Validation Errors:**
- "Meeting ID is required" - Missing required parameter
- "Meeting end time must be after start time" - Time validation failed
- "At least one participant is required" - Empty participant array
- "Each participant must have user_id or email" - Invalid participant format

### Error Response Format

All error responses follow consistent structure:

**Fields:**
- `success` - Always false for errors
- `message` - Human-readable error description
- `code` - Optional error code for programmatic handling

### WebSocket Errors

**Connection Errors:**
- Emit `connect_error` event with error details
- Client should display error and retry
- Check token validity before retry

**Operation Errors:**
- Emit `error` event with message
- Specific to failed operation
- Does not disconnect socket

**Recovery:**
- Automatic reconnection for network issues
- Manual token refresh for auth errors
- User action for permission errors

---

## Rate Limits

### API Rate Limits

**Meeting Creation:**
- **Limit:** 10 requests per minute per user
- **Scope:** POST `/api/meeting`
- **Purpose:** Prevent spam meeting creation

**Participant Updates:**
- **Limit:** 20 requests per minute per meeting
- **Scope:** Add/remove/update participant endpoints
- **Purpose:** Prevent rapid participant changes

**General API:**
- **Limit:** 100 requests per minute per user
- **Scope:** All GET endpoints
- **Purpose:** Prevent API abuse

**Search:**
- **Limit:** 30 requests per minute per user
- **Scope:** User search endpoint
- **Purpose:** Protect directory queries

### WebSocket Rate Limits

**Messages:**
- **Limit:** 30 messages per minute per meeting
- **Purpose:** Prevent chat spam

**Reactions:**
- **Limit:** 60 reactions per minute per user
- **Purpose:** Prevent reaction spam

**Media Updates:**
- **Limit:** 120 updates per minute per user
- **Purpose:** Allow frequent media toggles

### Handling Rate Limits

**Response When Limited:**
- HTTP Status: 429 Too Many Requests
- Message: "Rate limit exceeded"
- Retry-After header included

**Best Practices:**
- Implement exponential backoff
- Cache data to reduce requests
- Batch operations when possible
- Show user-friendly message

---

## Best Practices

### Meeting Creation

**Planning:**
- Set realistic participant limits based on importance
- Enable waiting room for sensitive meetings
- Use passwords for external participants
- Choose appropriate recording settings

**Scheduling:**
- Allow buffer time between meetings
- Send invitations well in advance
- Include clear description and agenda
- Specify expected duration

### During Meetings

**Host Responsibilities:**
- Start meeting a few minutes early
- Welcome participants as they join
- Monitor participant list for gatecrackers
- Mute disruptive participants promptly
- Use recording judiciously

**Participant Etiquette:**
- Join on time
- Mute when not speaking
- Use video when appropriate
- Use chat for non-verbal communication
- Raise hand to speak in large meetings

### Performance

**Network:**
- Encourage stable internet connections
- Disable video on poor connections
- Monitor connection quality metrics
- Have fallback plan for connectivity issues

**Scalability:**
- Keep meetings under 100 participants for best performance
- Use breakout rooms for larger groups
- Monitor system stats for capacity
- Enable recording only when needed

### Security

**Access Control:**
- Review participant list before starting
- Use waiting room for public meetings
- Require passwords for sensitive topics
- Remove unauthorized participants immediately

**Privacy:**
- Announce when recording starts
- Obtain consent before recording
- Control recording access
- Follow data retention policies

### User Experience

**Communication:**
- Show connection status clearly
- Display recording indicator prominently
- Indicate when microphone/camera is active
- Confirm message delivery

**Accessibility:**
- Provide captions when available
- Allow text-only participation
- Support keyboard navigation
- Offer high-contrast mode

**Feedback:**
- Show loading states during operations
- Display error messages clearly
- Provide reconnecting indicators
- Confirm important actions

### Development

**Integration:**
- Handle reconnection gracefully
- Implement exponential backoff
- Cache WebRTC configuration
- Lazy load participant data

**Testing:**
- Test with poor network conditions
- Verify reconnection logic
- Test capacity limits
- Validate error handling

**Monitoring:**
- Track connection quality
- Monitor bandwidth usage
- Log important events
- Alert on errors

---

## Appendix

### Supported Features Matrix

| Feature | Scheduled Meeting | Instant Meeting | Recurring Meeting |
|---------|------------------|-----------------|-------------------|
| Video | ✅ | ✅ | ✅ |
| Audio | ✅ | ✅ | ✅ |
| Screen Sharing | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ |
| Recording | ✅ | ✅ | ✅ |
| Password | ✅ | ✅ | ✅ |
| Waiting Room | ✅ | ✅ | ✅ |
| Hand Raising | ✅ | ✅ | ✅ |
| Reactions | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ |

### Technical Specifications

**Supported Codecs:**
- **Video:** VP8, VP9, H.264, AV1
- **Audio:** Opus

**Media Quality Levels:**
- **Low:** 360p, 30fps, 500kbps
- **Medium:** 720p, 30fps, 1.5Mbps
- **High:** 1080p, 30fps, 3Mbps
- **HD:** 1080p, 60fps, 5Mbps

**Bandwidth Requirements:**
- **Audio Only:** 50kbps
- **Video Call (1-1):** 1-2Mbps
- **Group Video (5+ people):** 2-4Mbps
- **Screen Sharing:** Additional 1-2Mbps

### Browser Support

**Fully Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Partial Support:**
- Older browsers with WebRTC support
- May require polyfills

**Not Supported:**
- Internet Explorer
- Browsers without WebRTC

### Mobile Support

**Native Apps:**
- iOS 13+ via WebRTC SDK
- Android 8+ via WebRTC SDK

**Mobile Browsers:**
- Chrome Mobile
- Safari iOS
- Samsung Internet

---

## Recent Updates & Security Fixes

### October 27, 2025 - Security Audit & Complete Fix Deployment

A comprehensive security audit was completed, identifying and fixing 5 critical issues. All issues have been resolved and deployed.

#### ✅ Issue #1: Meeting Visibility Bug (FIXED)

**Problem:** Users could only see meetings they created, not meetings where they were invited as participants.

**Fix:** The `getAllMeetings` endpoint now properly returns meetings where the user is:
- The meeting creator (by `creator_id`)
- A participant (by `user_id` in participants array)
- A participant (by `email` in participants array)

**Impact:** Participants can now see all meetings relevant to them in their dashboard.

---

#### ✅ Issue #2: getMeetingByParticipantId Wrong Logic (FIXED)

**Problem:** 
- Method only checked `participants` array, didn't check if user was creator
- Didn't check email-based invitations
- Threw 404 error on empty results instead of returning empty array
- Redundant with `getAllMeetings` functionality

**Fix:**
- Now checks if user is creator OR participant (by ID or email)
- Returns empty array instead of throwing error (consistent API behavior)
- Marked as deprecated (recommend using `getAllMeetings` instead)
- Added campus_id parameter for better filtering

**Impact:** Correct results for all use cases, consistent error handling across all list endpoints.

---

#### ✅ Issue #3: No Access Control on getMeetingById (CRITICAL - FIXED)

**Problem:** Any authenticated user could view ANY meeting's details by knowing the meeting ID, including:
- Meeting passwords
- Participant lists
- WebRTC configuration
- Private meeting information

**Fix:** Added multi-layer access control:
1. **Campus Isolation** - Meeting must be in same campus as requesting user
2. **Creator Check** - User is the meeting creator
3. **Participant Check (by user_id)** - User ID is in participants array
4. **Participant Check (by email)** - User's email is in participants array

**Impact:** 
- Prevents information disclosure
- Enforces privacy for sensitive meetings
- Blocks cross-campus data leakage
- Only authorized users can view meeting details

**Security Response:**
- Unauthorized requests now return `403 Forbidden`
- Clear error messages guide users
- Audit trail logs access attempts

---

#### ✅ Issue #4: Missing Participant Validation in joinMeeting (CRITICAL - FIXED)

**Problem:** Any user in the same campus could join ANY meeting if they knew the meeting ID and password, even if not invited.

**Fix:** Added participant validation before allowing join:
1. **Campus Isolation** - Meeting must be in user's campus
2. **Creator Check** - User is the meeting creator (always allowed)
3. **Participant Check (by user_id)** - User ID is in participants array
4. **Participant Check (by email)** - User's email is in participants array
5. **Guest Access Check** - Meeting has `allow_guests: true` flag

**Impact:**
- Prevents unauthorized meeting access
- Respects participant invitation lists
- Supports guest access when explicitly enabled
- Password security now secondary to invitation validation

**Security Response:**
- Non-invited users receive `403 Forbidden` with message: "Access denied: You are not invited to this meeting"
- Guest access controlled by meeting settings
- All join attempts logged for audit

---

#### ✅ Issue #5: Error Handling Consistency (FIXED)

**Problem:** Inconsistent API behavior across list endpoints:
- `getAllMeetings` returned empty array on no results
- `getMeetingByParticipantId` threw 404 error on no results

**Fix:** Standardized all list endpoints to:
- Always return `success: true` with data array (even if empty)
- Only return error status codes (500) for actual errors
- Never use 404 for empty list results

**Impact:**
- Consistent API contract across all endpoints
- Easier client implementation (same error handling pattern)
- RESTful best practices (200 OK for successful queries with no results)
- Better debugging (404 reserved for "resource not found", not "empty list")

---

### API Changes Summary

#### Changed Endpoints

**GET /api/meeting**
- ✅ Now returns meetings where user is creator OR participant (by ID or email)
- ✅ Enforces campus isolation
- No breaking changes - existing behavior enhanced

**GET /api/meeting/:meeting_id**
- ✅ Now enforces access control (campus + creator + participant validation)
- ⚠️ Non-invited users now receive 403 instead of 200
- Breaking change only for unauthorized access attempts

**GET /api/meeting/participant/:participant_id?**
- ✅ Now includes meetings where user is creator
- ✅ Checks email-based invitations
- ✅ Returns empty array instead of 404
- 📝 Marked as deprecated (use GET /api/meeting instead)
- No breaking changes for legitimate users

**POST /api/meeting/:meeting_id/join**
- ✅ Now validates participant list before allowing join
- ✅ Enforces campus isolation
- ✅ Supports guest access flag
- ⚠️ Non-invited users now receive 403 instead of 200
- Breaking change only for unauthorized access attempts

---

### Security Improvements

#### Before Security Fixes
❌ **Information Disclosure:** Anyone could view meeting passwords and participant lists  
❌ **Privacy Violation:** Meeting details exposed to non-members  
❌ **Unauthorized Access:** Non-invited users could join meetings  
❌ **Cross-Campus Leakage:** Users could access other campus meetings  
❌ **Incomplete Visibility:** Participants couldn't see meetings they were invited to

#### After Security Fixes
✅ **Campus Isolation:** Strong multi-tenant separation enforced on all endpoints  
✅ **Access Control:** Only creator and participants can view/join meetings  
✅ **Privacy Protected:** Meeting details hidden from non-members  
✅ **Dual Validation:** Checks both user_id and email for participants  
✅ **Complete Visibility:** Users see all relevant meetings (creator + participant)  
✅ **Consistent Behavior:** Standardized error handling across all endpoints

---

### Migration Guide for Developers

#### No Breaking Changes for Legitimate Users
All security fixes maintain backward compatibility for legitimate use cases:
- ✅ Creators still have full access to their meetings
- ✅ Invited participants still have full access
- ✅ API responses unchanged for authorized requests
- ✅ Existing client code continues to work

#### Changes for Error Handling

**Before:**
```javascript
// Had to handle 404 errors for empty results
try {
  const response = await fetch('/api/v1/meetings/participant');
  if (!response.ok && response.status === 404) {
    // Empty results
    setMeetings([]);
  }
} catch (error) {
  showError(error);
}
```

**After (simplified):**
```javascript
// Always get success: true with data array
try {
  const response = await fetch('/api/v1/meetings/participant');
  const data = await response.json();
  
  if (response.ok) {
    setMeetings(data.data); // Always an array, even if empty
  } else {
    showError(data.message);
  }
} catch (error) {
  showError('Network error');
}
```

#### Changes for Unauthorized Access

**New 403 Responses:**
- Attempting to view non-invited meeting: `403 Forbidden`
- Attempting to join non-invited meeting: `403 Forbidden`
- Attempting to access different campus meeting: `403 Forbidden`

**Handle in Client:**
```javascript
if (response.status === 403) {
  showError("You don't have permission to access this meeting");
  redirectToMeetingList();
}
```

---

### Testing Recommendations

**Verify Security Fixes:**

1. **Test Meeting Visibility:**
   - Create meeting as User A
   - Add User B as participant
   - Login as User B
   - Verify User B sees the meeting in their list ✅

2. **Test Access Control:**
   - Create meeting as User A
   - Login as User C (not invited)
   - Attempt to view meeting details
   - Verify receives 403 Forbidden ✅

3. **Test Join Validation:**
   - Create meeting as User A
   - Login as User C (not invited)
   - Attempt to join meeting (with correct password)
   - Verify receives 403 Forbidden ✅

4. **Test Empty Results:**
   - Login as new user with no meetings
   - Call GET /api/v1/meetings/participant
   - Verify receives 200 OK with empty array ✅

---

### Performance Impact

**Added Security Checks:**
- User email lookup: ~5ms (only when needed for email-based participant check)
- Array includes operations: <1ms
- Total added latency: ~5-10ms per request

**Recommendations:**
- Consider caching user emails for active participants
- Add database indexes on campus_id and participants fields
- Monitor API response times

---

### Additional Documentation

For more detailed information about the security fixes:

- **MEETING_SECURITY_FIXES.md** - Detailed technical analysis with code examples
- **MEETING_SYSTEM_ISSUES_FOUND.md** - Original audit report
- **SECURITY_AUDIT_SUMMARY.md** - Quick reference summary
- **MEETING_FINAL_FIXES.md** - Complete deployment guide
- **QUICK_REFERENCE_FIXES.md** - Quick reference card

---

## Support & Contact

**Documentation:** [https://docs.kcs-system.com](https://docs.kcs-system.com)  
**API Status:** [https://status.kcs-system.com](https://status.kcs-system.com)  
**Technical Support:** support@omyra.dev  
**Emergency Support:** Available 24/7 for critical issues

**Recent Security Updates:** All critical security issues fixed as of October 27, 2025. See [Recent Updates & Security Fixes](#recent-updates--security-fixes) section for details.

---

*This document covers the complete KCS Meeting System API and WebSocket implementation. For code examples and integration guides, please refer to the developer documentation.*

**Document Version:** 2.1  
**Last Updated:** October 27, 2025  
**Security Update:** October 27, 2025 - All critical issues fixed  
**Next Review:** January 2026
