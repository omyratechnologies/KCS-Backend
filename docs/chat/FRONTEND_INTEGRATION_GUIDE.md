# 🚀 Frontend Integration - Quick Reference Guide

**For:** Frontend Developers  
**Date:** November 5, 2025  
**Status:** Ready for Integration

---

## 🎯 New API Endpoints

### 1. Delete Chat
```typescript
DELETE /api/chat/rooms/:room_id
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "room_id": "room_123",
    "deleted_at": "2025-11-05T10:30:00Z",
    "type": "soft_delete" // or "member_removed" or "hard_delete"
  }
}
```

### 2. Clear Chat Messages
```typescript
// Clear for me only
DELETE /api/chat/rooms/:room_id/messages
Authorization: Bearer <token>

// Clear for everyone (admin)
DELETE /api/chat/rooms/:room_id/messages?for_everyone=true
Authorization: Bearer <token>

// Response
{
  "success": true,
  "message": "Messages cleared for you",
  "data": {
    "room_id": "room_123",
    "cleared_at": "2025-11-05T10:30:00Z",
    "for_everyone": false
  }
}
```

### 3. Archive/Unarchive Chat
```typescript
PUT /api/chat/rooms/:room_id/archive
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_archived": true  // or false to unarchive
}

// Response
{
  "success": true,
  "data": {
    "room_id": "room_123",
    "is_archived": true,
    "archived_at": "2025-11-05T10:30:00Z"
  }
}
```

### 4. Update Read Status
```typescript
PUT /api/chat/rooms/:room_id/read-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_read": true,  // false to mark as unread
  "last_read_message_id": "msg_456"  // optional
}

// Response
{
  "success": true,
  "data": {
    "room_id": "room_123",
    "unread_count": 0,
    "last_read_message_id": "msg_456",
    "read_at": "2025-11-05T10:30:00Z"
  }
}
```

### 5. Get Chat Rooms (Enhanced)
```typescript
// Get all non-archived chats (default)
GET /api/chat/rooms
Authorization: Bearer <token>

// Get only archived chats
GET /api/chat/rooms?archived=true

// Get only non-archived chats (explicit)
GET /api/chat/rooms?archived=false

// Response now includes:
{
  "success": true,
  "data": [
    {
      "id": "room_123",
      "name": "Chat Name",
      "members": ["user1", "user2"],
      "is_archived": false,      // NEW
      "archived_at": null,        // NEW
      "is_muted": false,          // NEW
      "muted_until": null,        // NEW
      "last_read_at": "...",      // NEW
      "unread_count": 5           // NEW (calculated)
    }
  ]
}
```

---

## 🔌 WebSocket Events

### Heartbeat (Keep Connection Alive)
```typescript
// Send ping every 25 seconds
setInterval(() => {
  socket.emit('ping');
}, 25000);

// Listen for pong response
socket.on('pong', () => {
  console.log('Connection alive');
});
```

### New Events to Listen For

#### Room Archived
```typescript
socket.on('room-archived', (data) => {
  console.log('Room archived:', data);
  // data: { room_id, is_archived, archived_at }
  
  // Update UI: Move to archived section or hide from main list
});
```

#### Room Deleted
```typescript
socket.on('room-deleted', (data) => {
  console.log('Room deleted:', data);
  // data: { room_id, deleted_by, deleted_at, type }
  
  // Update UI: Remove from chat list
});
```

#### Room Messages Cleared
```typescript
socket.on('room-messages-cleared', (data) => {
  console.log('Messages cleared:', data);
  // data: { room_id, cleared_by, cleared_at, for_everyone }
  
  // Update UI: Clear message history in that room
});
```

#### User Left Room
```typescript
socket.on('user-left-room', (data) => {
  console.log('User left:', data);
  // data: { room_id, user_id, left_at }
  
  // Update UI: Remove user from participants list
});
```

