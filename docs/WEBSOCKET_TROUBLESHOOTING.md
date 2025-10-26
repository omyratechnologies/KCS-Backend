# 🔧 WebSocket Troubleshooting Guide

**Common issues and solutions for frontend developers**

---

## 🚨 Connection Issues

### Issue: "Cannot connect to WebSocket server"

**Symptoms:**
- Connection never establishes
- `connect_error` event fires
- Console shows connection refused

**Possible Causes & Solutions:**

#### 1. Wrong Server URL
```javascript
// ❌ Wrong
const socket = io('http://localhost:4500'); // This is REST API port

// ✅ Correct
const socket = io('http://localhost:4501'); // WebSocket port
```

#### 2. Missing or Invalid Token
```javascript
// ❌ Wrong
const socket = io('http://localhost:4501');

// ✅ Correct
const socket = io('http://localhost:4501', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

#### 3. CORS Issues
**Check browser console for CORS errors**

Server allows all origins in development, but if you see CORS errors:
```javascript
// Try specifying transport explicitly
const socket = io('http://localhost:4501', {
  auth: { token },
  transports: ['polling', 'websocket'] // Try polling first
});
```

#### 4. Server Not Running
**Check if backend is running:**
```bash
# Should show both ports
Server running on port 4500  (REST API)
Socket.IO server running on port 4501  (WebSocket)
```

If not running:
```bash
npm run dev
# or
bun run dev
```

---

### Issue: "Authentication token missing"

**Symptoms:**
- Connection rejected immediately
- Error message: "Authentication token missing"

**Solution:**

Check you're sending token correctly:
```javascript
// Method 1: Via auth object (RECOMMENDED)
const socket = io(url, {
  auth: {
    token: yourToken
  }
});

// Method 2: Via extraHeaders
const socket = io(url, {
  extraHeaders: {
    Authorization: `Bearer ${yourToken}`
  }
});
```

**Verify token exists:**
```javascript
const token = localStorage.getItem('authToken');
console.log('Token:', token); // Should not be null/undefined

if (!token) {
  // Redirect to login
  window.location.href = '/login';
}
```

---

### Issue: "Invalid token" or "Authentication failed"

**Symptoms:**
- Connection rejected
- Error: "Invalid token"
- Had working token before

**Possible Causes:**

#### 1. Token Expired
```javascript
// Check token expiration (if JWT)
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

if (isTokenExpired(token)) {
  // Refresh token or redirect to login
  await refreshAuthToken();
}
```

#### 2. Wrong Token Format
```javascript
// ❌ Wrong - including "Bearer " prefix
auth: { token: 'Bearer eyJhbGc...' }

// ✅ Correct - just the token
auth: { token: 'eyJhbGc...' }
```

#### 3. Token from Different Environment
```javascript
// Make sure token matches the environment
// Dev token won't work on production server
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.production.com'
  : 'http://localhost:4500';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://socket.production.com'
  : 'http://localhost:4501';
```

---

## 💬 Chat Issues

### Issue: Messages not appearing

**Symptoms:**
- Send message via API
- No error, but message doesn't appear in UI
- Other users don't see it

**Debugging Steps:**

#### 1. Check if you joined the room
```javascript
// Must join room first
socket.emit('join-chat-rooms', {
  roomIds: ['room_123']
});

// Wait for confirmation
socket.on('chat-rooms-joined', (data) => {
  console.log('Joined rooms:', data.rooms);
  // Now you'll receive messages
});
```

#### 2. Check if listener is set up
```javascript
// Set up listener BEFORE joining rooms
socket.on('new-chat-message', (data) => {
  console.log('Received message:', data);
  // Add to UI here
});

// Then join rooms
socket.emit('join-chat-rooms', { roomIds: [...] });
```

#### 3. Verify room ID format
```javascript
// When joining via WebSocket, use just the ID
socket.emit('join-chat-rooms', {
  roomIds: ['room_123']  // ✅ Correct
});

// Server automatically prefixes 'chat_room_'
// You should NOT include prefix:
roomIds: ['chat_room_room_123']  // ❌ Wrong
```

#### 4. Check WebSocket connection
```javascript
console.log('Connected:', socket.connected); // Should be true

socket.on('disconnect', () => {
  console.log('Disconnected! Messages will not arrive.');
});
```

---

### Issue: Typing indicator not working

**Symptoms:**
- Emit typing event
- Others don't see "typing..."
- No errors in console

**Solution:**

#### Proper Implementation
```javascript
let typingTimeout;

function handleInput() {
  // Emit typing start
  socket.emit('chat-typing', {
    roomId: currentRoomId,
    isTyping: true
  });

  // Clear previous timeout
  clearTimeout(typingTimeout);

  // Auto-stop after 3 seconds
  typingTimeout = setTimeout(() => {
    socket.emit('chat-typing', {
      roomId: currentRoomId,
      isTyping: false
    });
  }, 3000);
}

