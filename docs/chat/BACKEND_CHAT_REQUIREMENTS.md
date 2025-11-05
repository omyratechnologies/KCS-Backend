# 🔧 Backend Requirements for Chat Feature Enhancements

**Date:** November 5, 2025  
**For:** Backend Development Team  
**Priority:** HIGH - Required for Mobile App Release

---

## 📌 Overview

The mobile app needs the following chat features implemented on the backend:

1. ✅ Delete Chat (conversation)
2. ✅ Clear Chat (messages)  
3. ✅ Archive Chats
4. ✅ Enhanced Unread Count Management
5. ✅ Message Forwarding (partially exists)
6. ✅ End-to-End Encryption Support
7. ⚠️ Real-time Message Delivery Fixes

---

## 🗄️ Database Schema Changes Required

### 1. User Chat Preferences Table

**Purpose:** Store per-user settings for each chat room

```sql
CREATE TABLE user_chat_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  
  -- Archive functionality
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  
  -- Clear chat functionality
  messages_cleared_at TIMESTAMP,
  
  -- Delete chat functionality
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  
  -- Unread management
  last_read_message_id UUID,
  last_read_at TIMESTAMP,
  manually_marked_unread BOOLEAN DEFAULT FALSE,
  
  -- Mute notifications
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, room_id)
);

CREATE INDEX idx_user_chat_prefs ON user_chat_preferences(user_id, room_id);
CREATE INDEX idx_archived_chats ON user_chat_preferences(user_id) WHERE is_archived = TRUE;
CREATE INDEX idx_deleted_chats ON user_chat_preferences(user_id) WHERE is_deleted = TRUE;
```

### 2. Message Forwarding Support

**Purpose:** Track forwarded messages

```sql
ALTER TABLE chat_messages
ADD COLUMN forwarded_from UUID REFERENCES chat_messages(id),
ADD COLUMN forwarded_count INTEGER DEFAULT 0;

CREATE INDEX idx_forwarded_from ON chat_messages(forwarded_from);
```

### 3. Encryption Support (Phase 4)

**Purpose:** Store user encryption keys

```sql
-- User encryption keys
CREATE TABLE user_encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  key_id VARCHAR(255) NOT NULL,
  public_key TEXT NOT NULL,
  fingerprint VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE(user_id, device_id, key_id)
);

-- Key verification tracking
CREATE TABLE key_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verifier_user_id UUID NOT NULL REFERENCES users(id),
  verified_user_id UUID NOT NULL REFERENCES users(id),
  key_id VARCHAR(255) NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(verifier_user_id, verified_user_id, key_id)
);

-- Add encryption fields to messages
ALTER TABLE chat_messages
ADD COLUMN is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN encryption_key_id VARCHAR(255),
ADD COLUMN encrypted_content TEXT;

-- Indexes
CREATE INDEX idx_user_keys ON user_encryption_keys(user_id);
CREATE INDEX idx_key_verifications ON key_verifications(verifier_user_id, verified_user_id);
```

### 4. Database Function: Calculate Unread Count

