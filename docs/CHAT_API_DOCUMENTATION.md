# Chat System API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Chat Room Management APIs](#chat-room-management-apis)
4. [Personal Messaging APIs](#personal-messaging-apis)
5. [Group Chat APIs](#group-chat-apis)
6. [Message APIs](#message-apis)
7. [Contacts & Validation APIs](#contacts--validation-apis)
8. [WebSocket Integration](#websocket-integration)
9. [User Permissions & Rules](#user-permissions--rules)
10. [Error Handling](#error-handling)
11. [Database Models](#database-models)
12. [Implementation Architecture](#implementation-architecture)

---

## Overview

The Chat System API provides a comprehensive messaging platform for educational institutions. It supports personal messaging, group chats, real-time communication, and role-based messaging permissions.

### Key Features

- ✅ Personal messaging between authorized users
- ✅ Group chats for classes and subjects
- ✅ Role-based messaging permissions (Admin, Teacher, Student)
- ✅ Real-time messaging via WebSocket
- ✅ Message history with pagination
- ✅ Contact discovery based on user roles
- ✅ Chat room management with proper authorization
- ✅ File sharing support (images, documents, audio, video)
- ✅ Message status tracking (sent, delivered, seen)
- ✅ Campus-based isolation for multi-tenant support

### Base URL

```
https://api.kcs-platform.com/api/v1/chat
```

---

## Authentication

All endpoints require JWT authentication via Bearer token containing:
- `user_id`: Unique identifier for the user
- `campus_id`: Campus identifier for multi-tenant isolation
- `user_type`: Role of the user (Admin, Teacher, Student, etc.)

```http
Authorization: Bearer <jwt_token>
```

---

## Chat Room Management APIs

### Get User's Chat Rooms

Retrieve all chat rooms that the authenticated user is a member of.

**Endpoint:** `GET /rooms`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "room_123456",
      "campus_id": "campus_001",
      "room_type": "personal",
      "name": "John Doe & Jane Smith",
      "description": "Personal chat",
      "created_by": "user_001",
      "admin_user_ids": ["user_001", "user_002"],
      "members": ["user_001", "user_002"],
      "class_id": null,
      "subject_id": null,
      "meta_data": {
        "is_default": true,
        "personal_chat_users": ["user_001", "user_002"],
        "last_message": {
          "content": "Hello there!",
          "sender_id": "user_001",
          "timestamp": "2025-08-26T10:30:00Z"
        }
      },
      "is_active": true,
      "is_deleted": false,
      "created_at": "2025-08-26T09:00:00Z",
      "updated_at": "2025-08-26T10:30:00Z"
    }
  ],
  "message": "Chat rooms retrieved successfully"
}
```

---

## Personal Messaging APIs

### Create/Get Personal Chat Room

Create a new personal chat room or retrieve existing one between two users.

**Endpoint:** `POST /personal`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipient_id": "user_002"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "room_123456",
    "campus_id": "campus_001",
    "room_type": "personal",
    "name": "John Doe & Jane Smith",
    "description": "Personal chat",
    "created_by": "user_001",
    "admin_user_ids": ["user_001", "user_002"],
    "members": ["user_001", "user_002"],
    "meta_data": {
      "is_default": true,
      "personal_chat_users": ["user_001", "user_002"]
    },
    "is_active": true,
    "is_deleted": false,
    "created_at": "2025-08-26T09:00:00Z",
    "updated_at": "2025-08-26T09:00:00Z"
  },
  "message": "Personal chat room created/retrieved successfully"
}
```

**Validation Rules:**
- Both users must be in the same campus
- Teachers can message anyone in campus
- Students can message teachers and classmates only
- Admins can message anyone

---

## Group Chat APIs

### Create Group Chat

Create a new group chat room. Only teachers can create group chats.

**Endpoint:** `POST /groups`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Middleware Required:** `teacherMiddleware()`

**Request Body:**
```json
{
  "room_type": "class_group",
  "name": "Class 10 Alpha Discussion",
  "description": "General discussion for Class 10 Alpha",
  "members": ["user_001", "user_002", "user_003"],
  "class_id": "class_123",
  "subject_id": null
}
```

**Room Types:**
- `class_group`: Group for entire class
- `subject_group`: Group for specific subject
- `custom_group`: Custom teacher-created group

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "room_789012",
    "campus_id": "campus_001",
    "room_type": "class_group",
    "name": "Class 10 Alpha Discussion",
    "description": "General discussion for Class 10 Alpha",
    "created_by": "teacher_001",
    "admin_user_ids": ["teacher_001"],
    "members": ["teacher_001", "user_001", "user_002", "user_003"],
    "class_id": "class_123",
    "subject_id": null,
    "meta_data": {
      "is_default": true
    },
    "is_active": true,
    "is_deleted": false,
    "created_at": "2025-08-26T09:00:00Z",
    "updated_at": "2025-08-26T09:00:00Z"
  },
  "message": "Group chat created successfully"
}
```

---

## Message APIs

### Send Message

Send a message to a chat room or personal chat.

**Endpoint:** `POST /rooms/:room_id/messages`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**URL Parameters:**
- `room_id`: ID of the chat room

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "message_type": "text",
  "file_url": null,
  "reply_to": null
}
```

**Message Types:**
- `text`: Regular text message
- `image`: Image file
- `video`: Video file
- `audio`: Audio file
- `file`: Document/file

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_123456",
    "campus_id": "campus_001",
    "room_id": "room_789012",
    "sender_id": "user_001",
    "message_type": "text",
    "content": "Hello everyone!",
    "file_url": null,
    "reply_to": null,
    "is_edited": false,
    "is_deleted": false,
    "is_seen": false,
    "seen_by": [],
    "delivered_to": [],
    "meta_data": {},
    "created_at": "2025-08-26T10:30:00Z",
    "updated_at": "2025-08-26T10:30:00Z"
  },
  "message": "Message sent successfully"
}
```

### Get Messages

Retrieve messages from a chat room with pagination.

**Endpoint:** `GET /rooms/:room_id/messages`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**URL Parameters:**
- `room_id`: ID of the chat room

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Messages per page (default: 50)
- `recipient_id`: For personal messages (alternative to room_id)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_123456",
      "campus_id": "campus_001",
      "room_id": "room_789012",
      "sender_id": "user_001",
      "message_type": "text",
      "content": "Hello everyone!",
      "file_url": null,
      "reply_to": null,
      "is_edited": false,
      "is_deleted": false,
      "is_seen": false,
      "seen_by": [],
      "delivered_to": [],
      "meta_data": {},
      "created_at": "2025-08-26T10:30:00Z",
      "updated_at": "2025-08-26T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25
  },
  "message": "Messages retrieved successfully"
}
```

---

## Contacts & Validation APIs

### Get Available Contacts

Get list of users that the authenticated user can message.

**Endpoint:** `GET /contacts`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Response for Teachers/Admins:**
```json
{
  "success": true,
  "data": {
    "teachers": [
      {
        "id": "teacher_001",
        "user_id": "T001",
        "first_name": "John",
        "last_name": "Doe",
        "user_type": "Teacher",
        "email": "john.doe@school.com",
        "subject": "Mathematics"
      }
    ],
    "students": [
      {
        "id": "student_001",
        "user_id": "S001",
        "first_name": "Jane",
        "last_name": "Smith",
        "user_type": "Student",
        "email": "jane.smith@school.com",
        "class_name": "Class 10 Alpha"
      }
    ],
    "admins": [],
    "total_teachers": 1,
    "total_students": 1,
    "total_admins": 0
  },
  "message": "Available contacts retrieved successfully"
}
```

**Response for Students:**
```json
{
  "success": true,
  "data": {
    "teachers": [
      {
        "id": "teacher_001",
        "user_id": "T001",
        "first_name": "John",
        "last_name": "Doe",
        "user_type": "Teacher",
        "email": "john.doe@school.com"
      }
    ],
    "classmates": [
      {
        "id": "student_002",
        "user_id": "S002",
        "first_name": "Bob",
        "last_name": "Johnson",
        "user_type": "Student",
        "email": "bob.johnson@school.com",
        "class_name": "Class 10 Alpha"
      }
    ],
    "total_teachers": 1,
    "total_classmates": 1
  },
  "message": "Available contacts retrieved successfully"
}
```

### Validate Personal Message

Check if user can send personal message to another user.

**Endpoint:** `POST /validate/personal-message`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recipient_id": "user_002"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "can_message": {
      "canSend": true,
      "reason": null
    },
    "message": "User can send message"
  }
}
```

### Validate Group Creation

Check if user can create a specific type of group.

**Endpoint:** `POST /validate/group-creation`

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "room_type": "class_group",
  "class_id": "class_123",
  "subject_id": null,
  "members": ["user_001", "user_002"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "can_create": true,
    "reason": null
  },
  "message": "Group creation validation completed"
}
```

