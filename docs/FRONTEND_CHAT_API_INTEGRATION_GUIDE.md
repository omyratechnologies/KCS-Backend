# 🚀 Frontend Chat/Messaging System - REST API Integration Guide

> **Complete API reference for building a super-fast WhatsApp-like chat experience**  
> Last Updated: November 2, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URLs & Headers](#base-urls--headers)
4. [Chat Room APIs](#chat-room-apis)
5. [Message APIs](#message-apis)
6. [Media Upload APIs](#media-upload-apis)
7. [Multi-Device Sync APIs](#multi-device-sync-apis)
8. [Message Enhancement APIs](#message-enhancement-apis)
9. [Validation & Utility APIs](#validation--utility-apis)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Best Practices](#best-practices)

---

## 🎯 Overview

This API provides a complete WhatsApp-like messaging system with:

- ✅ **1:1 Personal Chats** - Direct messaging between users
- ✅ **Group Chats** - Class, subject, and custom groups
- ✅ **Media Support** - Images, videos, audio, documents
- ✅ **Message Features** - Edit, delete, reactions, replies, forward, star
- ✅ **Real-time Updates** - Typing indicators, read receipts, online status
- ✅ **Multi-Device Sync** - Seamless experience across devices
- ✅ **Optimized Performance** - <50ms message delivery, Redis caching

---

## 🔐 Authentication

All API requests require JWT authentication via Bearer token.

### Get Authentication Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "login_id": "teacher@school.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_here",
  "expires_in": 1732579200,
  "type": "Bearer"
}
```

### Token Contains:
- `user_id` - Unique user identifier
- `campus_id` - Campus/organization identifier
- `user_type` - Role (Student, Teacher, Admin, Parent)
- `session_id` - Session identifier
- `exp` - Expiration timestamp

---

## 🌐 Base URLs & Headers

### Production
```
BASE_URL: https://devapi.letscatchup-kcs.com
SOCKET_URL: https://devapi.letscatchup-kcs.com (upgrades to WebSocket)
```

### Development
```
BASE_URL: http://localhost:4500
SOCKET_URL: http://localhost:4501
```

### Required Headers
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## 📱 Chat Room APIs

### 1. Get User's Chat Rooms

**Endpoint:** `GET /api/chat/rooms`

**Description:** Get all chat rooms (personal + groups) for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chat_room::uuid",
      "campus_id": "campus::main",
      "room_type": "personal",
      "name": "John Doe",
      "description": null,
      "created_by": "user::123",
      "admin_user_ids": [],
      "members": ["user::123", "user::456"],
      "is_active": true,
      "meta_data": {
        "last_message": {
          "content": "Hey, how are you?",
          "sender_id": "user::456",
          "timestamp": "2025-11-02T10:30:00Z"
        }
      },
      "created_at": "2025-10-01T08:00:00Z",
      "updated_at": "2025-11-02T10:30:00Z"
    },
    {
      "id": "chat_room::uuid2",
      "room_type": "class_group",
      "name": "Class 10-A Discussion",
      "members": ["user::123", "user::456", "user::789"],
      "admin_user_ids": ["user::123"],
      "class_id": "class::10a",
      "meta_data": {
        "last_message": {
          "content": "Homework due tomorrow!",
          "sender_id": "user::123",
          "timestamp": "2025-11-02T09:15:00Z"
        }
      }
    }
  ],
  "message": "Chat rooms retrieved successfully"
}
```

**Frontend Usage:**
```typescript
async function getUserChatRooms() {
  const response = await fetch(`${BASE_URL}/api/chat/rooms`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.data; // Array of chat rooms
}
```

---

### 2. Create Personal Chat

**Endpoint:** `POST /api/chat/personal`

**Description:** Create or get existing 1:1 chat with another user.

**Request Body:**
```json
{
  "recipient_id": "user::456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chat_room::uuid",
    "room_type": "personal",
    "name": "Jane Smith",
    "members": ["user::123", "user::456"],
    "created_at": "2025-11-02T10:30:00Z"
  },
  "message": "Personal chat room created/retrieved successfully"
}
```

**Frontend Usage:**
```typescript
async function createPersonalChat(recipientId: string) {
  const response = await fetch(`${BASE_URL}/api/chat/personal`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ recipient_id: recipientId })
  });
  
  return await response.json();
}
```

---

### 3. Create Group Chat (Teachers/Admins Only)

**Endpoint:** `POST /api/chat/groups`

**Description:** Create a new group chat. Requires teacher or admin role.

**Request Body:**
```json
{
  "room_type": "class_group",
  "name": "Class 10-B Math Group",
  "description": "Math homework and discussions",
  "members": ["user::123", "user::456", "user::789"],
  "class_id": "class::10b",
  "subject_id": "subject::math"
}
```

**Room Types:**
- `class_group` - Entire class discussions
- `subject_group` - Subject-specific groups
- `custom_group` - Custom teacher-created groups

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chat_room::uuid",
    "room_type": "class_group",
    "name": "Class 10-B Math Group",
    "admin_user_ids": ["user::123"],
    "members": ["user::123", "user::456", "user::789"],
    "created_at": "2025-11-02T10:30:00Z"
  },
  "message": "Group chat created successfully"
}
```

**Frontend Usage:**
```typescript
async function createGroupChat(groupData: {
  room_type: 'class_group' | 'subject_group' | 'custom_group';
  name: string;
  description?: string;
  members: string[];
  class_id?: string;
  subject_id?: string;
}) {
  const response = await fetch(`${BASE_URL}/api/chat/groups`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(groupData)
  });
  
  return await response.json();
}
```

---

### 4. Get Available Contacts

**Endpoint:** `GET /api/chat/contacts`

**Description:** Get list of users you can message based on your role.

**Response:**
```json
{
  "success": true,
  "data": {
    "teachers": [
      {
        "user_id": "user::123",
        "name": "John Teacher",
        "email": "john@school.com",
        "user_type": "Teacher"
      }
    ],
    "classmates": [
      {
        "user_id": "user::456",
        "name": "Jane Student",
        "email": "jane@school.com",
        "user_type": "Student"
      }
    ],
    "total_teachers": 5,
    "total_classmates": 25
  },
  "message": "Available contacts retrieved successfully"
}
```

**Contact Visibility Rules:**
- **Students:** Can message teachers and classmates
- **Teachers:** Can message everyone (teachers, students, admins, parents)
- **Parents:** Can message teachers and students
- **Admins:** Can message everyone

---

## 💬 Message APIs

### 5. Send Message

**Endpoint:** `POST /api/chat/rooms/:room_id/messages`

**Description:** Send a message to a chat room. Instantly delivered via WebSocket.

**Request Body:**
```json
{
  "content": "Hello everyone! 👋",
  "message_type": "text",
  "reply_to": "message::parent_id",
  "temp_id": "temp_1730556000000_abc123"
}
```

**Message Types:**
- `text` - Regular text message
- `image` - Image file
- `video` - Video file
- `audio` - Audio/voice note
- `file` - Document/file

**Request with Media:**
```json
{
  "content": "Check out this photo!",
  "message_type": "image",
  "file_url": "https://cdn.example.com/images/photo123.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "message::uuid",
    "campus_id": "campus::main",
    "room_id": "chat_room::uuid",
    "sender_id": "user::123",
    "message_type": "text",
    "content": "Hello everyone! 👋",
    "reply_to": "message::parent_id",
    "is_edited": false,
    "is_deleted": false,
    "is_seen": false,
    "seen_by": [],
    "delivered_to": [],
    "reactions": [],
    "created_at": "2025-11-02T10:30:00Z",
    "updated_at": "2025-11-02T10:30:00Z"
  },
  "message": "Message sent successfully"
}
```

**Frontend Usage (Optimistic Updates):**
```typescript
async function sendMessage(roomId: string, content: string, tempId?: string) {
  // 1. Add message to UI immediately (optimistic update)
  const tempMessage = {
    id: tempId || `temp_${Date.now()}_${Math.random()}`,
    content,
    sender_id: currentUserId,
    created_at: new Date().toISOString(),
    _pending: true
  };
  
  addMessageToUI(tempMessage);
  
  // 2. Send to server
  try {
    const response = await fetch(
      `${BASE_URL}/api/chat/rooms/${roomId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          message_type: 'text',
          temp_id: tempId
        })
      }
    );
    
    const data = await response.json();
    
    // 3. Replace temp message with real message
    replaceMessageInUI(tempMessage.id, data.data);
    
    return data;
  } catch (error) {
    // 4. Mark message as failed
    markMessageAsFailed(tempMessage.id);
    throw error;
  }
}
```

---

### 6. Get Messages

**Endpoint:** `GET /api/chat/rooms/:room_id/messages`

**Description:** Get messages from a chat room with pagination.

**Query Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Messages per page (default: 50)

**Request:**
```bash
GET /api/chat/rooms/chat_room::uuid/messages?page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message::uuid",
      "sender_id": "user::123",
      "content": "Hello!",
      "message_type": "text",
      "created_at": "2025-11-02T10:30:00Z",
      "is_edited": false,
      "is_deleted": false,
      "seen_by": ["user::456"],
      "delivered_to": ["user::456", "user::789"],
      "reactions": [
        {
          "emoji": "👍",
          "users": ["user::456"]
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150
  },
  "message": "Messages retrieved successfully"
}
```

**Frontend Usage (Infinite Scroll):**
```typescript
async function loadMessages(roomId: string, page: number = 1) {
  const response = await fetch(
    `${BASE_URL}/api/chat/rooms/${roomId}/messages?page=${page}&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return await response.json();
}

// Load more messages on scroll
async function handleScroll() {
  if (isAtTop() && !loading) {
    const nextPage = currentPage + 1;
    const data = await loadMessages(currentRoomId, nextPage);
    
    if (data.success) {
      prependMessages(data.data);
      setCurrentPage(nextPage);
    }
  }
}
```

---

### 7. Edit Message

**Endpoint:** `PUT /api/chat/messages/:message_id`

**Description:** Edit your own message.

**Request Body:**
```json
{
  "content": "Updated message content"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "message::uuid",
    "content": "Updated message content",
    "is_edited": true,
    "edited_at": "2025-11-02T10:35:00Z"
  },
  "message": "Message edited successfully"
}
```

---

### 8. Delete Message

**Endpoint:** `DELETE /api/chat/messages/:message_id`

**Description:** Delete a message. Students can delete their own messages, teachers can delete any message.

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

### 9. Mark Message as Seen

**Endpoint:** `PUT /api/chat/messages/:message_id/seen`

**Description:** Mark a message as read (read receipt).

**Response:**
```json
{
  "success": true,
  "message": "Message marked as seen"
}
```

**Frontend Usage (Auto Mark as Seen):**
```typescript
// Mark messages as seen when they appear in viewport
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const messageId = entry.target.dataset.messageId;
      markMessageAsSeen(messageId);
    }
  });
}, { threshold: 0.5 });

