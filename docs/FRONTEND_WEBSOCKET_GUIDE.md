# 🎯 Frontend WebSocket Implementation Guide

**Version**: 1.0  
**Last Updated**: October 25, 2025  
**Target Audience**: Frontend Developers  
**Backend Server**: Socket.IO v4+

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Connection Setup](#connection-setup)
4. [Authentication](#authentication)
5. [Meeting Events](#meeting-events)
6. [Chat Events](#chat-events)
7. [Event Reference](#event-reference)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Testing Guide](#testing-guide)

---

## 🎯 Overview

### What is This?

This backend provides a **unified Socket.IO server** that handles:
- **Real-time video meetings** (WebRTC signaling)
- **Live chat** (instant messaging)
- **Presence tracking** (online/offline status)
- **Typing indicators**
- **Read receipts**
- **Notifications**

### Server Details

- **Protocol**: Socket.IO (WebSocket + polling fallback)
- **Base URL**: `http://your-server:4501` (Production) or `http://localhost:4501` (Development)
- **Authentication**: JWT Bearer Token
- **Transport**: WebSocket (preferred), Polling (fallback)

---

## ✅ Prerequisites

### Installation

Install the Socket.IO client library:

```bash
# npm
npm install socket.io-client

# yarn
yarn add socket.io-client

# pnpm
pnpm add socket.io-client
```

### Required Data

Before connecting, you need:
1. **JWT Token** - From your login/authentication API
2. **User ID** - Your unique user identifier
3. **Server URL** - WebSocket server endpoint

---

## 🔌 Connection Setup

### Basic Connection

```javascript
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:4501'; // Change for production

const socket = io(SOCKET_SERVER_URL, {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE'
  },
  transports: ['websocket', 'polling'], // Try WebSocket first
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});
```

### React Hook Example

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function useSocket(token) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socketInstance = io('http://localhost:4501', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  return { socket, isConnected };
}

// Usage in component
function ChatApp() {
  const token = localStorage.getItem('authToken');
  const { socket, isConnected } = useSocket(token);

  // Now you can use socket in your component
}
```

### Vue.js Example

```javascript
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useSocket(token) {
  const socket = ref(null);
  const isConnected = ref(false);

  onMounted(() => {
    socket.value = io('http://localhost:4501', {
      auth: { token }
    });

    socket.value.on('connect', () => {
      isConnected.value = true;
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect();
    }
  });

  return { socket, isConnected };
}
```

---

## 🔐 Authentication

### How It Works

1. User logs in via REST API and receives JWT token
2. Frontend stores the token (localStorage, sessionStorage, etc.)
3. Token is sent in the `auth` object when connecting to WebSocket
4. Server validates token on connection
5. If valid, connection is established
6. If invalid, connection is rejected with error

### Connection States

| Event | Description | Action |
|-------|-------------|--------|
| `connect` | Successfully connected | Start using features |
| `disconnect` | Connection lost | Show offline message |
| `connect_error` | Failed to connect | Show error, retry |
| `error` | General error | Handle specific error |

### Handling Authentication Errors

```javascript
socket.on('connect_error', (error) => {
  if (error.message === 'Authentication token missing') {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.message === 'Invalid token') {
    // Token expired, refresh it
    refreshAuthToken();
  } else {
    // Other connection issues
    console.error('Connection error:', error);
  }
});
```

---

## 🎥 Meeting Events

### Overview

Video meetings use WebRTC for audio/video and Socket.IO for signaling and coordination.

### Joining a Meeting

**Step 1: Emit join-meeting**

```javascript
socket.emit('join-meeting', {
  meetingId: 'meeting_123',
  meeting_password: 'optional_password' // If meeting is password-protected
});
```

**Step 2: Listen for success**

```javascript
socket.on('meeting-joined', (data) => {
  console.log('Meeting info:', data.meeting);
  console.log('Your participant ID:', data.participantId);
  console.log('Other participants:', data.participants);
  console.log('WebRTC config:', data.webrtcConfig);
  
  // Now you can set up video/audio streams
  setupMediaStreams(data);
});
```

**Step 3: Handle errors**

```javascript
socket.on('error', (error) => {
  console.error('Error joining meeting:', error.message);
  // Show error to user
  alert(error.message);
});
```

### Leaving a Meeting

```javascript
socket.emit('leave-meeting', {
  meetingId: 'meeting_123'
});
```

### Participant Events

Listen for other participants joining/leaving:

```javascript
// New participant joined
socket.on('participant-joined', (data) => {
  console.log(`${data.userName} joined the meeting`);
  addParticipantToUI(data);
});

// Participant left
socket.on('participant-left', (data) => {
  console.log(`${data.userName} left the meeting`);
  removeParticipantFromUI(data.participantId);
});

// Participant media updated (camera/mic on/off)
socket.on('participant-media-updated', (data) => {
  console.log(`${data.participantId} updated media:`, data);
  updateParticipantMedia(data.participantId, {
    video: data.video,
    audio: data.audio,
    screenSharing: data.screenSharing
  });
});
```

### Meeting Chat

Send messages within a meeting:

```javascript
// Send message
socket.emit('send-message', {
  meetingId: 'meeting_123',
  message: 'Hello everyone!',
  recipientType: 'all', // 'all' | 'private' | 'host'
  recipientId: 'optional_user_id' // For private messages
});

// Receive messages
socket.on('new-message', (message) => {
  console.log('New message:', message);
  addMessageToChatUI(message);
});
```

### Typing Indicator

```javascript
// Notify others you're typing
socket.emit('typing', {
  meetingId: 'meeting_123',
  typing: true // or false when stopped
});

// Listen for others typing
socket.on('user-typing', (data) => {
  if (data.typing) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator(data.userName);
  }
});
```

### Reactions & Hand Raising

```javascript
// Raise hand
socket.emit('raise-hand', {
  meetingId: 'meeting_123',
  raised: true
});

// Send reaction
socket.emit('send-reaction', {
  meetingId: 'meeting_123',
  reaction: '👍' // Any emoji
});

// Listen for reactions
socket.on('participant-reaction', (data) => {
  showReaction(data.participantId, data.reaction);
});

socket.on('hand-raised', (data) => {
  showHandRaised(data.participantId, data.raised);
});
```

### Media Controls

Update your own media status:

```javascript
socket.emit('media-status-update', {
  meetingId: 'meeting_123',
  video: true,  // Camera on/off
  audio: false, // Mic on/off
  screenSharing: false
});
```

### Host Controls (Moderators Only)

```javascript
// Mute a participant
socket.emit('mute-participant', {
  meetingId: 'meeting_123',
  participantId: 'user_456',
  mute: true
});

// Start/stop recording
socket.emit('toggle-recording', {
  meetingId: 'meeting_123',
  start: true
});

// Listen for recording status
socket.on('recording-status-changed', (data) => {
  console.log('Recording:', data.recording ? 'Started' : 'Stopped');
  updateRecordingUI(data.recording);
});

// Host muted you
socket.on('muted-by-host', (data) => {
  if (data.muted) {
    console.log('You were muted by the host');
    muteYourMicrophone();
  }
});
```

---

## 💬 Chat Events

### Overview

The chat system is separate from meeting chat and works like WhatsApp/Telegram.

### Joining Chat Rooms

Before receiving messages, join the rooms you have access to:

```javascript
// Join multiple rooms at once
socket.emit('join-chat-rooms', {
  roomIds: ['room_1', 'room_2', 'room_3']
});

// Confirmation
socket.on('chat-rooms-joined', (data) => {
  if (data.success) {
    console.log('Successfully joined rooms:', data.rooms);
  } else {
    console.error('Failed to join rooms:', data.error);
  }
});
```

### Leaving a Room

```javascript
socket.emit('leave-chat-room', {
  roomId: 'room_1'
});

socket.on('chat-room-left', (data) => {
  console.log('Left room:', data.roomId);
});
```

### Receiving Messages

```javascript
socket.on('new-chat-message', (data) => {
  console.log('New message in room:', data.data);
  
  const message = data.data;
  // message contains: id, content, sender, timestamp, etc.
  
  addMessageToChat(message);
  
  // Play notification sound
  playNotificationSound();
  
  // Show desktop notification if window not focused
  if (!document.hasFocus()) {
    showDesktopNotification(message);
  }
});
```

### Sending Messages

**Important**: Messages are sent via REST API, not WebSocket directly!

```javascript
// Step 1: Send via REST API
const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Hello!',
    message_type: 'text'
  })
});

const newMessage = await response.json();

// Step 2: The server automatically broadcasts to WebSocket
// You'll receive it via 'new-chat-message' event
```

### Typing Indicators

```javascript
let typingTimeout;

// User is typing
function handleTyping() {
  socket.emit('chat-typing', {
    roomId: 'room_1',
    isTyping: true
  });

  // Clear previous timeout
  clearTimeout(typingTimeout);

  // Auto-stop after 3 seconds
  typingTimeout = setTimeout(() => {
    socket.emit('chat-typing', {
      roomId: 'room_1',
      isTyping: false
    });
  }, 3000);
}

// Listen for others typing
socket.on('chat-user-typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.roomId, data.userName);
  } else {
    hideTypingIndicator(data.roomId, data.userId);
  }
});
```

### Read Receipts

Mark messages as seen:

```javascript
// Mark messages as read
socket.emit('mark-messages-seen', {
  roomId: 'room_1',
  messageIds: ['msg_1', 'msg_2', 'msg_3']
});