---

## WebSocket Integration

### Get WebSocket Statistics

Get real-time connection statistics (Admin only).

**Endpoint:** `GET /admin/websocket-stats`

**Headers:**
```http
Authorization: Bearer <jwt_token>
```

**User Role Required:** Admin or Super Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "total_connections": 45,
    "active_rooms": 12,
    "messages_per_minute": 15.2,
    "online_users": [
      {
        "user_id": "user_001",
        "connection_id": "conn_123",
        "connected_at": "2025-08-26T10:00:00Z",
        "room_id": "room_789"
      }
    ]
  },
  "message": "WebSocket statistics retrieved successfully"
}
```

---

## User Permissions & Rules

### Role-Based Messaging Rules

#### Teachers
- ✅ Can message all users in their campus
- ✅ Can create group chats (class, subject, custom)
- ✅ Can message students and other teachers
- ✅ Full access to group creation

#### Students
- ✅ Can message teachers in their campus
- ✅ Can message classmates (same class only)
- ❌ Cannot create group chats
- ❌ Cannot message students from other classes

#### Admins/Super Admins
- ✅ Can message anyone in their campus
- ✅ Can create any type of group chat
- ✅ Access to WebSocket statistics
- ✅ Full messaging privileges

### Campus Isolation
- Users can only interact with others in the same campus
- All chat operations are scoped by `campus_id`
- Cross-campus messaging is not allowed

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Recipient ID is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Invalid or missing authentication token"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Access denied - insufficient privileges"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Chat room not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to process request"
}
```