async function markMessageAsSeen(messageId: string) {
  await fetch(`${BASE_URL}/api/chat/messages/${messageId}/seen`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

---

### 10. Mark Message as Delivered

**Endpoint:** `PUT /api/chat/messages/:message_id/delivered`

**Description:** Mark a message as delivered (delivery receipt).

**Response:**
```json
{
  "success": true,
  "message": "Message marked as delivered"
}
```

---

### 11. Add Reaction (Emoji)

**Endpoint:** `POST /api/chat/messages/:message_id/reactions/:emoji`

**Description:** Add emoji reaction to a message.

**Example:**
```bash
POST /api/chat/messages/message::uuid/reactions/👍
```

**Response:**
```json
{
  "success": true,
  "message": "Reaction added successfully"
}
```

**Frontend Usage:**
```typescript
async function addReaction(messageId: string, emoji: string) {
  // Encode emoji for URL
  const encodedEmoji = encodeURIComponent(emoji);
  
  await fetch(
    `${BASE_URL}/api/chat/messages/${messageId}/reactions/${encodedEmoji}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

// Common reactions
const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
```

---

### 12. Remove Reaction

**Endpoint:** `DELETE /api/chat/messages/:message_id/reactions/:emoji`

**Description:** Remove your emoji reaction from a message.

---

### 13. Search Messages

**Endpoint:** `GET /api/chat/messages/search`

**Description:** Search messages across all chats or specific room.

**Query Parameters:**
- `q` (string) - Search query
- `room_id` (string, optional) - Search in specific room
- `sender_id` (string, optional) - Filter by sender
- `message_type` (string, optional) - Filter by type
- `from_date` (ISO date, optional) - Start date
- `to_date` (ISO date, optional) - End date
- `page` (number) - Page number
- `limit` (number) - Results per page

**Example:**
```bash
GET /api/chat/messages/search?q=homework&room_id=chat_room::uuid&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message::uuid",
      "content": "Don't forget the homework!",
      "sender_id": "user::123",
      "room_id": "chat_room::uuid",
      "created_at": "2025-11-02T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### 14. Get Unread Count

**Endpoint:** `GET /api/chat/unread-count`

**Description:** Get unread message count for all rooms or specific room.

**Query Parameters:**
- `room_id` (string, optional) - Get count for specific room

**Response (All Rooms):**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "room_id": "chat_room::uuid1",
        "unread_count": 5
      },
      {
        "room_id": "chat_room::uuid2",
        "unread_count": 12
      }
    ]
  }
}
```

**Response (Specific Room):**
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  }
}
```