```sql
CREATE OR REPLACE FUNCTION calculate_unread_count(
  p_user_id UUID,
  p_room_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_last_read_msg_id UUID;
  v_manually_unread BOOLEAN;
  v_cleared_at TIMESTAMP;
BEGIN
  -- Get user preferences
  SELECT 
    last_read_message_id, 
    manually_marked_unread,
    messages_cleared_at
  INTO 
    v_last_read_msg_id, 
    v_manually_unread,
    v_cleared_at
  FROM user_chat_preferences
  WHERE user_id = p_user_id AND room_id = p_room_id;
  
  -- If manually marked as unread, return at least 1
  IF v_manually_unread THEN
    SELECT COUNT(*)
    INTO v_count
    FROM chat_messages
    WHERE room_id = p_room_id
      AND sender_id != p_user_id
      AND is_deleted = FALSE
      AND created_at > COALESCE(v_cleared_at, '1970-01-01'::TIMESTAMP)
    ORDER BY created_at DESC
    LIMIT 1;
    RETURN GREATEST(v_count, 1);
  END IF;
  
  -- Count messages after last read and after cleared timestamp
  IF v_last_read_msg_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_count
    FROM chat_messages
    WHERE room_id = p_room_id
      AND sender_id != p_user_id
      AND created_at > (
        SELECT created_at FROM chat_messages WHERE id = v_last_read_msg_id
      )
      AND created_at > COALESCE(v_cleared_at, '1970-01-01'::TIMESTAMP)
      AND is_deleted = FALSE;
  ELSE
    -- If no last read, count all messages from others (after cleared timestamp)
    SELECT COUNT(*)
    INTO v_count
    FROM chat_messages
    WHERE room_id = p_room_id
      AND sender_id != p_user_id
      AND created_at > COALESCE(v_cleared_at, '1970-01-01'::TIMESTAMP)
      AND is_deleted = FALSE;
  END IF;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔌 API Endpoints Required

### 1. Delete Chat

**Endpoint:** `DELETE /api/chat/rooms/:room_id`

**Authentication:** Required (JWT)

**Request Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Business Logic:**

**For Personal Chats:**
- Set `is_deleted = TRUE` in `user_chat_preferences` for current user
- Do NOT delete the actual room or messages
- Other user still sees the chat normally

**For Group Chats:**
- If last member: Hard delete the room and all messages
- If not last member: Remove user from `members` array
- If user is only admin: Transfer admin to another member or keep multiple admins

**Response Success (200):**
```json
{
  "success": true,
  "message": "Chat deleted successfully",
  "data": {
    "room_id": "room_123",
    "deleted_at": "2025-11-05T10:30:00Z"
  }
}
```

**Response Errors:**
- `404` - Room not found
- `403` - User not a member of room
- `500` - Server error

---

### 2. Clear Chat Messages

**Endpoint:** `DELETE /api/chat/rooms/:room_id/messages`

**Authentication:** Required (JWT)

**Query Parameters:**
```
?for_everyone=false  // Optional: Admin can clear for all (default: false)
```

**Business Logic:**

**Clear for Current User (Default):**
- Set `messages_cleared_at = CURRENT_TIMESTAMP` in `user_chat_preferences`
- Do NOT delete actual messages
- GET messages endpoint will filter messages older than `messages_cleared_at`

**Clear for Everyone (Admin Only):**
- Hard delete all messages in the room
- Broadcast `room-messages-cleared` WebSocket event
- Only allowed for room creator or admins

**Response Success (200):**
```json
{
  "success": true,
  "message": "Chat cleared successfully",
  "data": {
    "room_id": "room_123",
    "cleared_at": "2025-11-05T10:30:00Z",
    "for_everyone": false
  }
}
```

**Modified GET Messages Logic:**
```sql
-- Add to existing GET /api/chat/rooms/:room_id/messages
SELECT * FROM chat_messages
WHERE room_id = :room_id
  AND created_at > COALESCE(
    (SELECT messages_cleared_at FROM user_chat_preferences 
     WHERE user_id = :user_id AND room_id = :room_id), 
    '1970-01-01'::TIMESTAMP
  )
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
```

---

### 3. Archive/Unarchive Chat

**Endpoint:** `PUT /api/chat/rooms/:room_id/archive`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "is_archived": true  // or false to unarchive
}
```

**Business Logic:**
- Insert/Update `user_chat_preferences` table
- Set `is_archived = true/false`
- Set `archived_at = CURRENT_TIMESTAMP` when archiving
- This is per-user, doesn't affect other members

**Response Success (200):**
```json
{
  "success": true,
  "message": "Chat archived successfully",
  "data": {
    "room_id": "room_123",
    "is_archived": true,
    "archived_at": "2025-11-05T10:30:00Z"
  }
}
```

