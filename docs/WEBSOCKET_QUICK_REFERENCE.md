# ⚡ WebSocket Quick Reference Card

**Fast lookup for experienced developers**

---

## 🔌 Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4501', {
  auth: { token: JWT_TOKEN }
});
```

---

## 📋 Quick Event Lookup

### Chat Events

| Send | Receive | Purpose |
|------|---------|---------|
| `join-chat-rooms` | `chat-rooms-joined` | Join rooms |
| `leave-chat-room` | `chat-room-left` | Leave room |
| `chat-typing` | `chat-user-typing` | Typing indicator |
| `mark-messages-seen` | `messages-seen` | Read receipts |
| `update-chat-status` | `chat-user-status-update` | Online status |
| `get-room-online-users` | `room-online-users` | Who's online |
| - | `new-chat-message` | Receive message |
| - | `chat-message-deleted` | Message deleted |
| - | `chat-notification` | System notification |

### Meeting Events

| Send | Receive | Purpose |
|------|---------|---------|
| `join-meeting` | `meeting-joined` | Join meeting |
| `leave-meeting` | - | Leave meeting |
| `send-message` | `new-message` | Meeting chat |
| `typing` | `user-typing` | Typing in meeting |
| `raise-hand` | `hand-raised` | Raise hand |
| `send-reaction` | `participant-reaction` | Send emoji |
| `media-status-update` | `participant-media-updated` | Toggle cam/mic |
| - | `participant-joined` | Someone joined |
| - | `participant-left` | Someone left |

---

## 💬 Common Patterns

### Join Chat Rooms
```javascript
socket.emit('join-chat-rooms', { roomIds: ['room1', 'room2'] });
```

### Receive Messages
```javascript
socket.on('new-chat-message', (data) => {
  addMessage(data.data);
});
```

### Typing Indicator
```javascript
let timeout;
const handleTyping = () => {
  socket.emit('chat-typing', { roomId, isTyping: true });
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    socket.emit('chat-typing', { roomId, isTyping: false });
  }, 3000);
};
```

### Mark as Read
```javascript
socket.emit('mark-messages-seen', {
  roomId: 'room1',
  messageIds: ['msg1', 'msg2']
});
```

### Join Meeting
```javascript
socket.emit('join-meeting', { meetingId: 'meet123' });

socket.on('meeting-joined', (data) => {
  console.log('Participants:', data.participants);
});
```

### Toggle Video/Audio
```javascript
socket.emit('media-status-update', {
  meetingId: 'meet123',
  video: true,
  audio: false,
  screenSharing: false
});
```

---

## ⚠️ Important Notes

### ❌ DON'T Send Messages via WebSocket
```javascript
// ❌ WRONG
socket.emit('send-chat-message', { ... });
```

### ✅ DO Send via REST API
```javascript
// ✅ CORRECT
await fetch('/api/chat/rooms/{id}/messages', {
  method: 'POST',
  body: JSON.stringify({ content: 'Hi!' })
});
// Server auto-broadcasts via WebSocket
```

---

## 🔧 Error Handling

```javascript
socket.on('error', (err) => {
  console.error(err.message);
  // "Authentication token missing"
  // "Invalid token"
  // "Meeting not found"
  // "Access denied"
  // "Meeting has ended"
  // "Meeting is full"
});
```

---

## 🎯 React Hook

```javascript
function useSocket(token) {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const s = io('http://localhost:4501', { auth: { token } });
    setSocket(s);
    return () => s.disconnect();
  }, [token]);
  
  return socket;
}
```

---

## 🧪 Debug Mode

```javascript
// Browser console
localStorage.debug = 'socket.io-client:*';

// Log all events
socket.onAny((event, ...args) => {
  console.log('Event:', event, args);
});
```

---

## 📚 Full Documentation

- `FRONTEND_WEBSOCKET_GUIDE.md` - Complete guide
- `CHAT_API_DOCUMENTATION.md` - REST API reference
- `CHAT_WEBSOCKET_INTEGRATION.md` - Integration examples

---

**Version**: 1.0 | **Updated**: Oct 2025