---

## 📸 Media Upload APIs

### 15. Request Presigned Upload URL

**Endpoint:** `POST /api/chat/media/upload-url`

**Description:** Get presigned URL for direct client → CDN upload (recommended for large files).

**Request Body:**
```json
{
  "fileName": "photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 2048576
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://cdn.example.com/presigned-upload-url",
    "fileKey": "chat-media/campus_id/user_id/timestamp-uuid.jpg",
    "expiresIn": 3600,
    "maxFileSize": 104857600
  }
}
```

**Frontend Usage (Direct Upload):**
```typescript
async function uploadMedia(file: File) {
  // Step 1: Request presigned URL
  const urlResponse = await fetch(`${BASE_URL}/api/chat/media/upload-url`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })
  });
  
  const urlData = await urlResponse.json();
  
  // Step 2: Upload directly to CDN
  await fetch(urlData.data.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  });
  
  // Step 3: Confirm upload
  const confirmResponse = await fetch(`${BASE_URL}/api/chat/media/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileKey: urlData.data.fileKey,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })
  });
  
  return await confirmResponse.json();
}
```

---

### 16. Confirm Media Upload

**Endpoint:** `POST /api/chat/media/confirm`

**Description:** Confirm successful media upload and save metadata.

**Request Body:**
```json
{
  "fileKey": "chat-media/campus_id/user_id/timestamp-uuid.jpg",
  "fileName": "photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 2048576,
  "width": 1920,
  "height": 1080,
  "duration": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "upload::uuid",
    "url": "https://cdn.example.com/chat-media/...",
    "thumbnailUrl": "https://cdn.example.com/chat-media/...?width=200",
    "fileKey": "chat-media/..."
  }
}
```

---

### 17. Get Media Metadata

**Endpoint:** `GET /api/chat/media/:upload_id`

**Description:** Get media file metadata and URLs.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "upload::uuid",
    "url": "https://cdn.example.com/...",
    "type": "image/jpeg",
    "size": 2048576,
    "width": 1920,
    "height": 1080,
    "thumbnailUrl": "https://cdn.example.com/...?width=200"
  }
}
```