**Modified GET Rooms Logic:**
```sql
-- Add to existing GET /api/chat/rooms
SELECT 
  r.*,
  COALESCE(p.is_archived, FALSE) as is_archived,
  COALESCE(p.is_deleted, FALSE) as is_deleted,
  p.archived_at,
  calculate_unread_count(:user_id, r.id) as unread_count
FROM chat_rooms r
LEFT JOIN user_chat_preferences p 
  ON p.room_id = r.id AND p.user_id = :user_id
WHERE :user_id = ANY(r.members)
  AND COALESCE(p.is_deleted, FALSE) = FALSE  -- Don't show deleted chats
  AND (:archived IS NULL OR COALESCE(p.is_archived, FALSE) = :archived)
ORDER BY r.updated_at DESC;
```

**New Query Parameter for GET /api/chat/rooms:**
```
?archived=true   // Show only archived chats
?archived=false  // Show only non-archived chats (default)
```

---

### 4. Enhanced Unread Count

**Endpoint 1:** `GET /api/chat/unread-count`

**Authentication:** Required (JWT)

**Query Parameters:**
```
?room_id=room_123  // Optional: Get count for specific room
```

**Response (All Rooms):**
```json
{
  "success": true,
  "data": {
    "total_unread": 15,
    "rooms": [
      {
        "room_id": "room_123",
        "unread_count": 5,
        "last_read_message_id": "msg_456",
        "last_message_timestamp": "2025-11-05T10:30:00Z"
      },
      {
        "room_id": "room_456",
        "unread_count": 10,
        "last_read_message_id": "msg_789",
        "last_message_timestamp": "2025-11-05T10:35:00Z"
      }
    ]
  }
}
```

**Response (Single Room):**
```json
{
  "success": true,
  "data": {
    "room_id": "room_123",
    "unread_count": 5,
    "last_read_message_id": "msg_456"
  }
}
```

**Endpoint 2:** `PUT /api/chat/rooms/:room_id/read-status`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "is_read": true,  // or false to mark as unread
  "last_read_message_id": "msg_123"  // Optional: specific message
}
```

**Business Logic:**
- If `is_read = true`:
  - Update `last_read_message_id` and `last_read_at`
  - Set `manually_marked_unread = false`
  - Return `unread_count = 0`

- If `is_read = false`:
  - Set `manually_marked_unread = true`
  - Return `unread_count = 1` (or actual count)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "room_id": "room_123",
    "unread_count": 0,
    "last_read_message_id": "msg_123",
    "read_at": "2025-11-05T10:30:00Z"
  }
}
```

**Implementation Note:**
- All GET rooms responses should include calculated `unread_count`
- Use the `calculate_unread_count()` function
- Cache unread counts for performance

---

### 5. Message Forwarding (Already Partially Implemented)

**Endpoint:** `POST /api/chat/messages/:message_id/forward`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "target_room_ids": ["room_456", "room_789"]
}
```

**Business Logic:**

1. **Validation:**
   - Verify user is member of all target rooms
   - Check if source message exists and user has access
   - Validate permissions (not blocked, etc.)

2. **Message Creation:**
   - Create new message in each target room
   - Copy: `content`, `message_type`, `file_url`, `media` from original
   - Set `forwarded_from = original_message_id`
   - Set `sender_id = current_user_id` (not original sender)
   - Increment `forwarded_count` in original message

3. **Metadata:**
   ```json
   {
     "forwarded_from": {
       "message_id": "msg_123",
       "original_sender": "user_001",
       "original_room": "room_123"
     }
   }
   ```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Message forwarded successfully",
  "data": {
    "original_message_id": "msg_123",
    "forwarded_to": ["room_456", "room_789"],
    "forwarded_messages": [
      {
        "id": "msg_new_456",
        "room_id": "room_456",
        "content": "Original message content",
        "forwarded_from": "msg_123",
        "created_at": "2025-11-05T10:30:00Z"
      },
      {
        "id": "msg_new_789",
        "room_id": "room_789",
        "content": "Original message content",
        "forwarded_from": "msg_123",
        "created_at": "2025-11-05T10:30:00Z"
      }
    ]
  }
}
```