// Don't forget to listen
socket.on('chat-user-typing', (data) => {
  if (data.isTyping && data.userId !== myUserId) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

#### Common Mistakes
```javascript
// ❌ Wrong - showing typing for yourself
socket.on('chat-user-typing', (data) => {
  showTypingIndicator(data.userName); // Shows for everyone
});

// ✅ Correct - exclude yourself
socket.on('chat-user-typing', (data) => {
  if (data.userId !== currentUser.id) {
    showTypingIndicator(data.userName);
  }
});
```

---

### Issue: Not receiving read receipts

**Symptoms:**
- Mark messages as seen
- Get acknowledgment
- Others don't see read receipts

**Check Implementation:**

```javascript
// ❌ Wrong - not listening for broadcast
socket.emit('mark-messages-seen', {
  roomId: 'room_123',
  messageIds: ['msg1', 'msg2']
});

// ✅ Correct - listen for broadcast
socket.emit('mark-messages-seen', {
  roomId: 'room_123',
  messageIds: ['msg1', 'msg2']
});

socket.on('messages-seen', (data) => {
  // Update UI to show read receipts
  data.messageIds.forEach(msgId => {
    markAsRead(msgId, data.userId);
  });
});
```

---

## 🎥 Meeting Issues

### Issue: Can't join meeting

**Symptoms:**
- Emit join-meeting
- Get error or no response
- Not added to meeting

**Possible Causes:**

#### 1. Meeting doesn't exist
```javascript
socket.on('error', (err) => {
  if (err.message === 'Meeting not found') {
    alert('This meeting does not exist');
    // Redirect to home
  }
});
```

#### 2. Meeting has ended
```javascript
socket.on('error', (err) => {
  if (err.message === 'Meeting has ended') {
    alert('This meeting has ended');
    // Show meeting ended UI
  }
});
```

#### 3. Wrong password
```javascript
// For password-protected meetings
socket.emit('join-meeting', {
  meetingId: 'meeting_123',
  meeting_password: 'correct_password'  // Must match
});
```

#### 4. Meeting is full
```javascript
socket.on('error', (err) => {
  if (err.message === 'Meeting is full') {
    alert('Meeting has reached maximum participants');
  }
});
```

---

### Issue: Not seeing other participants

**Symptoms:**
- Joined meeting successfully
- Participant list is empty
- Can't see others' video

**Debugging:**

```javascript
socket.on('meeting-joined', (data) => {
  console.log('Meeting data:', data);
  console.log('Existing participants:', data.participants);
  
  if (data.participants.length === 0) {
    console.log('You are the first participant');
  }
  
  // Set up participant UI
  data.participants.forEach(p => {
    addParticipantToUI(p);
  });
});

// Listen for new participants
socket.on('participant-joined', (data) => {
  console.log('New participant:', data);
  addParticipantToUI(data);
});
```

---

### Issue: Video/Audio controls not working

**Symptoms:**
- Click mute button
- Emit event
- Others don't see status change

**Solution:**

```javascript
// Emit media status after changing local state
function toggleCamera() {
  const newState = !cameraOn;
  setCameraOn(newState);
  
  // Update local stream
  if (localStream) {
    localStream.getVideoTracks()[0].enabled = newState;
  }
  
  // Notify server
  socket.emit('media-status-update', {
    meetingId: currentMeetingId,
    video: newState,
    audio: micOn,
    screenSharing: false
  });
}

// Listen for others' updates
socket.on('participant-media-updated', (data) => {
  console.log('Participant media update:', data);
  updateParticipantVideo(data.participantId, data.video);
  updateParticipantAudio(data.participantId, data.audio);
});
```

---

## 🔄 Reconnection Issues

### Issue: Doesn't reconnect after disconnect

**Symptoms:**
- Network drops
- Socket disconnects
- Never reconnects automatically

**Solution:**

```javascript
// Enable reconnection (enabled by default)
const socket = io(url, {
  auth: { token },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// Handle reconnection events
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected you, reconnect manually
    socket.connect();
  }
  // Otherwise auto-reconnect happens
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnecting... attempt', attemptNumber);
  showReconnectingUI();
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  hideReconnectingUI();
  
  // IMPORTANT: Rejoin rooms
  rejoinChatRooms();
});

socket.on('reconnect_failed', () => {
  console.log('Failed to reconnect');
  showOfflineUI();
});
```

---

### Issue: Missing messages after reconnection

**Symptoms:**
- Disconnect and reconnect
- Messages sent during offline period not shown

**Solution:**

After reconnecting, fetch missed messages:

```javascript
socket.on('reconnect', async () => {
  console.log('Reconnected - fetching missed messages');
  
  // 1. Rejoin rooms via WebSocket
  await rejoinChatRooms();
  
  // 2. Fetch missed messages via REST API
  const lastMessageTime = getLastMessageTimestamp();
  
  for (const roomId of activeRooms) {
    const response = await fetch(
      `/api/chat/rooms/${roomId}/messages?since=${lastMessageTime}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const missedMessages = await response.json();
    missedMessages.forEach(msg => addMessageToUI(msg));
  }
});
```

---

## 🐛 Debugging Tools

### Enable Socket.IO Debug Logs

```javascript
// In browser console
localStorage.debug = 'socket.io-client:*';