---

### 18. Delete Media

**Endpoint:** `DELETE /api/chat/media/:upload_id`

**Description:** Delete uploaded media file.

---

## 📱 Multi-Device Sync APIs

### 19. Register Device

**Endpoint:** `POST /api/chat/devices/register`

**Description:** Register a device for multi-device synchronization.

**Request Body:**
```json
{
  "device_id": "device_abc123",
  "device_name": "iPhone 15 Pro",
  "device_type": "mobile",
  "platform": "iOS 17.2",
  "app_version": "1.2.0",
  "push_token": "fcm_token_here"
}
```

**Device Types:**
- `mobile` - Smartphone
- `tablet` - Tablet device
- `desktop` - Desktop app
- `web` - Web browser

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_device::uuid",
    "device_id": "device_abc123",
    "device_name": "iPhone 15 Pro",
    "is_active": true,
    "last_active_at": "2025-11-02T10:30:00Z"
  }
}
```

---

### 20. Get User Devices

**Endpoint:** `GET /api/chat/devices`

**Description:** Get all registered devices for the user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_device::uuid1",
      "device_name": "iPhone 15 Pro",
      "device_type": "mobile",
      "platform": "iOS 17.2",
      "is_active": true,
      "last_active_at": "2025-11-02T10:30:00Z"
    },
    {
      "id": "user_device::uuid2",
      "device_name": "Chrome Browser",
      "device_type": "web",
      "platform": "macOS",
      "is_active": true,
      "last_active_at": "2025-11-02T09:15:00Z"
    }
  ]
}
```

---

### 21. Logout Device

**Endpoint:** `POST /api/chat/devices/:device_id/logout`

**Description:** Deactivate/logout a specific device.

---

### 22. Sync Chats

**Endpoint:** `POST /api/chat/sync/chats`

**Description:** Sync all chat rooms and metadata for a device.