**WebSocket Broadcast:**
```javascript
// Broadcast to each target room
for (const newMessage of forwardedMessages) {
  io.to(newMessage.room_id).emit('new-chat-message', {
    message: newMessage
  });
}
```

---

### 6. Encryption Key Management (Phase 4)

**Endpoint 1:** `POST /api/chat/encryption/keys`

**Description:** Upload user's public key

**Request Body:**
```json
{
  "public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgk...",
  "device_id": "device_123",
  "key_id": "key_001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "key_id": "key_001",
    "fingerprint": "A1B2C3D4E5F6789012345678",
    "uploaded_at": "2025-11-05T10:30:00Z"
  }
}
```

**Endpoint 2:** `GET /api/chat/encryption/keys/:user_id`

**Description:** Get user's public key(s)

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_001",
    "keys": [
      {
        "key_id": "key_001",
        "device_id": "device_123",
        "public_key": "-----BEGIN PUBLIC KEY-----\n...",
        "fingerprint": "A1B2C3D4E5F6789012345678",
        "created_at": "2025-11-05T10:30:00Z",
        "is_active": true
      }
    ]
  }
}
```

**Endpoint 3:** `POST /api/chat/encryption/verify`

**Description:** Mark a key as verified after fingerprint check

**Request Body:**
```json
{
  "user_id": "user_002",
  "key_id": "key_002",
  "fingerprint": "A1B2C3D4E5F6"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Key verified successfully"
}
```

---

## 🔄 WebSocket Events Required

### 1. Real-time Message Delivery Improvements

**Current Issue:** Messages sometimes don't arrive in real-time

**Required Changes:**

#### Connection Handling

```python
@socketio.on('connect')
def handle_connect():
    user_id = get_user_id_from_token()
    
    # Store connection
    active_connections[user_id] = request.sid
    
    # Update user status to online
    update_user_status(user_id, 'online')
    
    # Broadcast online status
    rooms = get_user_rooms(user_id)
    for room in rooms:
        emit('chat-user-status-update', {
            'user_id': user_id,
            'status': 'online',
            'last_seen': datetime.now().isoformat()
        }, room=room['id'])
    
    # Send any pending/queued messages
    pending_count = send_pending_messages(user_id)
    if pending_count > 0:
        print(f'✅ Delivered {pending_count} pending messages to {user_id}')

@socketio.on('disconnect')
def handle_disconnect():
    user_id = get_user_id_from_token()
    
    # Remove from active connections
    if user_id in active_connections:
        del active_connections[user_id]
    
    # Update status to offline after 30 second grace period
    schedule_delayed_task(
        func=update_user_status,
        args=(user_id, 'offline'),
        delay=30
    )
    
    # Broadcast offline status
    rooms = get_user_rooms(user_id)
    for room in rooms:
        emit('chat-user-status-update', {
            'user_id': user_id,
            'status': 'offline',
            'last_seen': datetime.now().isoformat()
        }, room=room['id'])
```

#### Heartbeat/Ping-Pong

```python
@socketio.on('ping')
def handle_ping():
    emit('pong')
    user_id = get_user_id_from_token()
    update_last_seen(user_id)  # Update last_seen timestamp
```

**Frontend should send 'ping' every 25 seconds**

#### Message Queue for Offline Users

```python
# Global message queue
pending_messages = defaultdict(list)  # user_id -> [messages]

def queue_message_for_offline_user(user_id, message):
    """Queue message for delivery when user comes online"""
    pending_messages[user_id].append({
        'message': message,
        'queued_at': datetime.now()
    })
    
    # Also send push notification
    send_push_notification(user_id, message)

def send_pending_messages(user_id):
    """Send all pending messages when user connects"""
    if user_id not in pending_messages:
        return 0
    
    messages = pending_messages[user_id]
    count = len(messages)
    
    for item in messages:
        emit('new-chat-message', {
            'message': item['message']
        }, room=active_connections[user_id])
    
    # Clear queue
    del pending_messages[user_id]
    
    return count
