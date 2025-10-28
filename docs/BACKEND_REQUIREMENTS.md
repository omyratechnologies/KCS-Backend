# Backend WebSocket Requirements for Meeting Join Fix

## 🎯 Critical Issues to Address

The frontend has been updated to properly send user identification and handle participant lists. The backend must implement the following to enable multiple participants to join the same meeting.

---

## 1️⃣ JOIN-MEETING Event Handler

### **Current Issue:**
Backend may not be accepting or using `userId` and `userName` from the join request.

### **Required Implementation:**

#### **Event Name:** `join-meeting`

#### **Frontend Payload (What we're sending):**
```javascript
{
  meetingId: "uuid-of-meeting",
  userId: "user-id-from-auth",        // NEW: User's database ID
  userName: "John Doe",                // NEW: User's display name
  meeting_password: "password123"      // OPTIONAL: Only if meeting has password
}
```

#### **Backend Must:**

1. **Accept the payload** with userId and userName fields
2. **Validate the meeting exists** and is active
3. **Check meeting password** if provided
4. **Generate unique participantId** for this session (not same as userId!)
   - Format: `${meetingId}_${userId}_${timestamp}` or UUID
   - This allows same user to rejoin without conflicts
5. **Add participant to meeting room**
6. **Emit `meeting-joined` event** back to the joining client (see below)
7. **Broadcast `participant-joined` event** to all OTHER participants in the room

### **Example Backend Code (Pseudo-code):**
```javascript
socket.on('join-meeting', async (data) => {
  const { meetingId, userId, userName, meeting_password } = data;
  
  // 1. Validate meeting
  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    socket.emit('error', { message: 'Meeting not found' });
    return;
  }
  
  // 2. Check password if required
  if (meeting.password && meeting.password !== meeting_password) {
    socket.emit('error', { message: 'Invalid meeting password' });
    return;
  }
  
  // 3. Generate unique participantId
  const participantId = `${meetingId}_${userId}_${Date.now()}`;
  
  // 4. Get existing participants
  const existingParticipants = getParticipantsInRoom(meetingId);
  
  // 5. Add to room
  socket.join(meetingId);
  addParticipantToRoom(meetingId, {
    participantId,
    userId,
    userName,
    socketId: socket.id,
    audio: true,
    video: true,
    screen: false
  });
  
  // 6. Send meeting-joined to the joiner (with existing participants)
  socket.emit('meeting-joined', {
    success: true,
    meeting: meeting,
    participantId: participantId,
    participants: existingParticipants.map(p => ({
      participantId: p.participantId,
      userId: p.userId,
      userName: p.userName,
      audio: p.audio,
      video: p.video,
      screen: p.screen
    })),
    webrtcConfig: {
      // WebRTC configuration if needed
    }
  });
  
  // 7. Broadcast participant-joined to others
  socket.to(meetingId).emit('participant-joined', {
    participantId,
    userId,
    userName,
    audio: true,
    video: true,
    screen: false,
    permissions: {
      canShare: true,
      canChat: true,
      canRecord: meeting.creator_id === userId
    }
  });
  
  console.log(`✅ User ${userName} (${userId}) joined meeting ${meetingId} as ${participantId}`);
});
```

---

## 2️⃣ MEETING-JOINED Event (Response to Joiner)

### **Critical: This is sent ONLY to the user who just joined**

#### **Event Name:** `meeting-joined`

#### **Required Payload Structure:**
```javascript
{
  success: true,
  meeting: {
    id: "meeting-uuid",
    meeting_name: "Team Meeting",
    meeting_status: "live",
    creator_id: "creator-user-id",
    // ... other meeting details
  },
  participantId: "unique-participant-session-id",  // ⚠️ CRITICAL: Must be unique per session
  participants: [                                   // ⚠️ CRITICAL: List of existing participants
    {
      participantId: "participant-1-session-id",
      userId: "user-1-id",
      userName: "Host Name",
      audio: true,
      video: true,
      screen: false
    },
    {
      participantId: "participant-2-session-id",
      userId: "user-2-id",
      userName: "Participant Name",
      audio: true,
      video: false,
      screen: false
    }
    // ... more existing participants
  ],
  webrtcConfig: {
    // Optional WebRTC configuration
  }
}
```

### **⚠️ Critical Points:**

1. **`participantId` must be unique per session** - If same user rejoins, give them a NEW participantId
2. **`participants` array must include ALL existing participants** in the meeting (not including the one joining)
3. **Each participant object must include their current media status** (audio/video/screen)

---

## 3️⃣ PARTICIPANT-JOINED Event (Broadcast to Others)

### **Critical: This is broadcast to ALL existing participants when someone new joins**

#### **Event Name:** `participant-joined`

#### **Required Payload Structure:**
```javascript
{
  participantId: "unique-participant-session-id",  // Same as sent in meeting-joined
  userId: "user-database-id",
  userName: "New Participant Name",
  audio: true,
  video: true,
  screen: false,
  permissions: {
    canShare: true,
    canChat: true,
    canRecord: false
  }
}
```