**Request Body:**
```json
{
  "device_id": "device_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "chat_room::uuid",
        "name": "John Doe",
        "unread_count": 5,
        "last_message": {...}
      }
    ],
    "last_sync_timestamp": "2025-11-02T10:30:00Z"
  }
}
```

---

### 23. Sync Messages

**Endpoint:** `POST /api/chat/sync/messages`

**Description:** Sync messages for a specific room since last sync.

**Request Body:**
```json
{
  "room_id": "chat_room::uuid",
  "since_timestamp": "2025-11-02T09:00:00Z",
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "has_more": false,
    "last_sequence": 1523
  }
}
```

---

## ⭐ Message Enhancement APIs

### 24. Forward Message

**Endpoint:** `POST /api/chat/messages/:message_id/forward`

**Description:** Forward a message to multiple chat rooms.

**Request Body:**
```json
{
  "target_room_ids": [
    "chat_room::uuid1",
    "chat_room::uuid2",
    "chat_room::uuid3"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "forwarded_count": 3,
    "failed_count": 0
  }
}
```

---

### 25. Star/Unstar Message

**Endpoint:** `POST /api/chat/messages/:message_id/star`

**Description:** Toggle star/bookmark on a message.

**Response:**
```json
{
  "success": true,
  "data": {
    "is_starred": true
  }
}
```

---

### 26. Get Starred Messages

**Endpoint:** `GET /api/chat/messages/starred`

**Description:** Get all starred/bookmarked messages.

**Query Parameters:**
- `room_id` (optional) - Filter by room
- `page` (number) - Page number
- `limit` (number) - Results per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message::uuid",
      "content": "Important information!",
      "room_id": "chat_room::uuid",
      "starred_at": "2025-11-02T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### 27. Get Message Info

**Endpoint:** `GET /api/chat/messages/:message_id/info`

**Description:** Get detailed delivery and read status for a message.

**Response:**
```json
{
  "success": true,
  "data": {
    "message_id": "message::uuid",
    "delivered_to": [
      {
        "user_id": "user::456",
        "delivered_at": "2025-11-02T10:30:05Z"
      }
    ],
    "read_by": [
      {
        "user_id": "user::456",
        "read_at": "2025-11-02T10:30:15Z"
      }
    ]
  }
}
```

---

## ✅ Validation & Utility APIs

### 28. Validate Personal Message

**Endpoint:** `POST /api/chat/validate/personal-message`

**Description:** Check if you can send a personal message to a user.

**Request Body:**
```json
{
  "recipient_id": "user::456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "can_message": true,
    "message": "User can send message"
  }
}
```

---

### 29. Validate Group Creation

**Endpoint:** `POST /api/chat/validate/group-creation`

**Description:** Check if you can create a specific type of group.

**Request Body:**
```json
{
  "room_type": "class_group",
  "class_id": "class::10a",
  "members": ["user::456", "user::789"]
}
```

---

### 30. Get WebSocket Stats (Admin Only)

**Endpoint:** `GET /api/chat/admin/websocket-stats`

**Description:** Get real-time WebSocket connection statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalConnections": 45,
    "totalUsers": 38,
    "activeChatRooms": 12,
    "timestamp": "2025-11-02T10:30:00Z"
  }
}
```

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |

### Error Handling Example

```typescript
async function handleApiCall() {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!data.success) {
      // Handle API error
      showError(data.error);
      return null;
    }
    
    return data.data;
    
  } catch (error) {
    // Handle network error
    if (error.name === 'NetworkError') {
      showError('No internet connection');
    } else {
      showError('Something went wrong');
    }
    return null;
  }
}
```

---

## 🚦 Rate Limiting

### Limits
- **Messages:** 60 messages per minute per user
- **Media Upload:** 10 uploads per minute per user
- **API Requests:** 1000 requests per hour per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1730556600
```

### Handling Rate Limits

```typescript
function checkRateLimit(response: Response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (response.status === 429) {
    const waitTime = (parseInt(reset!) - Date.now() / 1000);
    showError(`Rate limit exceeded. Try again in ${waitTime} seconds`);
  }
}
```

---

## 🎯 Best Practices

### 1. **Optimistic Updates**
Update UI immediately, then sync with server:

```typescript
// Add message to UI first
addMessageToUI(tempMessage);

// Send to server
sendMessage(content).then(serverMessage => {
  replaceMessageInUI(tempMessage.id, serverMessage);
});
```