```

#### Improved Message Broadcasting

```python
@socketio.on('send-message')
def handle_send_message(data):
    """Handle incoming message from client"""
    room_id = data['room_id']
    content = data['content']
    temp_id = data.get('temp_id')
    sender_id = get_user_id_from_token()
    
    # 1. Save message to database FIRST
    message = create_message(
        room_id=room_id,
        sender_id=sender_id,
        content=content,
        message_type=data.get('message_type', 'text'),
        reply_to=data.get('reply_to_message_id'),
        file_url=data.get('file_url')
    )
    
    # 2. Build message payload with all details
    message_data = serialize_message(message)  # Include sender info, etc.
    
    # 3. Get room members
    members = get_room_members(room_id)
    
    # 4. Broadcast to online members
    online_count = 0
    offline_members = []
    
    for member_id in members:
        if member_id == sender_id:
            continue  # Don't send to sender (they have optimistic update)
        
        if member_id in active_connections:
            # Send to online member
            emit('new-chat-message', {
                'message': message_data
            }, room=active_connections[member_id])
            online_count += 1
        else:
            # Queue for offline member
            offline_members.append(member_id)
            queue_message_for_offline_user(member_id, message_data)
    
    # 5. Send confirmation to sender
    emit('message-confirmed', {
        'temp_id': temp_id,
        'message_id': str(message.id),
        'delivered_to_count': online_count,
        'queued_for_count': len(offline_members),
        'timestamp': message.created_at.isoformat()
    })
    
    # 6. Update room's last_message
    update_room_last_message(room_id, message)
    
    print(f'📨 Message {message.id} delivered to {online_count} online, {len(offline_members)} queued')
```

### 2. Seen Receipt Broadcasting

**Current Issue:** Seen receipts not updating correctly

**Required Changes:**

```python
@socketio.on('mark-messages-seen')
def handle_mark_seen(data):
    """Mark messages as seen by user"""
    room_id = data['room_id']
    message_ids = data['message_ids']
    user_id = get_user_id_from_token()
    
    if not message_ids:
        return
    
    # 1. Update database - mark messages as seen
    for message_id in message_ids:
        mark_message_seen(message_id, user_id)
    
    # 2. Update user preferences (last_read_message_id)
    latest_message = get_latest_message(message_ids)
    update_user_chat_preference(
        user_id=user_id,
        room_id=room_id,
        last_read_message_id=latest_message.id,
        last_read_at=datetime.now()
    )
    
    # 3. Get affected senders (who sent these messages)
    messages = get_messages_by_ids(message_ids)
    sender_ids = set(m.sender_id for m in messages)
    
    # 4. Broadcast to senders so they see "seen" status
    seen_receipt = {
        'user_id': user_id,
        'user_name': get_user_name(user_id),
        'seen_at': datetime.now().isoformat()
    }
    
    for sender_id in sender_ids:
        if sender_id in active_connections:
            emit('messages-seen', {
                'room_id': room_id,
                'message_ids': message_ids,
                'seen_by': seen_receipt
            }, room=active_connections[sender_id])
    
    # 5. Update unread count and broadcast
    new_unread_count = calculate_unread_count(user_id, room_id)
    
    emit('unread-count-update', {
        'room_id': room_id,
        'unread_count': new_unread_count
    }, room=active_connections[user_id])
    
    print(f'✅ Marked {len(message_ids)} messages as seen by {user_id} in room {room_id}')
```

### 3. New WebSocket Events

**Event: room-archived**
```python
@socketio.on('room-archive')
def handle_room_archive(data):
    room_id = data['room_id']
    is_archived = data['is_archived']
    user_id = get_user_id_from_token()
    
    # Update database
    update_user_chat_preference(user_id, room_id, is_archived=is_archived)
    
    # Notify user's other devices
    emit('room-archived', {
        'room_id': room_id,
        'is_archived': is_archived,
        'archived_at': datetime.now().isoformat()
    }, room=user_id)  # Broadcast to all user's connections