// Acknowledgment
socket.on('messages-seen-acknowledged', (data) => {
  console.log('Messages marked as seen:', data.messageIds);
});

// Listen for others reading
socket.on('messages-seen', (data) => {
  console.log(`${data.userId} read messages:`, data.messageIds);
  updateReadReceipts(data.roomId, data.messageIds, data.userId);
});
```

### Message Deletion

```javascript
// Server broadcasts deletion automatically
socket.on('chat-message-deleted', (data) => {
  console.log('Message deleted:', data.data.messageId);
  removeMessageFromUI(data.data.messageId);
});
```

### Message Editing

Listen for message edits (editing is done via REST API):

```javascript
socket.on('chat-message-edited', (data) => {
  console.log('Message edited:', data.data);
  const { messageId, newContent, editedBy, timestamp } = data.data;
  
  // Update message in UI
  updateMessageContent(messageId, newContent);
  
  // Show edit indicator
  showEditedBadge(messageId, timestamp);
});
```

### Message Reactions

Listen for reactions being added or removed:

```javascript
socket.on('chat-message-reaction', (data) => {
  console.log('Message reaction:', data.data);
  const { messageId, emoji, userId, action, timestamp } = data.data;
  
  if (action === 'add') {
    // Add reaction to message
    addReactionToMessage(messageId, emoji, userId);
  } else if (action === 'remove') {
    // Remove reaction from message
    removeReactionFromMessage(messageId, emoji, userId);
  }
});
```

### Message Delivery Status

Track message delivery:

```javascript
socket.on('chat-message-delivered', (data) => {
  console.log('Message delivered:', data.data);
  const { messageId, deliveredTo, timestamp } = data.data;
  
  // Update delivery status in UI
  updateMessageDeliveryStatus(messageId, deliveredTo, timestamp);
  
  // Show double checkmark
  showDeliveredIndicator(messageId);
});
```

### Message Seen Status

Individual message seen events:

```javascript
socket.on('chat-message-seen', (data) => {
  console.log('Message seen:', data.data);
  const { messageId, seenBy, timestamp } = data.data;
  
  // Update read receipt in UI
  updateMessageSeenStatus(messageId, seenBy, timestamp);
  
  // Show blue checkmarks
  showSeenIndicator(messageId);
});
```

### Online Status

```javascript
// Update your status
socket.emit('update-chat-status', {
  status: 'online' // 'online' | 'away' | 'busy'
});

