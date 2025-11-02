# 🔌 Frontend Chat/Messaging System - WebSocket Events Guide

> **Complete real-time WebSocket integration for WhatsApp-like chat experience**  
> Last Updated: November 2, 2025

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Connection Setup](#connection-setup)
3. [Authentication](#authentication)
4. [Connection Events](#connection-events)
5. [Chat Room Events](#chat-room-events)
6. [Message Events](#message-events)
7. [Presence & Typing Events](#presence--typing-events)
8. [Media Events](#media-events)
9. [Multi-Device Events](#multi-device-events)
10. [Enhanced Message Events](#enhanced-message-events)
11. [Group Management Events](#group-management-events)
12. [Admin Events](#admin-events)
13. [Error Handling](#error-handling)
14. [Reconnection Logic](#reconnection-logic)
15. [Complete Implementation Examples](#complete-implementation-examples)
16. [Performance Optimization](#performance-optimization)
17. [Testing & Debugging](#testing--debugging)

---

## 🎯 Overview

The WebSocket system provides real-time, bidirectional communication for:

- ✅ **Instant Message Delivery** - <50ms latency
- ✅ **Typing Indicators** - See when others are typing
- ✅ **Online Status** - Real-time presence updates
- ✅ **Read Receipts** - Message delivery and read status
- ✅ **Reactions** - Real-time emoji reactions
- ✅ **Multi-Device Sync** - Seamless cross-device experience
- ✅ **Group Updates** - Member joins, leaves, metadata changes
- ✅ **Media Upload Progress** - Real-time upload status

### Architecture

```
┌─────────────┐         WebSocket         ┌──────────────┐
│   Client    │ ←────────────────────────→ │    Server    │
│  (Browser)  │    Persistent Connection   │  (Socket.IO) │
└─────────────┘                            └──────────────┘
       │                                           │
       │                                           ↓
       │                                    ┌──────────────┐
       │                                    │    Redis     │
       └───────────────────────────────────→│   Adapter    │
              Events broadcast to all       └──────────────┘
              connected clients
```

---

## 🔌 Connection Setup

### Installation

```bash
# Install Socket.IO client
npm install socket.io-client
# or
yarn add socket.io-client
```

### Basic Connection

```typescript
import { io, Socket } from 'socket.io-client';

// Get JWT token from login
const token = localStorage.getItem('auth_token');

// Connect to WebSocket server
const socket = io('https://devapi.letscatchup-kcs.com', {
  auth: {
    token: token  // JWT authentication
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});
```

### Development URLs

```typescript
// Production
const SOCKET_URL = 'https://devapi.letscatchup-kcs.com';

// Development
const SOCKET_URL = 'http://localhost:4501';
```

---

## 🔐 Authentication

WebSocket connections require JWT authentication passed during connection.

### Connection with Token

```typescript
const socket = io(SOCKET_URL, {
  auth: {
    token: yourJWTToken  // Required
  }
});
```

### Token Contains:
- `user_id` - User identifier
- `campus_id` - Campus/organization
- `user_type` - Role (Student, Teacher, Admin)
- `session_id` - Session identifier

### Token Validation

Server validates token on connection. Invalid tokens will be rejected:

```typescript
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication failed') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

---

## 🔗 Connection Events

### `connect`

**Direction:** Server → Client  
**When:** Successfully connected to server

```typescript
socket.on('connect', () => {
  console.log('✅ Connected to chat server');
  console.log('Socket ID:', socket.id);
  
  // Join your chat rooms after connection
  joinUserChatRooms();
});
```

---

### `disconnect`

**Direction:** Server → Client  
**When:** Disconnected from server

```typescript
socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected - reconnect manually
    socket.connect();
  }
  // else: client disconnected or network issue
});
```

**Disconnect Reasons:**
- `io server disconnect` - Server forced disconnect
- `io client disconnect` - Client called socket.disconnect()
- `ping timeout` - Connection timed out
- `transport close` - Network error
- `transport error` - Connection error

---

### `connect_error`

**Direction:** Server → Client  
**When:** Connection attempt failed

```typescript
socket.on('connect_error', (error) => {
  console.error('🔴 Connection error:', error.message);
  
  if (error.message === 'Authentication token missing') {
    // Redirect to login
  } else if (error.message === 'Invalid token') {
    // Refresh token or logout
  }
});
```

---

## 🏠 Chat Room Events

### `join-chat-rooms`

**Direction:** Client → Server  
**When:** Join multiple chat rooms on connection

**Emit:**
```typescript
socket.emit('join-chat-rooms', {
  roomIds: [
    'chat_room::uuid1',
    'chat_room::uuid2',
    'chat_room::uuid3'
  ]
});
```

**Response:**
```typescript
socket.on('chat-rooms-joined', (data) => {
  console.log('Joined rooms:', data);
  // {
  //   success: true,
  //   rooms: ['chat_room::uuid1', 'chat_room::uuid2', ...],
  //   message: 'Successfully joined chat rooms'
  // }
});
```

**Usage Pattern:**
```typescript
// After login, get user's rooms and join them
async function initializeChat() {
  // 1. Fetch user's chat rooms
  const rooms = await getChatRooms();
  
  // 2. Join all rooms via WebSocket
  const roomIds = rooms.map(room => room.id);
  socket.emit('join-chat-rooms', { roomIds });
  
  // 3. Wait for confirmation
  socket.once('chat-rooms-joined', () => {
    console.log('Ready to receive messages');
  });
}
```

---

### `leave-chat-room`

**Direction:** Client → Server  
**When:** Leave a specific chat room

**Emit:**
```typescript
socket.emit('leave-chat-room', {
  roomId: 'chat_room::uuid'
});
```

**Response:**
```typescript
socket.on('chat-room-left', (data) => {
  console.log('Left room:', data.roomId);
});
```

---

## 💬 Message Events

### `new-chat-message`

**Direction:** Server → Client  
**When:** New message sent in a room you're in

**Listen:**
```typescript
socket.on('new-chat-message', (data) => {
  console.log('📨 New message:', data);
  
  const message = data.data;
  // {
  //   id: 'message::uuid',
  //   room_id: 'chat_room::uuid',
  //   sender_id: 'user::123',
  //   content: 'Hello everyone!',
  //   message_type: 'text',
  //   created_at: '2025-11-02T10:30:00Z',
  //   is_edited: false,
  //   reactions: [],
  //   reply_to: null
  // }
  
  // Add message to UI
  addMessageToChat(message.room_id, message);
  
  // Play notification sound if not sender
  if (message.sender_id !== currentUserId) {
    playNotificationSound();
  }
  
  // Mark as delivered
  socket.emit('mark-message-delivered', {
    messageId: message.id,
    roomId: message.room_id
  });
});
```

**Message Types:**
- `text` - Regular text message
- `image` - Image message
- `video` - Video message
- `audio` - Audio/voice note
- `file` - Document/file
- `system` - System message (e.g., "User joined")

---

### `chat-message-deleted`

**Direction:** Server → Client  
**When:** Message deleted by user or admin

**Listen:**
```typescript
socket.on('chat-message-deleted', (data) => {
  console.log('🗑️ Message deleted:', data);
  
  const { messageId, deletedBy, roomId } = data.data;
  
  // Remove from UI
  removeMessageFromChat(roomId, messageId);
  
  // Show deletion notice if needed
  if (deletedBy !== currentUserId) {
    showNotice(`Message deleted by ${deletedBy}`);
  }
});
```

---

### `chat-message-edited`

**Direction:** Server → Client  
**When:** Message edited by sender

**Listen:**
```typescript
socket.on('chat-message-edited', (data) => {
  console.log('✏️ Message edited:', data);
  
  const { messageId, content, editedBy, roomId } = data.data;
  
  // Update message in UI
  updateMessageInChat(roomId, messageId, {
    content,
    is_edited: true,
    edited_at: new Date()
  });
});
```

---

### `messages-seen`

**Direction:** Server → Client  
**When:** Messages marked as read by someone

**Listen:**
```typescript
socket.on('messages-seen', (data) => {
  console.log('👁️ Messages seen:', data);
  
  const { userId, messageIds, roomId } = data;
  
  // Update read receipts in UI
  messageIds.forEach(msgId => {
    markMessageAsSeenByUser(roomId, msgId, userId);
  });
  
  // Show "Read by John" indicator
  updateReadReceipts(roomId, messageIds, userId);
});
```

---

### `message-delivered`

**Direction:** Server → Client  
**When:** Message delivered to recipient

**Listen:**
```typescript
socket.on('message-delivered', (data) => {
  console.log('✅ Message delivered:', data);
  
  const { messageId, deliveredTo, roomId } = data.data;
  
  // Update delivery status
  updateMessageStatus(roomId, messageId, {
    delivered: true,
    delivered_to: deliveredTo
  });
  
  // Show double checkmark
  showDeliveryCheckmark(messageId);
});
```

---

### `message-reaction-update`

**Direction:** Server → Client  
**When:** Someone adds/removes reaction

**Listen:**
```typescript
socket.on('message-reaction-update', (data) => {
  console.log('👍 Reaction updated:', data);
  
  const { messageId, emoji, userId, action, roomId } = data.data;
  // action: 'add' | 'remove'
  
  if (action === 'add') {
    addReactionToMessage(roomId, messageId, emoji, userId);
  } else {
    removeReactionFromMessage(roomId, messageId, emoji, userId);
  }
});
```

---

### `mark-messages-seen`

**Direction:** Client → Server  
**When:** User reads messages

**Emit:**
```typescript
socket.emit('mark-messages-seen', {
  roomId: 'chat_room::uuid',
  messageIds: [
    'message::uuid1',
    'message::uuid2',
    'message::uuid3'
  ]
});
```

**Implementation with Intersection Observer:**
```typescript
// Auto-mark messages as seen when in viewport
const observer = new IntersectionObserver(
  (entries) => {
    const seenMessageIds = entries
      .filter(entry => entry.isIntersecting)
      .map(entry => entry.target.dataset.messageId)
      .filter(id => !alreadySeen.has(id));
    
    if (seenMessageIds.length > 0) {
      socket.emit('mark-messages-seen', {
        roomId: currentRoomId,
        messageIds: seenMessageIds
      });
      
      seenMessageIds.forEach(id => alreadySeen.add(id));
    }
  },
  { threshold: 0.5 }
);

// Observe message elements
document.querySelectorAll('.message').forEach(el => {
  observer.observe(el);
});
```

---

## 🟢 Presence & Typing Events

### `chat-typing`

**Direction:** Client → Server  
**When:** User starts/stops typing

**Emit:**
```typescript
let typingTimeout: NodeJS.Timeout;

function handleTyping(roomId: string) {
  // Emit typing start
  socket.emit('chat-typing', {
    roomId,
    isTyping: true
  });
  
  // Clear previous timeout
  clearTimeout(typingTimeout);
  
  // Auto-stop after 3 seconds
  typingTimeout = setTimeout(() => {
    socket.emit('chat-typing', {
      roomId,
      isTyping: false
    });
  }, 3000);
}

// On input change
inputElement.addEventListener('input', () => {
  handleTyping(currentRoomId);
});
```

---

### `chat-user-typing`

**Direction:** Server → Client  
**When:** Someone in room is typing

**Listen:**
```typescript
socket.on('chat-user-typing', (data) => {
  console.log('⌨️ User typing:', data);
  
  const { userId, userName, roomId, isTyping } = data;
  
  if (isTyping) {
    showTypingIndicator(roomId, userName);
  } else {
    hideTypingIndicator(roomId, userId);
  }
});
```

**UI Implementation:**
```typescript
const typingUsers = new Map<string, Set<string>>();

function showTypingIndicator(roomId: string, userName: string) {
  if (!typingUsers.has(roomId)) {
    typingUsers.set(roomId, new Set());
  }
  
  typingUsers.get(roomId)!.add(userName);
  updateTypingDisplay(roomId);
}

function updateTypingDisplay(roomId: string) {
  const users = Array.from(typingUsers.get(roomId) || []);
  
  if (users.length === 0) {
    hideTypingIndicator(roomId);
    return;
  }
  
  const text = users.length === 1
    ? `${users[0]} is typing...`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing...`
    : `${users[0]} and ${users.length - 1} others are typing...`;
  
  document.querySelector(`#typing-${roomId}`).textContent = text;
}
```

---

### `update-chat-status`

**Direction:** Client → Server  
**When:** User changes status (online/away/busy)

**Emit:**
```typescript
socket.emit('update-chat-status', {
  status: 'online' // 'online' | 'away' | 'busy'
});
```

**Status Types:**
- `online` - Active and available
- `away` - Inactive but connected
- `busy` - Do not disturb

---

### `chat-user-status-update`

**Direction:** Server → Client  
**When:** User's status changes

**Listen:**
```typescript
socket.on('chat-user-status-update', (data) => {
  console.log('🟢 Status update:', data);
  
  const { userId, isOnline, lastSeen, statusMessage } = data;
  
  // Update user status in UI
  updateUserStatus(userId, {
    online: isOnline,
    lastSeen: new Date(lastSeen)
  });
  
  // Show online indicator
  if (isOnline) {
    showOnlineIndicator(userId);
  } else {
    showLastSeen(userId, lastSeen);
  }
});
```

---

### `get-room-online-users`

**Direction:** Client → Server  
**When:** Request online users in room

**Emit:**
```typescript
socket.emit('get-room-online-users', {
  roomId: 'chat_room::uuid'
});
```

**Response:**
```typescript
socket.on('room-online-users', (data) => {
  console.log('👥 Online users:', data);
  
  const { roomId, users, count } = data;
  // users: [
  //   { userId: 'user::123', userName: 'John', userType: 'Teacher' },
  //   { userId: 'user::456', userName: 'Jane', userType: 'Student' }
  // ]
  
  displayOnlineUsers(roomId, users);
  updateOnlineCount(roomId, count);
});
```

---

### `get-unread-count`

**Direction:** Client → Server  
**When:** Request unread message count

**Emit:**
```typescript
socket.emit('get-unread-count', {
  roomId: 'chat_room::uuid' // optional - omit for all rooms
});
```

**Response:**
```typescript
socket.on('unread-count-update', (data) => {
  console.log('📊 Unread count:', data);
  
  if (data.roomId) {
    // Single room count
    updateRoomBadge(data.roomId, data.count);
  } else {
    // All rooms count
    data.rooms.forEach(room => {
      updateRoomBadge(room.room_id, room.unread_count);
    });
  }
});
```

---

## 📸 Media Events

### `media:upload:request`

**Direction:** Client → Server  
**When:** Request presigned URL for media upload

**Emit:**
```typescript
socket.emit('media:upload:request', {
  fileName: 'photo.jpg',
  fileType: 'image/jpeg',
  fileSize: 2048576,
  messageType: 'image'
});
```

**Response:**
```typescript
socket.on('media:upload:url', (data) => {
  console.log('📤 Upload URL:', data);
  
  const { uploadUrl, fileKey, expiresIn } = data;
  
  // Upload file to presigned URL
  await uploadToPresignedUrl(uploadUrl, file);
  
  // Confirm upload
  socket.emit('media:upload:complete', {
    fileKey,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  });
});
```

---

### `media:upload:complete`

**Direction:** Client → Server  
**When:** Confirm successful media upload

**Emit:**
```typescript
socket.emit('media:upload:complete', {
  fileKey: 'chat-media/campus/user/timestamp-uuid.jpg',
  fileName: 'photo.jpg',
  fileType: 'image/jpeg',
  fileSize: 2048576,
  width: 1920,
  height: 1080
});
```

**Response:**
```typescript
socket.on('media:upload:confirmed', (data) => {
  console.log('✅ Upload confirmed:', data);
  
  const { id, url, thumbnailUrl } = data.data;
  
  // Now send message with media URL
  sendMessage(roomId, 'Check this out!', {
    message_type: 'image',
    file_url: url
  });
});
```

---

### `media:upload:error`

**Direction:** Server → Client  
**When:** Media upload fails

**Listen:**
```typescript
socket.on('media:upload:error', (data) => {
  console.error('❌ Upload failed:', data.error);
  
  showError('Failed to upload media: ' + data.error);
  removeUploadingIndicator();
});
```

---

## 📱 Multi-Device Events

### `device:register`

**Direction:** Client → Server  
**When:** Register new device on connection

**Emit:**
```typescript
socket.emit('device:register', {
  device_id: 'device_abc123',
  device_name: 'iPhone 15 Pro',
  device_type: 'mobile', // 'mobile' | 'web' | 'desktop' | 'tablet'
  platform: 'iOS 17.2',
  app_version: '1.2.0',
  push_token: 'fcm_token_here'
});
```

**Response:**
```typescript
socket.on('device:registered', (data) => {
  console.log('📱 Device registered:', data);
  
  localStorage.setItem('device_id', data.data.device_id);
});
```

---

### `chats:sync`

**Direction:** Client → Server  
**When:** Sync all chats for device

**Emit:**
```typescript
socket.emit('chats:sync', {
  device_id: 'device_abc123'
});
```

**Response:**
```typescript
socket.on('chats:synced', (data) => {
  console.log('🔄 Chats synced:', data);
  
  const { rooms, last_sync_timestamp } = data.data;
  
  // Update local chat list
  updateChatRooms(rooms);
  
  // Save sync timestamp
  localStorage.setItem('last_sync', last_sync_timestamp);
});
```

---

### `messages:sync`

**Direction:** Client → Server  
**When:** Sync messages for a room

**Emit:**
```typescript
socket.emit('messages:sync', {
  room_id: 'chat_room::uuid',
  since_timestamp: '2025-11-02T09:00:00Z',
  limit: 100
});
```

**Response:**
```typescript
socket.on('messages:synced', (data) => {
  console.log('📥 Messages synced:', data);
  
  const { messages, has_more, room_id } = data;
  
  // Add synced messages to chat
  addMessagesToChat(room_id, messages);
  
  // Load more if available
  if (has_more) {
    // Show "Load more" button
  }
});
```

---

### `device:sync`

**Direction:** Client → Server  
**When:** Sync device state across devices

**Emit:**
```typescript
socket.emit('device:sync', {
  device_id: 'device_abc123'
});
```

**Response:**
```typescript
socket.on('device:synced', (data) => {
  console.log('🔄 Device synced:', data);
  
  const { devices, current_device } = data.data;
  
  // Show list of active devices
  displayActiveDevices(devices);
});
```

---

## ⭐ Enhanced Message Events

### `message:forward`

**Direction:** Client → Server  
**When:** Forward message to rooms

**Emit:**
```typescript
socket.emit('message:forward', {
  message_id: 'message::uuid',
  target_room_ids: [
    'chat_room::uuid1',
    'chat_room::uuid2'
  ]
});
```

**Response:**
```typescript
socket.on('message:forwarded', (data) => {
  console.log('↗️ Message forwarded:', data);
  
  const { success, forwarded_count } = data;
  
  showSuccess(`Message forwarded to ${forwarded_count} chats`);
});
```

---

### `message:star`

**Direction:** Client → Server  
**When:** Star/unstar message

**Emit:**
```typescript
socket.emit('message:star', {
  message_id: 'message::uuid'
});
```

**Response:**
```typescript
socket.on('message:starred', (data) => {
  console.log('⭐ Message starred:', data);
  
  const { message_id, is_starred } = data.data;
  
  updateMessageStarStatus(message_id, is_starred);
});
```

---

### `message:starred:list`

**Direction:** Client → Server  
**When:** Get starred messages

**Emit:**
```typescript
socket.emit('message:starred:list', {
  room_id: 'chat_room::uuid', // optional
  page: 1,
  limit: 50
});
```

**Response:**
```typescript
socket.on('message:starred:response', (data) => {
  console.log('⭐ Starred messages:', data);
  
  displayStarredMessages(data.data.messages);
});
```

---

### `message:info`

**Direction:** Client → Server  
**When:** Get message delivery info

**Emit:**
```typescript
socket.emit('message:info', {
  message_id: 'message::uuid'
});
```

**Response:**
```typescript
socket.on('message:info:response', (data) => {
  console.log('ℹ️ Message info:', data);
  
  const { delivered_to, read_by } = data.data;
  
  // Show delivery details
  showMessageInfo({
    delivered: delivered_to.map(d => ({
      user: d.user_id,
      time: d.delivered_at
    })),
    read: read_by.map(r => ({
      user: r.user_id,
      time: r.read_at
    }))
  });
});
```

---

## 👥 Group Management Events

### `group:create`

**Direction:** Client → Server  
**When:** Create new group (via socket)

**Emit:**
```typescript
socket.emit('group:create', {
  name: 'Study Group',
  description: 'Physics homework',
  members: ['user::123', 'user::456']
});
```

---

### `group:update`

**Direction:** Client → Server  
**When:** Update group metadata

**Emit:**
```typescript
socket.emit('group:update', {
  room_id: 'chat_room::uuid',
  name: 'Updated Group Name',
  description: 'New description'
});
```

---

### `group:join`

**Direction:** Client → Server  
**When:** Add member to group

**Emit:**
```typescript
socket.emit('group:join', {
  room_id: 'chat_room::uuid',
  user_id: 'user::789'
});
```

---

### `group:leave`

**Direction:** Client → Server  
**When:** Leave group

**Emit:**
```typescript
socket.emit('group:leave', {
  room_id: 'chat_room::uuid'
});
```

**Response:**
```typescript
socket.on('group:left', (data) => {
  console.log('👋 Left group:', data);
  
  removeGroupFromList(data.room_id);
});
```

---

### `group:removed`

**Direction:** Server → Client  
**When:** Removed from group by admin

**Listen:**
```typescript
socket.on('group:removed', (data) => {
  console.log('❌ Removed from group:', data);
  
  const { room_id, removed_by } = data;
  
  showNotification(`You were removed from the group by ${removed_by}`);
  removeGroupFromList(room_id);
});
```

---

## 🔧 Admin Events

### `admin:user:block`

**Direction:** Server → Client  
**When:** User account blocked

**Listen:**
```typescript
socket.on('admin:user:block', (data) => {
  console.log('🚫 Account blocked:', data);
  
  showError('Your account has been blocked. Please contact support.');
  logoutUser();
});
```

---

### `admin:broadcast`

**Direction:** Server → Client  
**When:** System-wide announcement

**Listen:**
```typescript
socket.on('admin:broadcast', (data) => {
  console.log('📢 System broadcast:', data);
  
  const { title, message, priority } = data;
  
  if (priority === 'high') {
    showModal(title, message);
  } else {
    showNotification(message);
  }
});
```

---

## ⚠️ Error Handling

### Global Error Handler

```typescript
socket.on('error', (error) => {
  console.error('⚠️ Socket error:', error);
  
  switch (error.type) {
    case 'authentication':
      handleAuthError(error);
      break;
    case 'rate_limit':
      showError('Too many requests. Please slow down.');
      break;
    case 'permission':
      showError('You don't have permission for this action.');
      break;
    default:
      showError('An error occurred: ' + error.message);
  }
});
```

---

### Sync Error Handler

```typescript
socket.on('sync:error', (data) => {
  console.error('❌ Sync error:', data);
  
  // Retry sync after delay
  setTimeout(() => {
    retrySync();
  }, 5000);
});
```

---

## 🔄 Reconnection Logic

### Automatic Reconnection

```typescript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server kicked us out - try to reconnect
    socket.connect();
  }
  
  // Show offline indicator
  showOfflineStatus();
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}...`);
  reconnectAttempts = attemptNumber;
  
  if (attemptNumber >= MAX_RECONNECT_ATTEMPTS) {
    showError('Failed to reconnect. Please refresh the page.');
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log('✅ Reconnected after', attemptNumber, 'attempts');
  reconnectAttempts = 0;
  
  // Rejoin rooms
  rejoinChatRooms();
  
  // Sync missed messages
  syncMissedMessages();
  
  // Show online indicator
  showOnlineStatus();
});

socket.on('reconnect_failed', () => {
  console.error('❌ Reconnection failed');
  
  showError('Could not reconnect to server. Please refresh the page.');
});
```

---

### Manual Reconnection

```typescript
function manualReconnect() {
  if (socket.connected) {
    console.log('Already connected');
    return;
  }
  
  console.log('Manual reconnect...');
  socket.connect();
}

// Button click
document.getElementById('reconnect-btn').addEventListener('click', () => {
  manualReconnect();
});
```

---

### Sync After Reconnection

```typescript
async function syncMissedMessages() {
  const lastSyncTime = localStorage.getItem('last_sync_time');
  
  if (!lastSyncTime) return;
  
  const roomIds = getCurrentRoomIds();
  
  for (const roomId of roomIds) {
    socket.emit('messages:sync', {
      room_id: roomId,
      since_timestamp: lastSyncTime,
      limit: 100
    });
  }
  
  // Update sync time
  localStorage.setItem('last_sync_time', new Date().toISOString());
}
```

---

## 💻 Complete Implementation Examples

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useChatSocket(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    // Initialize socket
    const newSocket = io('https://devapi.letscatchup-kcs.com', {
      auth: { token }
    });
    
    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected');
      setConnected(true);
      
      // Join user's chat rooms
      const roomIds = getUserChatRoomIds();
      newSocket.emit('join-chat-rooms', { roomIds });
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected');
      setConnected(false);
    });
    
    // Message events
    newSocket.on('new-chat-message', (data) => {
      setMessages(prev => [...prev, data.data]);
    });
    
    newSocket.on('chat-message-deleted', (data) => {
      setMessages(prev => 
        prev.filter(msg => msg.id !== data.data.messageId)
      );
    });
    
    newSocket.on('chat-user-typing', (data) => {
      // Handle typing indicator
    });
    
    setSocket(newSocket);
    
    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [token]);
  
  // Helper functions
  const sendMessage = (roomId: string, content: string) => {
    if (!socket) return;
    
    socket.emit('send-message', { roomId, content });
  };
  
  const markAsSeen = (roomId: string, messageIds: string[]) => {
    if (!socket) return;
    
    socket.emit('mark-messages-seen', { roomId, messageIds });
  };
  
  return {
    socket,
    connected,
    messages,
    sendMessage,
    markAsSeen
  };
}
```

---

### Vue Composition API Example

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

export function useChatSocket() {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const messages = ref<Message[]>([]);
  const typingUsers = ref<Map<string, string[]>>(new Map());
  
  onMounted(() => {
    const token = localStorage.getItem('auth_token');
    
    socket.value = io('https://devapi.letscatchup-kcs.com', {
      auth: { token }
    });
    
    socket.value.on('connect', () => {
      connected.value = true;
    });
    
    socket.value.on('new-chat-message', (data) => {
      messages.value.push(data.data);
    });
    
    socket.value.on('chat-user-typing', (data) => {
      if (data.isTyping) {
        const users = typingUsers.value.get(data.roomId) || [];
        users.push(data.userName);
        typingUsers.value.set(data.roomId, users);
      } else {
        const users = typingUsers.value.get(data.roomId) || [];
        typingUsers.value.set(
          data.roomId,
          users.filter(u => u !== data.userName)
        );
      }
    });
  });
  
  onUnmounted(() => {
    socket.value?.close();
  });
  
  return {
    socket,
    connected,
    messages,
    typingUsers
  };
}
```

---

### Angular Service Example

```typescript
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private socket: Socket;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private connectedSubject = new BehaviorSubject<boolean>(false);
  
  public messages$: Observable<Message[]> = this.messagesSubject.asObservable();
  public connected$: Observable<boolean> = this.connectedSubject.asObservable();
  
  constructor() {
    this.initSocket();
  }
  
  private initSocket(): void {
    const token = localStorage.getItem('auth_token');
    
    this.socket = io('https://devapi.letscatchup-kcs.com', {
      auth: { token }
    });
    
    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
    });
    
    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
    });
    
    this.socket.on('new-chat-message', (data) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, data.data]);
    });
  }
  
  sendMessage(roomId: string, content: string): void {
    this.socket.emit('send-message', { roomId, content });
  }
  
  joinRooms(roomIds: string[]): void {
    this.socket.emit('join-chat-rooms', { roomIds });
  }
  
  disconnect(): void {
    this.socket.close();
  }
}
```

---

## ⚡ Performance Optimization

### 1. Event Batching

```typescript
class EventBatcher {
  private queue: any[] = [];
  private timer: NodeJS.Timeout | null = null;
  
  add(event: string, data: any) {
    this.queue.push({ event, data });
    
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, 100); // Batch every 100ms
    }
  }
  
  private flush() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    this.timer = null;
    
    // Process batch
    batch.forEach(({ event, data }) => {
      socket.emit(event, data);
    });
  }
}

const batcher = new EventBatcher();

// Usage
batcher.add('mark-messages-seen', { messageId: '1' });
batcher.add('mark-messages-seen', { messageId: '2' });
// Both will be sent together
```

---

### 2. Message Throttling

```typescript
import { throttle } from 'lodash';

// Throttle typing events
const emitTyping = throttle((roomId: string) => {
  socket.emit('chat-typing', { roomId, isTyping: true });
}, 1000);

inputElement.addEventListener('input', () => {
  emitTyping(currentRoomId);
});
```

---

### 3. Virtual Scrolling

```typescript
// For long message lists, use virtual scrolling
import { FixedSizeList } from 'react-window';

function MessageList({ messages }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <Message data={messages[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

### 4. Memory Management

```typescript
// Limit stored messages
const MAX_MESSAGES = 500;

function addMessage(message: Message) {
  messages.push(message);
  
  if (messages.length > MAX_MESSAGES) {
    // Keep only recent messages
    messages = messages.slice(-MAX_MESSAGES);
  }
}

// Clear old data on room change
function changeRoom(newRoomId: string) {
  // Clear previous room's messages
  clearMessagesForRoom(currentRoomId);
  currentRoomId = newRoomId;
}
```

---

## 🧪 Testing & Debugging

### Socket.IO Client Testing

```typescript
import { io } from 'socket.io-client';

// Test script
const socket = io('http://localhost:4501', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.on('connect', () => {
  console.log('✅ Connected');
  
  // Join rooms
  socket.emit('join-chat-rooms', {
    roomIds: ['room_123']
  });
});

socket.on('new-chat-message', (data) => {
  console.log('📨 Message:', data);
});

socket.on('chat-user-typing', (data) => {
  console.log('⌨️ Typing:', data);
});
```

---

### Browser Console Debugging

```javascript
// Enable Socket.IO debug mode
localStorage.debug = 'socket.io-client:socket';

// View all socket events
const originalEmit = socket.emit;
socket.emit = function(...args) {
  console.log('→ Emit:', args[0], args[1]);
  return originalEmit.apply(this, args);
};

socket.onAny((event, ...args) => {
  console.log('← Receive:', event, args);
});
```

---

### Event Monitor

```typescript
class SocketEventMonitor {
  private events = new Map<string, number>();
  
  track(eventName: string) {
    const count = this.events.get(eventName) || 0;
    this.events.set(eventName, count + 1);
  }
  
  getStats() {
    return Object.fromEntries(this.events);
  }
  
  reset() {
    this.events.clear();
  }
}

const monitor = new SocketEventMonitor();

socket.onAny((event) => {
  monitor.track(event);
});

// Check stats
console.table(monitor.getStats());
```

---

## 📚 Quick Reference

### Event Summary Table

| Event | Direction | Purpose |
|-------|-----------|---------|
| `connect` | S→C | Connection established |
| `disconnect` | S→C | Connection lost |
| `join-chat-rooms` | C→S | Join multiple rooms |
| `new-chat-message` | S→C | New message received |
| `chat-typing` | C→S | Typing indicator |
| `chat-user-typing` | S→C | User typing notification |
| `mark-messages-seen` | C→S | Mark messages read |
| `messages-seen` | S→C | Read receipt update |
| `chat-user-status-update` | S→C | Online status change |
| `media:upload:request` | C→S | Request upload URL |
| `device:register` | C→S | Register device |
| `chats:sync` | C→S | Sync chat list |
| `messages:sync` | C→S | Sync messages |

**Legend:** C→S (Client to Server), S→C (Server to Client)

---

## 🔗 Related Documentation

- **[REST API Guide](./FRONTEND_CHAT_API_INTEGRATION_GUIDE.md)** - HTTP endpoints
- **[Chat Features Spec](./chat/chat-features.md)** - Complete feature list
- **[Backend Guide](./BACKEND_DEVELOPER_GUIDE.md)** - Server architecture

---

## 📞 Support

For issues or questions:
- **Email:** support@letscatchup-kcs.com
- **Documentation:** https://docs.letscatchup-kcs.com
- **GitHub:** https://github.com/omyratechnologies/KCS-Backend

---

**Last Updated:** November 2, 2025  
**WebSocket Version:** Socket.IO 4.x  
**Document Version:** 1.0.0
