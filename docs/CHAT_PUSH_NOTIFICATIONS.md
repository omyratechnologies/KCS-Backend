# Chat Push Notifications Implementation

## Overview

Push notifications have been integrated into the chat system to notify users of new messages when they are offline or not actively viewing a chat room. This ensures users stay engaged and don't miss important messages.

## Features

### Smart Notification Delivery
- **Only sends to offline users**: Push notifications are sent only to users who are NOT actively viewing the chat room via WebSocket
- **Prevents notification spam**: Online users receive real-time messages through WebSocket instead
- **Non-blocking**: Push notification failures don't affect message sending

### Notification Types

#### 1. Personal Chat Notifications
```
Title: John Doe
Body: Hello! How are you?
```

#### 2. Group Chat Notifications
```
Title: Class 10-A Group
Body: John Doe: Hey everyone!
```

### Notification Data Payload

Each push notification includes rich data for app navigation:

```json
{
  "type": "chat_message",
  "chat_type": "personal" | "class_group" | "subject_group" | "custom_group",
  "room_id": "room_123",
  "message_id": "msg_456",
  "sender_id": "user_789",
  "sender_name": "John Doe",
  "message_type": "text" | "image" | "video" | "file" | "audio",
  "timestamp": "2025-10-28T10:30:00.000Z"
}
```

## Implementation Details

### ChatService Integration

**Location**: `src/services/chat.service.ts`

The `sendMessage` method now includes push notification logic:

```typescript
// After WebSocket broadcast
await this.sendChatPushNotification(message, sender_id, room_id, campus_id);
```

### Push Notification Logic Flow

```
1. User sends a message
   ↓
2. Message saved to database
   ↓
3. WebSocket broadcast to online room members
   ↓
4. Get room details and members
   ↓
5. Check who is actively viewing the chat (via WebSocket)
   ↓
6. Filter offline/inactive users
   ↓
7. Send push notification to offline users only
   ↓
8. Log delivery status
```

### SocketService Enhancement

**New Method**: `getOnlineUsersInChatRoom(roomId: string): string[]`

**Location**: `src/services/socket.service.ts`

```typescript
public static getOnlineUsersInChatRoom(roomId: string): string[] {
    const roomName = `chat_room_${roomId}`;
    const onlineUsers: string[] = [];

    this.io.sockets.sockets.forEach((socket) => {
        if (socket.rooms.has(roomName)) {
            const userId = socket.data?.user_id;
            if (userId && !onlineUsers.includes(userId)) {
                onlineUsers.push(userId);
            }
        }
    });

    return onlineUsers;
}
```

This method checks which users are currently connected to a specific chat room via WebSocket.

## Message Content Handling

### Text Messages
- Full content displayed (up to 100 characters)
- Truncated with "..." if longer

### Media Messages
- Image: "Sent an image"
- Video: "Sent a video"
- File: "Sent a file"
- Audio: "Sent an audio"

## User Experience

### For Offline Users
1. Receive push notification immediately
2. Can tap notification to open app directly to the chat room
3. Notification shows sender name and preview of message

### For Online Users (in chat room)
1. See message instantly via WebSocket
2. No push notification (avoids duplicate alerts)
3. Seamless real-time experience

### For Online Users (but in different chat)
1. Receive push notification
2. Can switch to the relevant chat quickly

## Error Handling

### Graceful Degradation
- Push notification failures are logged but don't block message sending
- WebSocket broadcast always happens first (priority)
- Users can still receive messages via WebSocket or when they open the app

### Logging
```typescript
// Success
✅ Push notification sent for message msg_123 to 3/5 recipients

// Failure
❌ Push notification failed for message msg_123: Invalid tokens
```

## Configuration

### Dependencies
- **PushNotificationService**: Handles Firebase Cloud Messaging
- **SocketService**: Tracks online users and manages WebSocket connections
- **ChatService**: Orchestrates message sending and notifications

### No Additional Setup Required
Push notifications automatically work once:
1. Users register their device tokens via `/api/push-notification/register-token`
2. Firebase is properly configured in the backend

## Testing

### Test Scenarios

#### 1. Both Users Online
```bash
# Expected: No push notification, WebSocket only
curl -X POST 'https://devapi.letscatchup-kcs.com/api/chat/rooms/{room_id}/messages' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"content": "Hello!"}'
```

#### 2. Recipient Offline
```bash
# Expected: Push notification sent to recipient
# (Have recipient close app or disconnect WebSocket)
curl -X POST 'https://devapi.letscatchup-kcs.com/api/chat/rooms/{room_id}/messages' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"content": "Are you there?"}'
```