// Listen for status changes
socket.on('chat-user-status-changed', (data) => {
  console.log(`${data.userId} is now ${data.status}`);
  updateUserStatus(data.userId, data.status);
});
```

### Online Users in Room

```javascript
// Request online users
socket.emit('get-room-online-users', {
  roomId: 'room_1'
});

// Receive list
socket.on('room-online-users', (data) => {
  console.log(`${data.count} users online in room`);
  data.users.forEach(user => {
    markUserAsOnline(user.userId);
  });
});
```

### Notifications

```javascript
socket.on('chat-notification', (notification) => {
  console.log('Notification:', notification);
  
  switch (notification.type) {
    case 'new_chat':
      // Someone created a new chat with you
      showNotification('New chat created');
      break;
    case 'new_message':
      // New message in inactive room
      showNotification('New message');
      break;
    case 'mention':
      // You were mentioned
      showNotification('You were mentioned');
      break;
    case 'room_created':
      // You were added to a group
      showNotification('Added to group');
      break;
  }
});
```

---

## 📚 Event Reference

### Events You Send (Client → Server)

#### Meeting Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join-meeting` | `{ meetingId, meeting_password? }` | Join a video meeting |
| `leave-meeting` | `{ meetingId }` | Leave a meeting |
| `send-message` | `{ meetingId, message, recipientType, recipientId? }` | Send meeting chat message |
| `typing` | `{ meetingId, typing }` | Typing indicator in meeting |
| `raise-hand` | `{ meetingId, raised }` | Raise/lower hand |
| `send-reaction` | `{ meetingId, reaction }` | Send emoji reaction |
| `media-status-update` | `{ meetingId, video, audio, screenSharing }` | Update your media |
| `mute-participant` | `{ meetingId, participantId, mute }` | Mute participant (host only) |
| `toggle-recording` | `{ meetingId, start }` | Start/stop recording (host only) |