### **Backend Must:**
- Emit this event to `socket.to(meetingId)` (NOT to the joiner)
- Include the new participant's initial media status
- Send immediately after emitting `meeting-joined`

---

## 4️⃣ PARTICIPANT-LEFT Event

### **Event Name:** `participant-left`

#### **When to Emit:**
- User clicks "Leave" button → Frontend emits `leave-meeting`
- Socket disconnects unexpectedly
- User closes app/browser

#### **Required Payload:**
```javascript
{
  participantId: "participant-session-id-that-left",
  userName: "User Name",
  reason: "left" | "disconnected" | "kicked"  // Optional
}
```

### **Backend Must:**
1. Remove participant from meeting room data structure
2. Broadcast `participant-left` to ALL remaining participants
3. Clean up any WebRTC resources for that participant

---

## 5️⃣ Meeting Room State Management

### **Backend Must Maintain:**

```javascript
// In-memory or Redis structure
const meetingRooms = {
  "meeting-uuid-1": {
    meetingId: "meeting-uuid-1",
    creatorId: "creator-user-id",
    status: "live",
    participants: {
      "participant-id-1": {
        participantId: "participant-id-1",
        userId: "user-id-1",
        userName: "User One",
        socketId: "socket-id-1",
        audio: true,
        video: true,
        screen: false,
        joinedAt: "2025-10-29T10:00:00Z"
      },
      "participant-id-2": {
        participantId: "participant-id-2",
        userId: "user-id-2",
        userName: "User Two",
        socketId: "socket-id-2",
        audio: true,
        video: false,
        screen: false,
        joinedAt: "2025-10-29T10:05:00Z"
      }
    }
  }
};
```

### **Required Functions:**

```javascript
// Get all participants in a meeting room
function getParticipantsInRoom(meetingId) {
  return Object.values(meetingRooms[meetingId]?.participants || {});
}

// Add participant to room
function addParticipantToRoom(meetingId, participantData) {
  if (!meetingRooms[meetingId]) {
    meetingRooms[meetingId] = { participants: {} };
  }
  meetingRooms[meetingId].participants[participantData.participantId] = participantData;
}

// Remove participant from room
function removeParticipantFromRoom(meetingId, participantId) {
  if (meetingRooms[meetingId]?.participants) {
    delete meetingRooms[meetingId].participants[participantId];
  }
}

// Get participant by socketId (for disconnect handling)
function getParticipantBySocketId(socketId) {
  for (const room of Object.values(meetingRooms)) {
    for (const participant of Object.values(room.participants)) {
      if (participant.socketId === socketId) {
        return { meetingId: room.meetingId, participant };
      }
    }
  }
  return null;
}
```

---

## 6️⃣ Socket Disconnect Handling

### **Implementation Required:**

```javascript
socket.on('disconnect', () => {
  // Find which meeting this socket was in
  const result = getParticipantBySocketId(socket.id);
  
  if (result) {
    const { meetingId, participant } = result;
    
    // Remove from room
    removeParticipantFromRoom(meetingId, participant.participantId);
    
    // Notify others
    socket.to(meetingId).emit('participant-left', {
      participantId: participant.participantId,
      userName: participant.userName,
      reason: 'disconnected'
    });
    
    console.log(`❌ ${participant.userName} disconnected from meeting ${meetingId}`);
  }
});
```

---

## 7️⃣ Testing Checklist for Backend

### **Test 1: Single User Join**
```bash
# Connect socket
# Emit join-meeting
# Expected:
- ✅ Receive meeting-joined with empty participants array
- ✅ participantId is unique
- ✅ No errors
```

### **Test 2: Second User Joins**
```bash
# User 1 already in meeting
# User 2 emits join-meeting
# Expected:
- ✅ User 2 receives meeting-joined with User 1 in participants array
- ✅ User 1 receives participant-joined for User 2
- ✅ Both have unique participantIds
```

### **Test 3: Third User Joins**
```bash
# Users 1 & 2 already in meeting
# User 3 emits join-meeting
# Expected:
- ✅ User 3 receives meeting-joined with [User 1, User 2] in participants
- ✅ Users 1 & 2 receive participant-joined for User 3
- ✅ All three have unique participantIds
```

### **Test 4: User Leaves and Rejoins**
```bash
# User 2 emits leave-meeting
# Expected: User 1 receives participant-left for User 2
# User 2 rejoins
# Expected:
- ✅ User 2 gets NEW participantId (not same as before)
- ✅ User 1 sees User 2 as new participant
- ✅ No duplicate entries
```

### **Test 5: Disconnect Handling**
```bash
# User 2's socket disconnects unexpectedly
# Expected:
- ✅ User 1 receives participant-left for User 2
- ✅ User 2 removed from room state
```

---

## 8️⃣ Common Backend Mistakes to Avoid

### ❌ **Mistake 1: Using userId as participantId**
```javascript
// WRONG
const participantId = userId;  // ❌ Causes issues on rejoin
```
```javascript
// CORRECT
const participantId = `${meetingId}_${userId}_${Date.now()}`; // ✅ Unique per session
```

