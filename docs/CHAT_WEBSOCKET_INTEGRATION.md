# 🚀 Real-Time Chat WebSocket Integration Guide

## Overview

This guide covers the complete WebSocket integration for the KCS Chat System, enabling real-time messaging, typing indicators, online status updates, and instant notifications.

**Last Updated**: October 25, 2025  
**Architecture**: Single Socket.IO server for both chat and video meetings  
**Server Port**: Main API Port + 1 (e.g., 4501 if main is 4500)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Connection Setup](#connection-setup)
3. [Chat Events](#chat-events)
4. [Client Integration Examples](#client-integration-examples)
5. [Event Reference](#event-reference)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Unified Socket.IO Server

```
┌─────────────────────────────────────────────────────────┐
│                   Socket.IO Server                      │
│                  (Port: Main + 1)                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐    ┌──────────────────┐         │
│  │  Meeting Events  │    │   Chat Events    │         │
│  ├──────────────────┤    ├──────────────────┤         │
│  │ • join-meeting   │    │ • join-chat-rooms│         │
│  │ • webrtc-signal  │    │ • send-message   │         │
│  │ • screen-share   │    │ • typing         │         │
│  │ • chat-in-meet   │    │ • mark-seen      │         │
│  └──────────────────┘    └──────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘
           │                           │
           ▼                           ▼
    REST API Layer           Real-Time Broadcasting
    (HTTP Endpoints)         (WebSocket Events)
```

### Real-Time Flow

```
User sends message → REST API → ChatService.sendMessage()
                                       │
                                       ├─→ Save to Database
                                       │
                                       └─→ SocketService.broadcastChatMessage()
                                                 │
                                                 ▼
                                    All room members receive
                                    'new-chat-message' event
```

---

## Connection Setup

### Server Configuration

**File**: `src/index.ts`

```typescript
// Socket.IO server runs on main port + 1
const server = createServer();
SocketService.initialize(server);
server.listen(Number(config.PORT) + 1); // Port 4501
```

### Client Connection

#### JavaScript/TypeScript

```typescript
import { io } from 'socket.io-client';

// Get JWT token from login
const token = localStorage.getItem('auth_token');

// Connect to WebSocket server
const socket = io('http://localhost:4501', {
    auth: {
        token: token // JWT token for authentication
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Connection status
socket.on('connect', () => {
    console.log('✅ Connected to chat server');
    console.log('Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
});

socket.on('error', (error) => {
    console.error('🔴 Socket error:', error);
});
```

#### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useChatSocket = (token: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:4501', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log('Connected to chat');
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token]);

    return { socket, isConnected };
};
```

---

## Chat Events

### 1. Join Chat Rooms

After connecting, join all chat rooms you're a member of.

**Client Emits:**

```typescript
socket.emit('join-chat-rooms', {
    roomIds: ['room_123', 'room_456', 'room_789']
});
```

**Server Responds:**

```typescript
socket.on('chat-rooms-joined', (data) => {
    console.log('Joined rooms:', data);
    // {
    //   success: true,
    //   rooms: ['room_123', 'room_456', 'room_789'],
    //   message: 'Successfully joined chat rooms'
    // }
});
```

### 2. Send Message (via REST API)

Messages are sent via REST API and automatically broadcasted via WebSocket.

**REST API Call:**

```typescript
const sendMessage = async (roomId: string, content: string) => {
    const response = await fetch(`/api/v1/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content,
            message_type: 'text'
        })
    });
    
    return response.json();
};
```

**WebSocket Broadcast (Automatic):**

```typescript
// All room members receive this event
socket.on('new-chat-message', (data) => {
    console.log('New message received:', data);
    // {
    //   type: 'new_message',
    //   data: {
    //     id: 'msg_123',
    //     room_id: 'room_456',
    //     sender_id: 'user_001',
    //     content: 'Hello everyone!',
    //     message_type: 'text',
    //     created_at: '2025-10-25T10:30:00Z',
    //     ...
    //   },
    //   timestamp: '2025-10-25T10:30:00.123Z'
    // }
    
    // Add to your message list UI
    addMessageToUI(data.data);
});
```

### 3. Typing Indicators

Show when users are typing in real-time.

**Client Emits (Start Typing):**

```typescript
const startTyping = (roomId: string) => {
    socket.emit('chat-typing', {
        roomId: roomId,
        isTyping: true
    });
};
```

**Client Emits (Stop Typing):**

```typescript
const stopTyping = (roomId: string) => {
    socket.emit('chat-typing', {
        roomId: roomId,
        isTyping: false
    });
};
```

**Client Receives:**

```typescript
socket.on('chat-user-typing', (data) => {
    console.log('User typing:', data);
    // {
    //   userId: 'user_001',
    //   userName: 'John Doe',
    //   roomId: 'room_456',
    //   isTyping: true,
    //   timestamp: '2025-10-25T10:30:00Z'
    // }
    
    // Update UI to show "John Doe is typing..."
    if (data.isTyping) {
        showTypingIndicator(data.userName);
    } else {
        hideTypingIndicator(data.userName);
    }
});
```

### 4. Mark Messages as Seen (Read Receipts)

**Client Emits:**

```typescript
const markAsSeen = (roomId: string, messageIds: string[]) => {
    socket.emit('mark-messages-seen', {
        roomId: roomId,
        messageIds: messageIds
    });
};
```

**Client Receives (Other users notified):**

```typescript
socket.on('messages-seen', (data) => {
    console.log('Messages seen by:', data);
    // {
    //   userId: 'user_002',
    //   roomId: 'room_456',
    //   messageIds: ['msg_123', 'msg_124'],
    //   timestamp: '2025-10-25T10:30:00Z'
    // }
    
    // Update UI to show read receipts
    updateReadReceipts(data.messageIds, data.userId);
});
```

**Acknowledgment:**

```typescript
socket.on('messages-seen-acknowledged', (data) => {
    console.log('Seen status confirmed:', data);
});
```

### 5. Message Deletion

Deleted via REST API, broadcasted via WebSocket.

**REST API:**

```typescript
const deleteMessage = async (messageId: string) => {
    const response = await fetch(`/api/v1/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.json();
};
```

**WebSocket Broadcast:**

```typescript
socket.on('chat-message-deleted', (data) => {
    console.log('Message deleted:', data);
    // {
    //   type: 'message_deleted',
    //   data: {
    //     messageId: 'msg_123',
    //     deletedBy: 'user_001',
    //     timestamp: '2025-10-25T10:30:00Z'
    //   }
    // }
    
    // Remove from UI or mark as deleted
    removeMessageFromUI(data.data.messageId);
});
```

### 6. Online/Offline Status

**Client Emits Status Update:**

```typescript
const updateStatus = (status: 'online' | 'away' | 'busy') => {
    socket.emit('update-chat-status', {
        status: status
    });
};
```

**Client Receives Status Changes:**

```typescript
socket.on('chat-user-status-update', (data) => {
    console.log('User status changed:', data);
    // {
    //   userId: 'user_001',
    //   isOnline: true,
    //   lastSeen: '2025-10-25T10:30:00Z',
    //   timestamp: '2025-10-25T10:30:00Z'
    // }
    
    // Update user status in UI
    updateUserStatusUI(data.userId, data.isOnline);
});
```

### 7. Get Online Users in Room

**Client Emits:**

```typescript
socket.emit('get-room-online-users', {
    roomId: 'room_456'
});
```

**Client Receives:**

```typescript
socket.on('room-online-users', (data) => {
    console.log('Online users:', data);
    // {
    //   roomId: 'room_456',
    //   users: [
    //     { userId: 'user_001', userName: 'John Doe', userType: 'Teacher' },
    //     { userId: 'user_002', userName: 'Jane Smith', userType: 'Student' }
    //   ],
    //   count: 2
    // }
    
    // Display online users list
    displayOnlineUsers(data.users);
});
```

### 8. Chat Notifications

**Client Receives (New Chat Created):**

```typescript
socket.on('chat-notification', (data) => {
    console.log('Chat notification:', data);
    // {
    //   type: 'new_chat',
    //   data: {
    //     roomId: 'room_789',
    //     roomName: 'John Doe & Jane Smith',
    //     initiatedBy: 'user_001',
    //     initiatorName: 'John Doe'
    //   },
    //   timestamp: '2025-10-25T10:30:00Z'
    // }
    
    // Show notification and update chat list
    if (data.type === 'new_chat') {
        showNotification(`New chat from ${data.data.initiatorName}`);
        addChatToList(data.data);
    }
});
```

---

## Client Integration Examples

### Complete React Chat Component

```typescript
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

export const ChatRoom: React.FC<{ roomId: string; token: string }> = ({ roomId, token }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isTyping, setIsTyping] = useState(false);

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io('http://localhost:4501', {
            auth: { token }
        });

        newSocket.on('connect', () => {
            console.log('Connected to chat');
            // Join the room
            newSocket.emit('join-chat-rooms', { roomIds: [roomId] });
        });

        // Listen for new messages
        newSocket.on('new-chat-message', (data) => {
            setMessages(prev => [...prev, data.data]);
        });

        // Listen for typing indicators
        newSocket.on('chat-user-typing', (data) => {
            if (data.roomId === roomId) {
                if (data.isTyping) {
                    setTypingUsers(prev => new Set(prev).add(data.userName));
                } else {
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(data.userName);
                        return newSet;
                    });
                }
            }
        });

        // Listen for message deletions
        newSocket.on('chat-message-deleted', (data) => {
            setMessages(prev => prev.filter(msg => msg.id !== data.data.messageId));
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [roomId, token]);

    // Send message via REST API
    const sendMessage = async () => {
        if (!inputMessage.trim()) return;

        try {
            const response = await fetch(`/api/v1/chat/rooms/${roomId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: inputMessage,
                    message_type: 'text'
                })
            });

            if (response.ok) {
                setInputMessage('');
                stopTyping();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    // Typing indicator with debounce
    useEffect(() => {
        if (!socket) return;

        const timeout = setTimeout(() => {
            if (isTyping) {
                socket.emit('chat-typing', { roomId, isTyping: false });
                setIsTyping(false);
            }
        }, 3000);

        return () => clearTimeout(timeout);
    }, [inputMessage, socket, roomId, isTyping]);

    const startTyping = () => {
        if (!socket || isTyping) return;
        socket.emit('chat-typing', { roomId, isTyping: true });
        setIsTyping(true);
    };

    const stopTyping = () => {
        if (!socket || !isTyping) return;
        socket.emit('chat-typing', { roomId, isTyping: false });
        setIsTyping(false);
    };

    return (
        <div className="chat-room">
            <div className="messages">
                {messages.map(msg => (
                    <div key={msg.id} className="message">
                        <strong>{msg.sender_id}:</strong> {msg.content}
                    </div>
                ))}
            </div>
            
            {typingUsers.size > 0 && (
                <div className="typing-indicator">
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
            )}
            
            <div className="input-area">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => {
                        setInputMessage(e.target.value);
                        startTyping();
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    }}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};
```

---

## Event Reference

### Client → Server Events

| Event | Parameters | Description |
|-------|-----------|-------------|
| `join-chat-rooms` | `{ roomIds: string[] }` | Join multiple chat rooms |
| `leave-chat-room` | `{ roomId: string }` | Leave a specific room |
| `chat-typing` | `{ roomId: string, isTyping: boolean }` | Send typing indicator |
| `mark-messages-seen` | `{ roomId: string, messageIds: string[] }` | Mark messages as read |
| `update-chat-status` | `{ status: 'online' \| 'away' \| 'busy' }` | Update user status |
| `get-room-online-users` | `{ roomId: string }` | Request online users list |

### Server → Client Events

| Event | Data Structure | Description |
|-------|---------------|-------------|
| `chat-rooms-joined` | `{ success: boolean, rooms: string[] }` | Confirmation of room joins |
| `new-chat-message` | `{ type: string, data: Message, timestamp: string }` | New message in room |
| `chat-user-typing` | `{ userId: string, userName: string, roomId: string, isTyping: boolean }` | User typing status |
| `messages-seen` | `{ userId: string, roomId: string, messageIds: string[] }` | Messages marked as read |
| `chat-message-deleted` | `{ type: string, data: { messageId: string, deletedBy: string } }` | Message was deleted |
| `chat-user-status-update` | `{ userId: string, isOnline: boolean, lastSeen: Date }` | User status changed |
| `chat-notification` | `{ type: string, data: any, timestamp: string }` | General chat notification |
| `room-online-users` | `{ roomId: string, users: User[], count: number }` | List of online users |

---

## Testing Guide

### Using Postman/Thunder Client

1. **Get Auth Token:**
```bash
POST http://localhost:4500/api/v1/auth/login
{
  "email": "teacher@school.com",
  "password": "password123"
}
```

2. **Get Chat Rooms:**
```bash
GET http://localhost:4500/api/v1/chat/rooms
Authorization: Bearer <token>
```

3. **Send Message:**
```bash
POST http://localhost:4500/api/v1/chat/rooms/{room_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello from Postman!",
  "message_type": "text"
}
```

### WebSocket Testing with Socket.IO Client

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:4501', {
    auth: {
        token: 'YOUR_JWT_TOKEN_HERE'
    }
});

socket.on('connect', () => {
    console.log('✅ Connected');
    
    // Join rooms
    socket.emit('join-chat-rooms', {
        roomIds: ['room_123']
    });
});

socket.on('new-chat-message', (data) => {
    console.log('📨 New message:', data);
});

socket.on('chat-user-typing', (data) => {
    console.log('⌨️  Typing:', data);
});
```

### Admin WebSocket Stats

```bash
GET http://localhost:4500/api/v1/chat/admin/websocket-stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalConnections": 45,
    "totalUsers": 38,
    "activeChatRooms": 12,
    "message": "Real-time chat statistics",
    "timestamp": "2025-10-25T10:30:00Z"
  }
}
```

---

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to WebSocket server

**Solutions**:
- Verify server is running: `ps aux | grep node`
- Check port is correct (Main port + 1)
- Ensure JWT token is valid and not expired
- Check CORS settings in production

### Messages Not Broadcasting

**Problem**: Messages save but don't appear in real-time

**Checklist**:
1. User has joined the room via `join-chat-rooms` event
2. WebSocket connection is active
3. Check server logs for broadcasting errors
4. Verify room_id matches exactly

### Typing Indicators Not Working

**Problem**: Typing status doesn't show

**Solutions**:
- Ensure `chat-typing` event is emitted with correct roomId
- Check listener is set up before joining room
- Verify debounce logic isn't blocking events

### Performance Issues

**Recommendations**:
- Limit typing indicator frequency (max 1 per second)
- Implement message pagination
- Use connection pooling for database
- Monitor with `getStats()` endpoint

---

## Production Considerations

### CORS Configuration

Update `socket.service.ts` for production:

```typescript
this.io = new SocketIOServer(httpServer, {
    cors: {
        origin: [
            "https://yourdomain.com",
            "https://app.yourdomain.com"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
```

### SSL/TLS

For secure WebSocket (WSS):

```typescript
const socket = io('https://api.yourdomain.com', {
    auth: { token },
    secure: true,
    rejectUnauthorized: true
});
```

### Load Balancing

Use Redis adapter for multiple server instances:

```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

---

## Support

For issues or questions:
- Check server logs: `pm2 logs kcs-backend`
- Monitor WebSocket stats via Admin endpoint
- Review `CHAT_API_DOCUMENTATION.md` for REST API details

**Last Updated**: October 25, 2025