#### Chat Events
| Event | Payload | Description |
|-------|---------|-------------|
| `join-chat-rooms` | `{ roomIds: [] }` | Join multiple chat rooms |
| `leave-chat-room` | `{ roomId }` | Leave a chat room |
| `chat-typing` | `{ roomId, isTyping }` | Typing indicator |
| `mark-messages-seen` | `{ roomId, messageIds: [] }` | Mark messages as read |
| `update-chat-status` | `{ status }` | Update online/away/busy |
| `get-room-online-users` | `{ roomId }` | Get list of online users |

#### WebRTC Events (Advanced)
| Event | Payload | Description |
|-------|---------|-------------|
| `create-transport` | `{ meetingId, direction }` | Create WebRTC transport |
| `connect-transport` | `{ transportId, dtlsParameters }` | Connect transport |
| `produce` | `{ meetingId, kind, rtpParameters }` | Start sending media |
| `consume` | `{ meetingId, producerParticipantId, kind, rtpCapabilities }` | Start receiving media |
| `resume-consumer` | `{ consumerId }` | Resume media stream |
| `pause-consumer` | `{ consumerId }` | Pause media stream |

### Events You Receive (Server → Client)

#### Meeting Events
| Event | Payload | Description |
|-------|---------|-------------|
| `meeting-joined` | `{ meeting, participantId, participants, webrtcConfig }` | Successfully joined meeting |
| `participant-joined` | `{ participantId, userName, userId, permissions }` | New participant joined |
| `participant-left` | `{ participantId, userName }` | Participant left |
| `participant-media-updated` | `{ participantId, video, audio, screenSharing }` | Media status changed |
| `new-message` | `{ message }` | New meeting chat message |
| `user-typing` | `{ userId, userName, typing }` | Typing indicator |
| `participant-reaction` | `{ participantId, userName, reaction, timestamp }` | Emoji reaction |
| `hand-raised` | `{ participantId, userName, raised, timestamp }` | Hand raised/lowered |
| `recording-status-changed` | `{ recording }` | Recording started/stopped |
| `muted-by-host` | `{ muted }` | You were muted by host |