### ❌ **Mistake 2: Not returning existing participants**
```javascript
// WRONG
socket.emit('meeting-joined', {
  meeting: meeting,
  participantId: participantId,
  participants: []  // ❌ Always empty!
});
```
```javascript
// CORRECT
const existingParticipants = getParticipantsInRoom(meetingId);
socket.emit('meeting-joined', {
  meeting: meeting,
  participantId: participantId,
  participants: existingParticipants  // ✅ Includes everyone already in room
});
```

### ❌ **Mistake 3: Broadcasting to everyone including joiner**
```javascript
// WRONG
io.to(meetingId).emit('participant-joined', {...});  // ❌ Includes the joiner
```
```javascript
// CORRECT
socket.to(meetingId).emit('participant-joined', {...});  // ✅ Excludes the joiner
```

### ❌ **Mistake 4: Not cleaning up on disconnect**
```javascript
// WRONG - No disconnect handler
// Results in "ghost participants" who never leave
```
```javascript
// CORRECT
socket.on('disconnect', () => {
  // Clean up participant from all rooms
  // Notify others they left
});
```

---

## 9️⃣ Expected Console Logs (Backend)

When properly implemented, you should see:

```
✅ Socket connected: socket-id-abc123
✅ User John Doe (user-123) joined meeting meeting-456 as participant-789
📤 Sent meeting-joined to socket-id-abc123 with 2 existing participants
📤 Broadcast participant-joined to 2 other participants
---
✅ User Jane Smith (user-456) joined meeting meeting-456 as participant-101
📤 Sent meeting-joined to socket-id-def456 with 1 existing participant
📤 Broadcast participant-joined to 1 other participant
---
❌ User John Doe disconnected from meeting meeting-456
📤 Broadcast participant-left to 1 remaining participant
```

---

## 🔟 Quick Verification Script

### **Test with Socket.IO client:**

```javascript
const io = require('socket.io-client');

// Connect first user
const socket1 = io('https://devapi.letscatchup-kcs.com', {
  auth: { token: 'user1-token' }
});

socket1.on('connect', () => {
  console.log('User 1 connected');
  
  // Join meeting
  socket1.emit('join-meeting', {
    meetingId: 'test-meeting-123',
    userId: 'user-1-id',
    userName: 'User One'
  });
});

socket1.on('meeting-joined', (data) => {
  console.log('User 1 joined meeting:');
  console.log('- Participant ID:', data.participantId);
  console.log('- Existing participants:', data.participants.length);
});

socket1.on('participant-joined', (data) => {
  console.log('User 1 sees new participant:', data.userName);
});

// Connect second user (after 2 seconds)
setTimeout(() => {
  const socket2 = io('https://devapi.letscatchup-kcs.com', {
    auth: { token: 'user2-token' }
  });
  
  socket2.on('connect', () => {
    console.log('User 2 connected');
    
    socket2.emit('join-meeting', {
      meetingId: 'test-meeting-123',
      userId: 'user-2-id',
      userName: 'User Two'
    });
  });
  
  socket2.on('meeting-joined', (data) => {
    console.log('User 2 joined meeting:');
    console.log('- Participant ID:', data.participantId);
    console.log('- Existing participants:', data.participants.length); // Should be 1!
    console.log('- Participants:', data.participants);
  });
}, 2000);
```

### **Expected Output:**
```
User 1 connected
User 1 joined meeting:
- Participant ID: participant-abc-123
- Existing participants: 0

User 2 connected
User 2 joined meeting:
- Participant ID: participant-def-456
- Existing participants: 1
- Participants: [{ participantId: 'participant-abc-123', userName: 'User One', ... }]

User 1 sees new participant: User Two
```

---

## 📋 Summary for Backend Team

### **Must Implement:**
1. ✅ Accept `userId` and `userName` in `join-meeting` payload
2. ✅ Generate unique `participantId` per session (not same as userId)
3. ✅ Maintain meeting room state with all participants
4. ✅ Return existing participants in `meeting-joined` event
5. ✅ Broadcast `participant-joined` to other participants (not the joiner)
6. ✅ Handle disconnect and cleanup participants
7. ✅ Broadcast `participant-left` when someone leaves

### **Current Frontend Behavior:**
- ✅ Sends userId and userName when joining
- ✅ Listens for meeting-joined and loads initial participants
- ✅ Listens for participant-joined to add new participants
- ✅ Prevents duplicate participants
- ✅ Proper cleanup on leave

### **If Implemented Correctly:**
- Multiple users can join same meeting
- All participants see each other immediately
- Late joiners see all existing participants
- No duplicate entries
- Leave/rejoin works smoothly

---

## 📞 Need Help?

If backend implementation is unclear, please share:
1. Current WebSocket server code for join-meeting handler
2. How participants are currently stored/tracked
3. Sample `meeting-joined` event payload currently being sent
4. Console logs from backend when users join

This will help identify exactly what needs to be changed.
