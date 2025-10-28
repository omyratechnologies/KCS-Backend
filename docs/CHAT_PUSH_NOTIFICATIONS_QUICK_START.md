# Chat Push Notifications - Quick Start Guide

## 🚀 Overview

Chat messages automatically trigger push notifications to offline users. No additional API calls needed!

## ✅ How It Works

```
User sends message → Message saved → WebSocket broadcast → Push notification to offline users
```

## 📱 Register Device Token (Frontend)

### Step 1: Get FCM Token
```javascript
import messaging from '@react-native-firebase/messaging';

const fcmToken = await messaging().getToken();
```

### Step 2: Register with Backend
```bash
POST /api/push-notification/register-token
Authorization: Bearer YOUR_JWT_TOKEN

{
  "device_token": "your_fcm_token_here",
  "device_type": "android",  // or "ios", "web"
  "device_info": {
    "model": "iPhone 14",
    "os_version": "17.0",
    "app_version": "1.0.0"
  }
}
```

## 💬 Send Message (Automatic Push)

```bash
POST /api/chat/rooms/{room_id}/messages
Authorization: Bearer YOUR_JWT_TOKEN

{
  "content": "Hello everyone!",
  "message_type": "text"
}
```

**Result:**
- ✅ Message saved
- ✅ WebSocket broadcast to online users
- ✅ Push notification sent to offline users

## 📊 Notification Format

### Personal Chat
```
Title: John Doe
Body: Hey, how are you?
```

### Group Chat
```
Title: Class 10-A Group
Body: John Doe: Homework is due tomorrow!
```

## 🎯 Handle Notifications (Frontend)

### React Native Example
```javascript
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';

// When app is in background or quit
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message:', remoteMessage);
});

// When notification is tapped
messaging().onNotificationOpenedApp(remoteMessage => {
  const { room_id, message_id } = remoteMessage.data;
  
  // Navigate to chat room
  navigation.navigate('ChatRoom', { 
    room_id,
    highlightMessage: message_id 
  });
});

// When app is opened from quit state via notification
messaging().getInitialNotification().then(remoteMessage => {
  if (remoteMessage) {
    const { room_id } = remoteMessage.data;
    navigation.navigate('ChatRoom', { room_id });
  }
});

// When app is in foreground
messaging().onMessage(async remoteMessage => {
  // Show in-app notification or update badge
  showLocalNotification(remoteMessage);
});
```

## 🔍 Notification Data Structure

```javascript
{
  "type": "chat_message",
  "chat_type": "personal",        // or "class_group", "subject_group", "custom_group"
  "room_id": "room_12345",
  "message_id": "msg_67890",
  "sender_id": "user_abc",
  "sender_name": "John Doe",
  "message_type": "text",         // or "image", "video", "file", "audio"
  "timestamp": "2025-10-28T10:30:00.000Z"
}
```

## 🎨 UI Examples

### Flutter
```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  if (message.data['type'] == 'chat_message') {
    showNotification(
      title: message.notification?.title ?? 'New Message',
      body: message.notification?.body ?? '',
      payload: message.data,
    );
  }
});
```

### iOS (Swift)
```swift
extension AppDelegate: UNUserNotificationCenterDelegate {
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    
    if let type = userInfo["type"] as? String, type == "chat_message" {
      let roomId = userInfo["room_id"] as? String
      // Navigate to chat room
    }
    
    completionHandler()
  }
}
```

## 🔧 Testing

### Test 1: Offline User Notification
```bash
# 1. User A opens chat room
# 2. User B closes app or disconnects
# 3. User A sends message:

curl -X POST 'https://devapi.letscatchup-kcs.com/api/chat/rooms/room_123/messages' \
  -H 'Authorization: Bearer USER_A_TOKEN' \
  -d '{"content": "Hello!"}'

# Expected: User B receives push notification
```

### Test 2: Online User (No Notification)
```bash
# 1. Both users in same chat room
# 2. User A sends message:

curl -X POST 'https://devapi.letscatchup-kcs.com/api/chat/rooms/room_123/messages' \
  -H 'Authorization: Bearer USER_A_TOKEN' \
  -d '{"content": "Hello!"}'

# Expected: User B sees message via WebSocket, NO push notification
```

## 🐛 Debugging

### Check Device Token Registration
```bash
GET /api/push-notification/device-tokens
Authorization: Bearer YOUR_TOKEN

# Response:
{
  "success": true,
  "data": [
    {
      "id": "token_xxx",
      "device_token": "your_fcm_token",
      "device_type": "android",
      "is_active": true,
      "last_used_at": "2025-10-28T10:00:00Z"
    }
  ]
}
```

### View All Campus Tokens (Admin Only)
```bash
GET /api/push-notification/campus-tokens?is_active=true
Authorization: Bearer ADMIN_TOKEN
```

### Check WebSocket Connection Status (Admin Only)
```bash
GET /api/chat/websocket-stats
Authorization: Bearer ADMIN_TOKEN

# Response:
{
  "totalConnections": 45,
  "totalUsers": 38,
  "activeChatRooms": 12
}
```

## ⚡ Performance Tips

1. **Register token once**: Store token locally, only re-register if changed
2. **Handle token refresh**: FCM tokens can expire
3. **Batch operations**: Don't register token on every app launch
4. **Background restrictions**: Test on real devices (emulators behave differently)

## 🔐 Security Notes

- ✅ Only room members receive notifications
- ✅ Campus-based isolation enforced
- ✅ Device tokens tied to user accounts
- ✅ Messages truncated in notifications (privacy)

## 🚨 Common Issues

### Issue 1: Not Receiving Notifications
**Solutions:**
- Check device token is registered
- Verify FCM configuration in Firebase Console
- Check app permissions for notifications
- Test with different network conditions

### Issue 2: Receiving Too Many Notifications
**Solutions:**
- Check if user is properly joining chat rooms via WebSocket
- Verify WebSocket connection is stable
- Review `socket.service.ts` logs

### Issue 3: Notification Opens Wrong Chat
**Solutions:**
- Verify `room_id` in notification data
- Check navigation logic in app
- Ensure deep linking is configured correctly

## 📚 Related APIs

### Push Notification Endpoints
- `POST /api/push-notification/register-token` - Register device
- `POST /api/push-notification/unregister-token` - Unregister device
- `GET /api/push-notification/device-tokens` - Get your tokens
- `GET /api/push-notification/campus-tokens` - Get all tokens (admin)

### Chat Endpoints
- `POST /api/chat/rooms/{room_id}/messages` - Send message (auto push)
- `GET /api/chat/rooms` - Get all chat rooms
- `GET /api/chat/rooms/{room_id}/messages` - Get messages

### WebSocket Events
- `new-chat-message` - Real-time message broadcast
- `chat-message-seen` - Message seen status
- `chat-message-edited` - Message edited
- `chat-message-deleted` - Message deleted

## 📖 Full Documentation

For complete details, see:
- [CHAT_PUSH_NOTIFICATIONS.md](./CHAT_PUSH_NOTIFICATIONS.md)
- [FIREBASE_PUSH_NOTIFICATIONS.md](./FIREBASE_PUSH_NOTIFICATIONS.md)
- [CHAT_API_DOCUMENTATION.md](./CHAT_API_DOCUMENTATION.md)

---

**Need Help?** Check server logs or contact backend team.