#### Chat Events
| Event | Payload | Description |
|-------|---------|-------------|
| `chat-rooms-joined` | `{ success, rooms, message }` | Room join confirmation |
| `chat-room-left` | `{ success, roomId }` | Room leave confirmation |
| `new-chat-message` | `{ type, data, timestamp }` | New chat message |
| `chat-user-typing` | `{ userId, userName, roomId, isTyping, timestamp }` | Someone is typing |
| `messages-seen` | `{ userId, roomId, messageIds, timestamp }` | Messages marked as read |
| `messages-seen-acknowledged` | `{ success, roomId, messageIds }` | Your read receipt confirmed |
| `chat-message-seen` | `{ type, data: { messageId, seenBy, timestamp } }` | Individual message seen |
| `chat-message-deleted` | `{ type, data: { messageId, deletedBy, timestamp } }` | Message was deleted |
| `chat-message-edited` | `{ type, data: { messageId, newContent, editedBy, timestamp } }` | Message was edited |
| `chat-message-reaction` | `{ type, data: { messageId, emoji, userId, action, timestamp } }` | Reaction added/removed |
| `chat-message-delivered` | `{ type, data: { messageId, deliveredTo, timestamp } }` | Message delivered |
| `chat-user-status-update` | `{ userId, isOnline?, lastSeen?, statusMessage? }` | User status changed |
| `chat-notification` | `{ type, data, timestamp }` | Notification (new chat, mention, etc.) |
| `room-online-users` | `{ roomId, users: [], count }` | List of online users |

#### Connection Events
| Event | Payload | Description |
|-------|---------|-------------|
| `connect` | - | Successfully connected |
| `disconnect` | - | Disconnected from server |
| `connect_error` | `{ message }` | Connection failed |
| `error` | `{ message }` | General error |

---

## ⚠️ Error Handling

### Common Errors

```javascript
socket.on('error', (error) => {
  switch (error.message) {
    case 'Authentication token missing':
      // User not logged in
      redirectToLogin();
      break;
      
    case 'Invalid token':
      // Token expired
      refreshToken();
      break;
      
    case 'Meeting not found':
      // Invalid meeting ID
      showError('Meeting does not exist');
      break;
      
    case 'Access denied':
      // No permission
      showError('You do not have access to this meeting');
      break;
      
    case 'Meeting has ended':
      // Meeting finished
      showError('This meeting has ended');
      break;
      
    case 'Meeting is full':
      // Too many participants
      showError('Meeting has reached maximum capacity');
      break;
      
    case 'Not in meeting':
      // Trying to chat without joining
      showError('Please join the meeting first');
      break;
      
    case 'Only hosts can control recording':
      // Permission denied
      showError('Only hosts can control recording');
      break;
      
    default:
      console.error('Unknown error:', error);
      showError('An error occurred');
  }
});
```

### Connection Issues

```javascript
// Reconnection handling
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnecting...', attemptNumber);
  showReconnectingMessage();
});

socket.on('reconnect', () => {
  console.log('Reconnected!');
  hideReconnectingMessage();
  // Rejoin rooms
  rejoinChatRooms();
});

socket.on('reconnect_failed', () => {
  console.log('Failed to reconnect');
  showOfflineMessage();
});
```

---

## 💡 Practical Implementation Examples

### Complete Chat Message Component