#### 3. Group Chat (Mixed Online/Offline)
```bash
# Expected: Push notification to offline members only
curl -X POST 'https://devapi.letscatchup-kcs.com/api/chat/rooms/{room_id}/messages' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"content": "Team meeting at 3pm!"}'
```

## Performance Considerations

### Optimizations
1. **Batch notifications**: Uses `sendToSpecificUsers` to batch multiple recipients
2. **Filter first, send after**: Checks online status before making Firebase API calls
3. **Async execution**: Push notifications don't block the main message flow
4. **Smart filtering**: Only processes room members (excludes sender)

### Scalability
- Works efficiently for rooms with up to 100+ members
- Firebase FCM handles batching and retries automatically
- Couchbase queries optimized with indexed fields

## Admin Monitoring

### View All Device Tokens
```bash
curl 'https://devapi.letscatchup-kcs.com/api/push-notification/campus-tokens' \
  -H 'Authorization: Bearer ADMIN_TOKEN'
```

### Filter Active Tokens
```bash
curl 'https://devapi.letscatchup-kcs.com/api/push-notification/campus-tokens?is_active=true' \
  -H 'Authorization: Bearer ADMIN_TOKEN'
```

### WebSocket Statistics
```bash
curl 'https://devapi.letscatchup-kcs.com/api/chat/websocket-stats' \
  -H 'Authorization: Bearer ADMIN_TOKEN'
```

## Mobile App Integration

### Handling Notification Tap (React Native)

```javascript
import messaging from '@react-native-firebase/messaging';

// Background/Quit state
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const data = remoteMessage.data;
  
  if (data.type === 'chat_message') {
    // Navigate to chat room
    navigation.navigate('ChatRoom', {
      room_id: data.room_id,
      message_id: data.message_id
    });
  }
});

// Foreground state
messaging().onMessage(async remoteMessage => {
  const data = remoteMessage.data;
  
  // Show in-app notification or update UI
  if (data.type === 'chat_message') {
    showInAppNotification(remoteMessage.notification);
  }
});
```

## Security

### Access Control
- Only room members receive notifications
- Campus-based isolation enforced
- Device tokens tied to authenticated users
- No cross-campus notification leakage

### Privacy
- Message content truncated in notifications
- Full message only visible when user opens the chat
- Sender information validated before notification

## Future Enhancements

### Possible Improvements
1. **Notification preferences**: Let users mute specific chats
2. **Smart batching**: "3 new messages from John" instead of 3 separate notifications
3. **Do Not Disturb**: Respect user's quiet hours
4. **Priority notifications**: Mark urgent messages differently
5. **Rich notifications**: Include user avatars, inline reply
6. **Read receipts**: Mark notifications as read when message is seen
7. **Notification sounds**: Custom sounds per chat type

## Troubleshooting

### Push Notifications Not Received

**Check 1: Device Token Registered?**
```bash
curl 'https://devapi.letscatchup-kcs.com/api/push-notification/device-tokens' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

**Check 2: User Actually Offline?**
```bash
# Admin only: Check WebSocket stats
curl 'https://devapi.letscatchup-kcs.com/api/chat/websocket-stats' \
  -H 'Authorization: Bearer ADMIN_TOKEN'
```

**Check 3: Firebase Configuration?**
- Verify `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is set
- Check Firebase Console for delivery logs

**Check 4: Server Logs**
```bash
# Look for push notification logs
grep "Push notification" logs/app.log
```

## Related Documentation

- [CHAT_API_DOCUMENTATION.md](./CHAT_API_DOCUMENTATION.md) - Complete chat API reference
- [FIREBASE_PUSH_NOTIFICATIONS.md](./FIREBASE_PUSH_NOTIFICATIONS.md) - Firebase setup guide
- [CHAT_WEBSOCKET_INTEGRATION.md](./CHAT_WEBSOCKET_INTEGRATION.md) - WebSocket implementation

## Changelog

### v1.0.0 (2025-10-28)
- ✅ Initial implementation of chat push notifications
- ✅ Smart offline detection via WebSocket room tracking
- ✅ Support for personal and group chat notifications
- ✅ Rich notification data payload
- ✅ Message content truncation
- ✅ Graceful error handling
- ✅ Comprehensive logging

---

**Status**: ✅ Production Ready  
**Last Updated**: October 28, 2025  
**Author**: KCS Backend Team