// Reload page - you'll see detailed logs
```

### Log All Events

```javascript
// Log all incoming events
socket.onAny((eventName, ...args) => {
  console.log('⬇️ RECEIVED:', eventName, args);
});

// Log all outgoing events
const originalEmit = socket.emit;
socket.emit = function(eventName, ...args) {
  console.log('⬆️ SENDING:', eventName, args);
  return originalEmit.apply(socket, arguments);
};
```

### Check Connection State

```javascript
console.log('Socket ID:', socket.id);
console.log('Connected:', socket.connected);
console.log('Disconnected:', socket.disconnected);

// Check which rooms you're in
console.log('Rooms:', [...socket.rooms]);
```

### Network Tab

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click the WebSocket connection
4. View "Messages" tab
5. See all frames sent/received in real-time

---

## 📋 Checklist for Common Issues

### Before Connecting
- [ ] Server is running
- [ ] Using correct port (4501)
- [ ] Have valid JWT token
- [ ] Token not expired
- [ ] Using correct environment (dev/prod)

### After Connecting
- [ ] `connect` event fired
- [ ] No `connect_error` events
- [ ] `socket.connected === true`
- [ ] Set up all event listeners
- [ ] Joined necessary rooms

### For Chat
- [ ] Joined chat rooms
- [ ] Listening for `new-chat-message`
- [ ] Using correct room IDs
- [ ] Sending messages via REST API
- [ ] Not including `chat_room_` prefix in room IDs

### For Meetings
- [ ] Joined meeting successfully
- [ ] Received `meeting-joined` event
- [ ] Set up participant listeners
- [ ] Handling media controls properly
- [ ] Listening for participant updates

### Error Handling
- [ ] Listening for `error` events
- [ ] Listening for `disconnect` events
- [ ] Handling reconnection
- [ ] Rejoining rooms after reconnect
- [ ] Fetching missed messages

---

## 🆘 Still Having Issues?

### Quick Diagnostics

Run this in browser console:

```javascript
// Comprehensive diagnostic
function diagnoseSocket() {
  console.log('=== SOCKET DIAGNOSTICS ===');
  console.log('Socket exists:', !!window.socket);
  console.log('Socket ID:', window.socket?.id);
  console.log('Connected:', window.socket?.connected);
  console.log('Disconnected:', window.socket?.disconnected);
  console.log('Auth token:', localStorage.getItem('authToken') ? 'EXISTS' : 'MISSING');
  console.log('Server URL:', window.socket?.io?.uri);
  console.log('Transport:', window.socket?.io?.engine?.transport?.name);
  console.log('=========================');
}

diagnoseSocket();
```

### Get Help

1. **Check Documentation**
   - `FRONTEND_WEBSOCKET_GUIDE.md` - Complete guide
   - `WEBSOCKET_QUICK_REFERENCE.md` - Quick lookup
   - `WEBSOCKET_FLOW_DIAGRAMS.md` - Visual flows

2. **Check Backend Logs**
   - Look at server console
   - Check for connection attempts
   - Check for errors

3. **Test with Simple Client**
   ```javascript
   // Minimal test client
   const socket = io('http://localhost:4501', {
     auth: { token: 'YOUR_TOKEN' }
   });
   
   socket.on('connect', () => console.log('✅ Connected'));
   socket.on('disconnect', () => console.log('❌ Disconnected'));
   socket.on('error', (e) => console.error('❌ Error:', e));
   socket.onAny((event, data) => console.log('📩', event, data));
   ```

---

## 💡 Pro Tips

### 1. Always Clean Up

```javascript
// React example
useEffect(() => {
  const socket = io(...);
  
  // Set up listeners
  socket.on('event', handler);
  
  // Cleanup on unmount
  return () => {
    socket.off('event', handler);
    socket.disconnect();
  };
}, []);
```

### 2. Handle Edge Cases

```javascript
// Check connection before emitting
if (socket.connected) {
  socket.emit('event', data);
} else {
  console.warn('Socket not connected, cannot emit event');
  // Queue event or show error
}
```

### 3. Implement Retry Logic

```javascript
function emitWithRetry(event, data, maxRetries = 3) {
  let retries = 0;
  
  const tryEmit = () => {
    if (socket.connected) {
      socket.emit(event, data);
    } else if (retries < maxRetries) {
      retries++;
      setTimeout(tryEmit, 1000);
    } else {
      console.error('Failed to emit after', maxRetries, 'retries');
    }
  };
  
  tryEmit();
}
```

---

**Document Version**: 1.0  
**Last Updated**: October 25, 2025  
**Maintained By**: Backend Team