```javascript
// React example with all WebSocket events
import { useState, useEffect } from 'react';

function ChatMessage({ message, socket, currentUserId }) {
  const [content, setContent] = useState(message.content);
  const [reactions, setReactions] = useState(message.reactions || {});
  const [isDelivered, setIsDelivered] = useState(false);
  const [seenBy, setSeenBy] = useState([]);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    // Listen for message edits
    socket.on('chat-message-edited', (data) => {
      if (data.data.messageId === message.id) {
        setContent(data.data.newContent);
        setIsEdited(true);
      }
    });

    // Listen for reactions
    socket.on('chat-message-reaction', (data) => {
      if (data.data.messageId === message.id) {
        const { emoji, userId, action } = data.data;
        setReactions(prev => {
          const updated = { ...prev };
          if (action === 'add') {
            if (!updated[emoji]) updated[emoji] = [];
            if (!updated[emoji].includes(userId)) {
              updated[emoji].push(userId);
            }
          } else if (action === 'remove') {
            if (updated[emoji]) {
              updated[emoji] = updated[emoji].filter(id => id !== userId);
              if (updated[emoji].length === 0) delete updated[emoji];
            }
          }
          return updated;
        });
      }
    });

    // Listen for delivery status
    socket.on('chat-message-delivered', (data) => {
      if (data.data.messageId === message.id) {
        setIsDelivered(true);
      }
    });

    // Listen for seen status
    socket.on('chat-message-seen', (data) => {
      if (data.data.messageId === message.id) {
        setSeenBy(prev => [...prev, data.data.seenBy]);
      }
    });

    return () => {
      socket.off('chat-message-edited');
      socket.off('chat-message-reaction');
      socket.off('chat-message-delivered');
      socket.off('chat-message-seen');
    };
  }, [message.id, socket]);

  const handleReaction = async (emoji) => {
    // Call REST API to add/remove reaction
    const hasReacted = reactions[emoji]?.includes(currentUserId);
    const method = hasReacted ? 'DELETE' : 'POST';
    
    await fetch(`/api/v1/chat/messages/${message.id}/reactions/${emoji}`, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    // WebSocket will broadcast the change automatically
  };

  return (
    <div className="message">
      <div className="message-content">
        {content}
        {isEdited && <span className="edited-badge">edited</span>}
      </div>
      
      {/* Reactions */}
      <div className="message-reactions">
        {Object.entries(reactions).map(([emoji, users]) => (
          <button 
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className={users.includes(currentUserId) ? 'active' : ''}
          >
            {emoji} {users.length}
          </button>
        ))}
      </div>
      
      {/* Status indicators */}
      <div className="message-status">
        {message.senderId === currentUserId && (
          <>
            {!isDelivered && <span>✓</span>}
            {isDelivered && seenBy.length === 0 && <span>✓✓</span>}
            {seenBy.length > 0 && <span className="seen">✓✓</span>}
          </>
        )}
      </div>
    </div>
  );
}
```

### Chat Room with All Features