```

**Event: room-deleted**
```python
# After room deletion via API
def broadcast_room_deleted(room_id, deleted_by_user_id):
    """Broadcast room deletion to all members"""
    members = get_room_members(room_id)
    
    for member_id in members:
        if member_id in active_connections:
            emit('room-deleted', {
                'room_id': room_id,
                'deleted_by': deleted_by_user_id,
                'deleted_at': datetime.now().isoformat()
            }, room=active_connections[member_id])
```

**Event: room-messages-cleared**
```python
# After clearing messages for everyone (admin only)
def broadcast_messages_cleared(room_id, cleared_by_user_id):
    """Broadcast message clear event"""
    emit('room-messages-cleared', {
        'room_id': room_id,
        'cleared_by': cleared_by_user_id,
        'cleared_at': datetime.now().isoformat()
    }, room=room_id)  # Broadcast to all room members
```

---

## 🚀 Performance Optimizations

### 1. Caching Unread Counts

```python
# Use Redis to cache unread counts
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_unread_count(user_id, room_id):
    """Get unread count from cache"""
    key = f"unread:{user_id}:{room_id}"
    cached = redis_client.get(key)
    
    if cached is not None:
        return int(cached)
    
    # Calculate and cache
    count = calculate_unread_count(user_id, room_id)
    redis_client.setex(key, 300, count)  # Cache for 5 minutes
    return count

def invalidate_unread_cache(user_id, room_id):
    """Invalidate cache when message seen or sent"""
    key = f"unread:{user_id}:{room_id}"
    redis_client.delete(key)
```

### 2. Batch Operations

```python
def mark_multiple_rooms_as_read(user_id, room_ids):
    """Mark multiple rooms as read in single operation"""
    
    # Batch database update
    for room_id in room_ids:
        latest_message = get_latest_message_in_room(room_id)
        if latest_message:
            update_user_chat_preference(
                user_id=user_id,
                room_id=room_id,
                last_read_message_id=latest_message.id,
                last_read_at=datetime.now()
            )
    
    # Batch cache invalidation
    for room_id in room_ids:
        invalidate_unread_cache(user_id, room_id)
    
    return {"success": True, "rooms_updated": len(room_ids)}