### 2. **Message Queuing**
Queue messages when offline:

```typescript
if (navigator.onLine) {
  sendMessage(message);
} else {
  queueMessage(message);
  showInfo('Message will be sent when online');
}

window.addEventListener('online', () => {
  sendQueuedMessages();
});
```

### 3. **Efficient Pagination**
Load messages on demand:

```typescript
// Initial load
loadMessages(roomId, 1);

// Infinite scroll
onScroll(() => {
  if (atTop && !loading) {
    loadMessages(roomId, ++page);
  }
});
```

### 4. **Caching**
Cache chat rooms and recent messages:

```typescript
// Cache for 5 minutes
const cache = new Map();

async function getChatRooms() {
  const cached = cache.get('rooms');
  if (cached && Date.now() - cached.timestamp < 300000) {
    return cached.data;
  }
  
  const data = await fetchChatRooms();
  cache.set('rooms', { data, timestamp: Date.now() });
  return data;
}
```

### 5. **Error Retry Logic**
Implement exponential backoff:

```typescript
async function retryRequest(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

### 6. **Media Optimization**
Compress images before upload:

```typescript
async function compressImage(file: File): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = await createImageBitmap(file);
  
  const maxWidth = 1920;
  const scale = maxWidth / img.width;
  
  canvas.width = maxWidth;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8);
  });
}
```

### 7. **Token Refresh**
Handle token expiration:

```typescript
let token = localStorage.getItem('token');

async function apiCall(url: string, options: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Refresh token
    token = await refreshToken();
    localStorage.setItem('token', token);
    
    // Retry request
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }
  
  return response;
}
```

---

## 📚 Complete Example: Chat Component

```typescript
class ChatService {
  private baseUrl = 'https://devapi.letscatchup-kcs.com';
  private token: string;
  
  constructor(token: string) {
    this.token = token;
  }
  
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    return await response.json();
  }
  
  // Chat Rooms
  async getChatRooms() {
    return this.request('/api/chat/rooms');
  }
  
  async createPersonalChat(recipientId: string) {
    return this.request('/api/chat/personal', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId })
    });
  }
  
  // Messages
  async sendMessage(roomId: string, content: string, tempId?: string) {
    return this.request(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        message_type: 'text',
        temp_id: tempId
      })
    });
  }
  
  async getMessages(roomId: string, page: number = 1) {
    return this.request(
      `/api/chat/rooms/${roomId}/messages?page=${page}&limit=50`
    );
  }
  
  async markAsSeen(messageId: string) {
    return this.request(`/api/chat/messages/${messageId}/seen`, {
      method: 'PUT'
    });
  }
  
  async addReaction(messageId: string, emoji: string) {
    const encoded = encodeURIComponent(emoji);
    return this.request(
      `/api/chat/messages/${messageId}/reactions/${encoded}`,
      { method: 'POST' }
    );
  }
  
  // Media
  async uploadMedia(file: File) {
    // Step 1: Get presigned URL
    const urlData = await this.request('/api/chat/media/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
    });
    
    if (!urlData.success) throw new Error(urlData.error);
    
    // Step 2: Upload to CDN
    await fetch(urlData.data.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    
    // Step 3: Confirm upload
    return this.request('/api/chat/media/confirm', {
      method: 'POST',
      body: JSON.stringify({
        fileKey: urlData.data.fileKey,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
    });
  }
}

// Usage
const chatService = new ChatService('your_jwt_token');

// Get rooms
const rooms = await chatService.getChatRooms();

// Send message
const result = await chatService.sendMessage('room_id', 'Hello!');

// Upload image
const mediaFile = document.querySelector('input[type="file"]').files[0];
const mediaData = await chatService.uploadMedia(mediaFile);
```

---

## 🔗 Related Documentation

- **[WebSocket Events Guide](./FRONTEND_CHAT_WEBSOCKET_EVENTS_GUIDE.md)** - Real-time events
- **[Chat Features Specification](./chat/chat-features.md)** - Complete feature list
- **[Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md)** - Server architecture

---

## 📞 Support

For issues or questions:
- **Email:** support@letscatchup-kcs.com
- **Documentation:** https://docs.letscatchup-kcs.com
- **GitHub Issues:** https://github.com/omyratechnologies/KCS-Backend

---

**Last Updated:** November 2, 2025  
**API Version:** v1  
**Document Version:** 1.0.0