### Enhanced Seen Receipts
```typescript
// Mark messages as seen
socket.emit('mark-messages-seen', {
  roomId: 'room_123',
  messageIds: ['msg1', 'msg2', 'msg3']
});

// Listen for seen receipts (when someone reads your messages)
socket.on('messages-seen', (data) => {
  console.log('Messages seen by:', data);
  // data: {
  //   roomId: 'room_123',
  //   messageIds: ['msg1', 'msg2'],
  //   seenBy: {
  //     userId: 'user_456',
  //     userName: 'John Doe',
  //     seenAt: '2025-11-05T10:30:00Z'
  //   }
  // }
  
  // Update UI: Show "Seen by John Doe" under message
});

// Acknowledgment (your request was processed)
socket.on('messages-seen-acknowledged', (data) => {
  console.log('Seen acknowledged:', data);
  // data: { success: true, roomId: 'room_123', messageIds: [...] }
});

// Updated unread count
socket.on('unread-count', (data) => {
  console.log('Unread count updated:', data);
  // data: { roomId: 'room_123', count: 0 }
  
  // Update UI: Update badge count
});
```

### Offline Message Delivery
```typescript
// When reconnecting after being offline:
socket.on('new-chat-message', (data) => {
  if (data.queued) {
    console.log('Received queued message:', data);
    // This message was sent while you were offline
  }
  
  // Add to message list as normal
});
```

---

## 💡 Usage Examples

### Delete Chat Flow
```typescript
async function deleteChat(roomId: string) {
  try {
    const response = await fetch(`/api/chat/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Remove from UI
      removeRoomFromList(roomId);
      
      // Navigate away if viewing this room
      if (currentRoomId === roomId) {
        navigateToRoomsList();
      }
    }
  } catch (error) {
    showError('Failed to delete chat');
  }
}
```

### Clear Messages Flow
```typescript
async function clearMessages(roomId: string, forEveryone: boolean = false) {
  const url = forEveryone 
    ? `/api/chat/rooms/${roomId}/messages?for_everyone=true`
    : `/api/chat/rooms/${roomId}/messages`;
    
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (forEveryone) {
        // All users will get 'room-messages-cleared' event
        showSuccess('Messages cleared for everyone');
      } else {
        // Clear messages from UI immediately
        clearMessageHistory(roomId);
        showSuccess('Messages cleared for you');
      }
    }
  } catch (error) {
    showError('Failed to clear messages');
  }
}
```

### Archive Chat Flow
```typescript
async function archiveChat(roomId: string, archive: boolean = true) {
  try {
    const response = await fetch(`/api/chat/rooms/${roomId}/archive`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_archived: archive })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update UI
      if (archive) {
        moveToArchivedSection(roomId);
      } else {
        moveToMainSection(roomId);
      }
      
      // Listen for cross-device sync
      socket.on('room-archived', (data) => {
        if (data.room_id === roomId) {
          updateRoomArchiveStatus(roomId, data.is_archived);
        }
      });
    }
  } catch (error) {
    showError('Failed to archive chat');
  }
}
```

### Mark as Read/Unread Flow
```typescript
async function markAsRead(roomId: string, lastMessageId?: string) {
  try {
    const response = await fetch(`/api/chat/rooms/${roomId}/read-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_read: true,
        last_read_message_id: lastMessageId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update unread badge
      updateUnreadBadge(roomId, 0);
    }
  } catch (error) {
    console.error('Failed to mark as read');
  }
}

async function markAsUnread(roomId: string) {
  try {
    const response = await fetch(`/api/chat/rooms/${roomId}/read-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_read: false
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Update unread badge
      updateUnreadBadge(roomId, result.data.unread_count);
    }
  } catch (error) {
    console.error('Failed to mark as unread');
  }
}
```

### Load Archived Chats
```typescript
async function loadArchivedChats() {
  try {
    const response = await fetch('/api/chat/rooms?archived=true', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      displayArchivedChats(result.data);
    }
  } catch (error) {
    showError('Failed to load archived chats');
  }
}
```

---

## 🎨 UI/UX Recommendations

### Delete Chat
- ✅ Show confirmation dialog: "Delete this chat?"
- ✅ For personal chats: "Messages will remain visible to the other person"
- ✅ For group chats: "You will be removed from the group"
- ✅ Swipe-to-delete gesture support

### Clear Messages
- ✅ Two options:
  - "Clear for me" (default)
  - "Clear for everyone" (admin only, show warning)
- ✅ Confirmation dialog with explanation
- ✅ Show cleared timestamp: "Messages before 10:30 AM cleared"

### Archive
- ✅ Swipe gesture to archive
- ✅ "Archived Chats" section in menu
- ✅ Easy unarchive option in room
- ✅ Badge showing archived count

### Read Status
- ✅ Auto-mark as read when viewing messages
- ✅ Long-press to mark as unread
- ✅ Show unread badge on room list
- ✅ Unread indicator dot

---

## 🔄 State Management

### Room State
```typescript
interface ChatRoom {
  id: string;
  name: string;
  members: string[];
  