### Validation Errors

**Personal Message Validation:**
- "User not found"
- "Users must be from the same campus"
- "Students can only message classmates"
- "Messaging not allowed between these user types"

**Group Creation Validation:**
- "Teacher is not authorized for this class"
- "Teacher does not teach this subject"
- "At least one member is required"
- "Invalid group type"

---

## Database Models

### ChatRoom Model

```typescript
interface IChatRoom {
  id: string;
  campus_id: string;
  room_type: "personal" | "class_group" | "subject_group" | "custom_group";
  name: string;
  description?: string;
  created_by: string;
  admin_user_ids: string[];
  members: string[];
  class_id?: string;
  subject_id?: string;
  meta_data: {
    auto_add_students?: boolean;
    is_default?: boolean;
    last_message?: {
      content: string;
      sender_id: string;
      timestamp: Date;
    };
    [key: string]: unknown;
  };
  is_active: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### ChatMessage Model

```typescript
interface IChatMessage {
  id: string;
  campus_id: string;
  room_id: string;
  sender_id: string;
  message_type: "text" | "video" | "image" | "file" | "audio";
  content: string;
  file_url?: string;
  reply_to?: string;
  is_edited: boolean;
  is_deleted: boolean;
  is_seen: boolean;
  seen_by: string[];
  delivered_to: string[];
  meta_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
```

### UserChatStatus Model

```typescript
interface IUserChatStatus {
  id: string;
  user_id: string;
  campus_id: string;
  is_online: boolean;
  last_seen: Date;
  connection_id?: string;
  typing_in_room?: string;
  status_message?: string;
  meta_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
```

---

## Implementation Architecture

### Service Layer Architecture

#### ChatService
- **Purpose:** Core chat operations (rooms, messages)
- **Key Methods:**
  - `createPersonalChatRoom()`
  - `createGroupChatRoom()`
  - `sendMessage()`
  - `getMessages()`
  - `getUserChatRooms()`

#### ChatValidationService
- **Purpose:** Permission validation and contact discovery
- **Key Methods:**
  - `canSendPersonalMessage()`
  - `canCreateGroup()`
  - `getAvailableContacts()`
  - `getUserProfile()`

#### WebSocketChatService
- **Purpose:** Real-time messaging via WebSocket
- **Features:**
  - Connection management
  - Real-time message broadcasting
  - Online status tracking
  - Connection statistics

### Performance Optimizations

#### Caching Strategy
- **Class Cache:** 5-minute TTL for class data
- **Contact Cache:** Optimized parallel queries
- **User Profile Cache:** Efficient user lookup

#### Database Optimizations
- **Parallel Queries:** Simultaneous data fetching
- **Simplified Lookups:** Reduced individual DB calls
- **Index Strategy:** Optimized for common queries

#### Response Time Improvements
- **Before Optimization:** 5-6 seconds
- **After Optimization:** < 1 second
- **Techniques Used:**
  - Parallel database operations
  - Strategic caching
  - Simplified business logic

### Error Handling Strategy

#### Graceful Degradation
- Fallback queries for Ottoman/Couchbase compatibility
- Multiple user lookup strategies
- Comprehensive error logging

#### Validation Pipeline
- JWT token validation
- Campus-based isolation
- Role-based permission checking
- Business rule validation

---

## Testing Guide

### Authentication Testing

```bash
# Get JWT token from login endpoint first
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@school.com", "password": "password123"}'
```

### Get Contacts (Student)

```bash
curl -X GET "http://localhost:3000/api/v1/chat/contacts" \
  -H "Authorization: Bearer <student_jwt_token>"
```

### Create Personal Chat

```bash
curl -X POST "http://localhost:3000/api/v1/chat/personal" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id": "user_002"}'
```

### Send Message

```bash
curl -X POST "http://localhost:3000/api/v1/chat/rooms/room_123/messages" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!", "message_type": "text"}'
```

### Create Group Chat (Teacher Only)

```bash
curl -X POST "http://localhost:3000/api/v1/chat/groups" \
  -H "Authorization: Bearer <teacher_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room_type": "custom_group",
    "name": "Study Group",
    "description": "Mathematics study group",
    "members": ["student_001", "student_002"]
  }'
```

---

## Changelog & Version History

### Version 1.0 (Current)
- ✅ Personal messaging with role-based validation
- ✅ Group chat creation for teachers
- ✅ Contact discovery with performance optimization
- ✅ Message history with pagination
- ✅ WebSocket integration for real-time messaging
- ✅ Comprehensive error handling and validation
- ✅ Campus-based multi-tenant isolation
- ✅ Performance optimization (5-6s → <1s response times)

### Future Enhancements
- 📋 Message read receipts
- 📋 Typing indicators
- 📋 Message reactions/emojis
- 📋 File upload and sharing
- 📋 Message search functionality
- 📋 Push notifications
- 📋 Message encryption
- 📋 Video/audio calling integration

---

## Support & Contact

For API support or implementation questions, please contact the development team or refer to the backend developer guide in `docs/BACKEND_DEVELOPER_GUIDE.md`.