```javascript
function ChatRoom({ roomId, socket, token, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Join the room
    socket.emit('join-chat-rooms', { roomIds: [roomId] });

    // New message
    socket.on('new-chat-message', (data) => {
      if (data.data.room_id === roomId) {
        setMessages(prev => [...prev, data.data]);
        
        // Auto-mark as delivered
        fetch(`/api/v1/chat/messages/${data.data.id}/delivered`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    });

    // Typing indicators
    socket.on('chat-user-typing', (data) => {
      if (data.roomId === roomId && data.userId !== currentUserId) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          if (data.isTyping) {
            updated.add(data.userName);
          } else {
            updated.delete(data.userName);
          }
          return updated;
        });
      }
    });

    // Message deletion
    socket.on('chat-message-deleted', (data) => {
      setMessages(prev => prev.filter(msg => msg.id !== data.data.messageId));
    });

    // Get online users
    socket.emit('get-room-online-users', { roomId });
    socket.on('room-online-users', (data) => {
      if (data.roomId === roomId) {
        setOnlineUsers(data.users);
      }
    });

    return () => {
      socket.emit('leave-chat-room', { roomId });
      socket.off('new-chat-message');
      socket.off('chat-user-typing');
      socket.off('chat-message-deleted');
      socket.off('room-online-users');
    };
  }, [roomId, socket, token, currentUserId]);

  // Handle typing
  const handleTyping = () => {
    socket.emit('chat-typing', {
      roomId,
      isTyping: true
    });
    
    // Auto-stop after 3 seconds
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      socket.emit('chat-typing', {
        roomId,
        isTyping: false
      });
    }, 3000);
  };

  // Mark messages as seen when visible
  useEffect(() => {
    if (messages.length > 0) {
      const unseenMessages = messages
        .filter(msg => msg.sender_id !== currentUserId && !msg.seen_at)
        .map(msg => msg.id);
      
      if (unseenMessages.length > 0) {
        socket.emit('mark-messages-seen', {
          roomId,
          messageIds: unseenMessages
        });
      }
    }
  }, [messages, currentUserId, roomId, socket]);

  return (
    <div className="chat-room">
      <div className="online-users">
        {onlineUsers.length} online
      </div>
      
      <div className="messages">
        {messages.map(msg => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            socket={socket}
            currentUserId={currentUserId}
          />
        ))}
      </div>
      
      {typingUsers.size > 0 && (
        <div className="typing-indicator">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      
      <input 
        type="text" 
        onKeyDown={handleTyping}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

---

## ✨ Best Practices

### 1. Connection Management

**✅ DO:**
- Store socket instance globally or in state management
- Disconnect when user logs out
- Clean up listeners when components unmount
- Handle reconnection gracefully

**❌ DON'T:**
- Create multiple socket connections
- Leave listeners attached after component unmount
- Ignore connection errors
- Connect without authentication

### 2. Room Management

**✅ DO:**
- Join rooms only when needed
- Leave rooms when navigating away
- Join multiple rooms in one emit (efficient)
- Track which rooms you're in

**❌ DON'T:**
- Join all rooms at once
- Forget to leave rooms
- Join same room multiple times
- Stay in rooms you don't need

### 3. Message Handling

**✅ DO:**
- Send messages via REST API
- Listen for broadcasts via WebSocket
- Show loading states
- Handle send failures

**❌ DON'T:**
- Send messages directly via WebSocket (use REST API)
- Ignore error responses
- Assume messages always arrive
- Duplicate messages in UI

### 4. Performance

**✅ DO:**
- Debounce typing indicators
- Batch read receipts
- Lazy load old messages
- Paginate participant lists

**❌ DON'T:**
- Emit events on every keystroke
- Send read receipts for each message individually
- Load entire chat history at once
- Re-render entire lists on updates

### 5. User Experience

**✅ DO:**
- Show connection status
- Display reconnecting messages
- Indicate when typing
- Confirm message delivery
- Show presence indicators

**❌ DON'T:**
- Hide connection issues
- Leave users wondering if message sent
- Ignore offline state
- Silently fail

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Connection
- [ ] Successfully connect with valid token
- [ ] Rejected with invalid token
- [ ] Reconnect after disconnect
- [ ] Handle network interruption

#### Meetings
- [ ] Join meeting successfully
- [ ] See other participants
- [ ] Leave meeting cleanly
- [ ] Receive participant join/leave events
- [ ] Send and receive chat messages
- [ ] Typing indicators work
- [ ] Reactions appear
- [ ] Hand raise/lower works
- [ ] Host can mute others
- [ ] Recording status updates

#### Chat
- [ ] Join chat rooms
- [ ] Receive new messages instantly
- [ ] Typing indicators show/hide
- [ ] Mark messages as read
- [ ] See when others read messages
- [ ] Message deletion works
- [ ] Message editing updates in real-time
- [ ] Reactions appear and update correctly
- [ ] Delivery status shows correctly
- [ ] Individual seen status updates
- [ ] Online status updates
- [ ] Get online users list
- [ ] Receive notifications

### Testing Tools

#### Browser Console

```javascript
// Connect and log all events
const socket = io('http://localhost:4501', {
  auth: { token: 'YOUR_TOKEN' }
});

// Log all events
const originalEmit = socket.emit;
socket.emit = function() {
  console.log('➡️ EMIT:', arguments[0], arguments[1]);
  return originalEmit.apply(socket, arguments);
};

socket.onAny((event, ...args) => {
  console.log('⬅️ RECEIVE:', event, args);
});
```

#### Network Tab

1. Open DevTools → Network
2. Filter by "WS" (WebSocket)
3. Watch frames being sent/received
4. Verify connection upgrade

---

## 🚀 Quick Start Example

### Complete Working Example

```javascript
import { io } from 'socket.io-client';

// Configuration
const SOCKET_URL = 'http://localhost:4501';
const token = localStorage.getItem('authToken');