```

### 3. Database Indexing

```sql
-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON chat_messages(room_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_prefs_lookup ON user_chat_preferences(user_id, room_id);
```

---

## ✅ Testing Checklist

### API Endpoints Testing

- [ ] DELETE /api/chat/rooms/:id - Test personal chat deletion
- [ ] DELETE /api/chat/rooms/:id - Test group chat deletion
- [ ] DELETE /api/chat/rooms/:id/messages - Test clear for user
- [ ] DELETE /api/chat/rooms/:id/messages?for_everyone=true - Test clear for all
- [ ] PUT /api/chat/rooms/:id/archive - Test archive
- [ ] PUT /api/chat/rooms/:id/archive - Test unarchive
- [ ] GET /api/chat/rooms?archived=true - Test archived rooms list
- [ ] GET /api/chat/unread-count - Test global unread count
- [ ] GET /api/chat/unread-count?room_id=x - Test single room unread
- [ ] PUT /api/chat/rooms/:id/read-status - Test mark as read
- [ ] PUT /api/chat/rooms/:id/read-status - Test mark as unread
- [ ] POST /api/chat/messages/:id/forward - Test message forwarding

### WebSocket Testing

- [ ] Connect event - Verify online status broadcast
- [ ] Disconnect event - Verify offline status after grace period
- [ ] Ping/Pong - Verify heartbeat working
- [ ] send-message - Verify message delivered to all online members
- [ ] send-message - Verify message queued for offline members
- [ ] mark-messages-seen - Verify seen receipts broadcast to senders
- [ ] Connection recovery - Verify pending messages delivered on reconnect

### Database Testing

- [ ] user_chat_preferences table created successfully
- [ ] calculate_unread_count() function works correctly
- [ ] Indexes created for performance
- [ ] Foreign key constraints working
- [ ] Soft delete preserves data correctly

### Integration Testing

- [ ] User A deletes chat → User B still sees it (personal chat)
- [ ] User A clears messages → User B still sees them
- [ ] User A archives chat → Only hidden for User A
- [ ] User A sends message while User B offline → User B receives on reconnect
- [ ] User A marks as seen → User B sees "seen" status update
- [ ] User A forwards message → Appears in target rooms correctly

---

## 🔒 Security Considerations

1. **Authorization:**
   - Always verify user is member of room before any operation
   - Check permissions for admin-only operations (clear for everyone)
   - Validate room ownership before deletion

2. **Input Validation:**
   - Sanitize all user inputs
   - Validate room_id and message_id exist
   - Check array sizes (prevent sending 1000+ room_ids)

3. **Rate Limiting:**
   - Limit message forwarding (max 10 rooms at once)
   - Limit API calls per minute per user
   - Implement WebSocket event throttling

4. **Data Privacy:**
   - Soft delete ensures data recovery if needed
   - Clear messages doesn't affect other users
   - Archive is per-user only

5. **Encryption (Phase 4):**
   - Private keys NEVER stored on server
   - Only public keys stored in database
   - Implement key rotation mechanism
   - Add rate limiting on key endpoints

---

## 📞 API Testing Examples

### Using cURL

```bash
# Delete chat
curl -X DELETE "https://api.kcs-platform.com/api/chat/rooms/room_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Clear chat
curl -X DELETE "https://api.kcs-platform.com/api/chat/rooms/room_123/messages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Archive chat
curl -X PUT "https://api.kcs-platform.com/api/chat/rooms/room_123/archive" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_archived": true}'

# Get unread count
curl -X GET "https://api.kcs-platform.com/api/chat/unread-count" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Mark as read
curl -X PUT "https://api.kcs-platform.com/api/chat/rooms/room_123/read-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_read": true, "last_read_message_id": "msg_456"}'

# Forward message
curl -X POST "https://api.kcs-platform.com/api/chat/messages/msg_123/forward" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_room_ids": ["room_456", "room_789"]}'
```

---

## 📝 Implementation Timeline

### Phase 1 (Week 1) - Critical Fixes
- [ ] Database migrations (user_chat_preferences table)
- [ ] Unread count function and caching
- [ ] WebSocket heartbeat and message queue
- [ ] Seen receipt fix
- **Priority:** HIGH

### Phase 2 (Week 2) - Core Features
- [ ] DELETE /api/chat/rooms/:id endpoint
- [ ] DELETE /api/chat/rooms/:id/messages endpoint
- [ ] PUT /api/chat/rooms/:id/archive endpoint
- [ ] Modified GET /api/chat/rooms with filters
- **Priority:** HIGH

### Phase 3 (Week 3) - Enhanced Features
- [ ] GET /api/chat/unread-count endpoint
- [ ] PUT /api/chat/rooms/:id/read-status endpoint
- [ ] Message forwarding improvements
- [ ] WebSocket event additions
- **Priority:** MEDIUM

### Phase 4 (Week 4-6) - Encryption
- [ ] Encryption key tables
- [ ] POST /api/chat/encryption/keys endpoint
- [ ] GET /api/chat/encryption/keys/:user_id endpoint
- [ ] POST /api/chat/encryption/verify endpoint
- [ ] Encrypted message storage
- **Priority:** LOW (but important for production)

---

## 📚 Additional Resources

- [Socket.IO Best Practices](https://socket.io/docs/v4/best-practices/)
- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)
- [JWT Authentication](https://jwt.io/introduction)

---

## 🤝 Contact

For questions or clarifications:
- **Frontend Team:** Check CHAT_FEATURE_ENHANCEMENT_PLAN.md for full context
- **Mobile App Lead:** Available for API contract discussions
- **Backend Team Lead:** Coordinate implementation timeline

---

**Document Status:** ✅ Ready for Implementation  
**Last Updated:** November 5, 2025  
**Priority:** HIGH - Required for v2.0 Release