  // New fields
  is_archived: boolean;
  archived_at: Date | null;
  is_muted: boolean;
  muted_until: Date | null;
  last_read_at: Date | null;
  unread_count: number;
}
```

### Update Room State on Events
```typescript
// Archive event
socket.on('room-archived', (data) => {
  updateRoomInStore(data.room_id, {
    is_archived: data.is_archived,
    archived_at: data.archived_at
  });
});

// Delete event
socket.on('room-deleted', (data) => {
  removeRoomFromStore(data.room_id);
});

// Messages cleared event
socket.on('room-messages-cleared', (data) => {
  clearMessagesInStore(data.room_id);
});

// Unread count update
socket.on('unread-count', (data) => {
  updateRoomInStore(data.roomId, {
    unread_count: data.count
  });
});
```

---

## ⚠️ Important Notes

### Message Filtering
- Messages older than `messages_cleared_at` won't be returned by GET /messages
- No need to filter on frontend - already filtered by backend

### Soft Delete
- Deleted personal chats only affect the requesting user
- Other user still sees the chat normally
- Messages are preserved

### Archive
- Per-user feature - only affects your view
- Other users don't see your archived status
- Use `?archived=true` to load archived chats

### Unread Count
- Calculated from Redis cache (very fast)
- Automatically updated on mark-as-seen
- Syncs across devices via WebSocket

### Offline Messages
- Automatically queued when user is offline
- Delivered immediately on reconnect
- Max 100 messages queued per user

---

## 🐛 Error Handling

### Common Errors
```typescript
// 400 Bad Request
{
  "success": false,
  "error": "Either room_id or recipient_id is required"
}

// 403 Forbidden
{
  "success": false,
  "error": "Only room creator or admins can clear messages for everyone"
}

// 404 Not Found
{
  "success": false,
  "error": "Chat room not found"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to delete chat: <error details>"
}
```

### Handle Gracefully
```typescript
async function apiCall() {
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!result.success) {
      // Show user-friendly error
      showError(result.error);
      return;
    }
    
    // Success handling
    handleSuccess(result.data);
    
  } catch (error) {
    // Network or parsing error
    showError('Something went wrong. Please try again.');
  }
}
```

---

## 📱 Mobile App Specific

### React Native Example
```typescript
import io from 'socket.io-client';

// Connect
const socket = io('https://api.kcs-platform.com', {
  auth: { token: authToken },
  transports: ['websocket']
});

// Heartbeat
useEffect(() => {
  const interval = setInterval(() => {
    socket.emit('ping');
  }, 25000);
  
  return () => clearInterval(interval);
}, []);

// Handle offline message queue
useEffect(() => {
  socket.on('new-chat-message', (data) => {
    if (data.queued) {
      // Show notification: "You have X offline messages"
      handleQueuedMessage(data);
    } else {
      handleNewMessage(data);
    }
  });
  
  return () => socket.off('new-chat-message');
}, []);
```

---

## ✅ Testing Checklist

- [ ] Delete personal chat (verify other user still sees it)
- [ ] Delete group chat (verify member removal)
- [ ] Clear messages for self (verify filtering works)
- [ ] Clear messages for everyone (admin, verify broadcast)
- [ ] Archive chat (verify appears in archived section)
- [ ] Unarchive chat (verify returns to main list)
- [ ] Mark as read (verify unread count = 0)
- [ ] Mark as unread (verify unread count >= 1)
- [ ] Offline message delivery (disconnect, receive, reconnect)
- [ ] Seen receipts (send message, other user marks as seen)
- [ ] Cross-device sync (archive on device A, verify on device B)
- [ ] Heartbeat (verify connection stays alive)

---

## 🚀 Ready to Integrate!

All backend features are implemented and tested. Start integrating with confidence!

**Questions?** Check the full documentation in `BACKEND_IMPLEMENTATION_COMPLETE.md`

**Happy Coding! 🎉**