// Initialize
const socket = io(SOCKET_URL, {
  auth: { token }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected');
  
  // Join your chat rooms
  socket.emit('join-chat-rooms', {
    roomIds: ['room_1', 'room_2']
  });
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

// Chat events
socket.on('new-chat-message', (data) => {
  console.log('💬 New message:', data.data);
  // Add to UI
});

socket.on('chat-user-typing', (data) => {
  if (data.isTyping) {
    console.log(`⌨️ ${data.userName} is typing...`);
  }
});

socket.on('chat-message-edited', (data) => {
  console.log('✏️ Message edited:', data.data);
  // Update message in UI
});

socket.on('chat-message-reaction', (data) => {
  console.log(`${data.data.emoji} Reaction ${data.data.action}ed`);
  // Update reactions in UI
});

socket.on('chat-message-delivered', (data) => {
  console.log('✓✓ Message delivered:', data.data.messageId);
  // Show delivery status
});

socket.on('chat-message-seen', (data) => {
  console.log('👁️ Message seen:', data.data.messageId);
  // Show read receipt
});

socket.on('chat-message-deleted', (data) => {
  console.log('🗑️ Message deleted:', data.data.messageId);
  // Remove from UI
});

// Meeting events (when in a meeting)
function joinMeeting(meetingId) {
  socket.emit('join-meeting', { meetingId });
}

socket.on('meeting-joined', (data) => {
  console.log('🎥 Joined meeting:', data.meeting);
});

socket.on('participant-joined', (data) => {
  console.log(`👤 ${data.userName} joined`);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

// Cleanup on logout
function logout() {
  socket.disconnect();
  localStorage.removeItem('authToken');
}
```

---

## 📞 Support

### Need Help?

- **Documentation**: Check `CHAT_API_DOCUMENTATION.md` for REST API
- **Examples**: See `CHAT_WEBSOCKET_INTEGRATION.md` for more examples
- **Debugging**: Enable Socket.IO debug mode: `localStorage.debug = 'socket.io-client:*'`

### Common Questions

**Q: Do I send messages via WebSocket?**  
A: No! Send via REST API, receive via WebSocket.

**Q: How do I know if a message was sent?**  
A: Check the REST API response. WebSocket is only for receiving.

**Q: Can I use this without meetings?**  
A: Yes! Chat works independently of meetings.

**Q: What happens if I'm offline?**  
A: Messages are stored. You'll receive them when reconnecting.

**Q: How many rooms can I join?**  
A: No hard limit, but join only what you need for performance.

---

## ✅ Summary

### You Now Know:

✅ How to connect to the WebSocket server  
✅ How authentication works  
✅ All meeting-related events  
✅ All chat-related events (including new features)  
✅ Message editing with real-time updates  
✅ Reaction system (add/remove emojis)  
✅ Delivery and read receipt tracking  
✅ Individual and bulk message seen events  
✅ Error handling patterns  
✅ Best practices for performance  
✅ Complete implementation examples  
✅ Testing strategies

### Chat Features Supported:

📱 **Core Messaging**
- Send/receive messages via REST API + WebSocket
- Real-time message delivery
- Message history with pagination

✏️ **Message Actions**
- Edit messages (15-minute window)
- Delete messages
- Search messages with filters

❤️ **Engagement**
- Emoji reactions (add/remove)
- Typing indicators
- @mentions support

✓ **Status Tracking**
- Delivery status (single checkmark)
- Read receipts (double checkmark)
- Individual and bulk seen events
- Online/offline presence

👥 **Group Features**
- Group chat creation (teachers)
- Online users list
- Room-based notifications

### Next Steps:

1. Install `socket.io-client`
2. Get your JWT token
3. Connect to the server
4. Join chat rooms
5. Listen for all events (messages, edits, reactions, delivery, seen)
6. Implement UI components with status indicators
7. Handle reconnection gracefully
8. Test all features!

**Happy coding! 🚀**

---

**Document Version**: 2.0  
**Last Updated**: October 26, 2025  
**Maintained By**: Backend Team
