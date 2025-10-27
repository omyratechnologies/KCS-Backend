# Push Notification Types Reference for App Developers

## Overview
This document lists all push notification types that the KCS Backend sends, along with their data payloads. App developers should handle these notification types in their mobile/web applications.

**Last Updated:** October 28, 2025  
**Backend Version:** 1.0.0

---

## Table of Contents
1. [Notification Categories](#notification-categories)
2. [Chat Notifications](#chat-notifications)
3. [Campus-Wide Announcements](#campus-wide-announcements)
4. [Future Notification Types](#future-notification-types)
5. [Data Payload Structure](#data-payload-structure)
6. [Implementation Guide](#implementation-guide)

---

## Notification Categories

The backend uses a `notification_type` field to categorize notifications:

| Category | Description | Current Implementation |
|----------|-------------|----------------------|
| `campus_wide` | Campus-wide announcements sent to all users | ✅ Implemented |
| `class` | Class/group-specific notifications (includes chat messages) | ✅ Implemented |
| `student` | Student-specific notifications | 🔜 Planned |
| `teacher` | Teacher-specific notifications | 🔜 Planned |
| `parent` | Parent-specific notifications | 🔜 Planned |

---

## Chat Notifications

### 1. New Chat Message
**Type:** `chat_message`  
**Notification Category:** `class`  
**Trigger:** When a user sends a message and recipients are offline

#### Data Payload
```json
{
  "notification_type": "class",
  "type": "chat_message",
  "chat_type": "direct|group|class_group|subject_group",
  "room_id": "string",
  "message_id": "string",
  "sender_id": "string",
  "sender_name": "string",
  "message_type": "text|image|video|audio|file|location",
  "timestamp": "ISO 8601 date string",
  "campus_id": "string"
}
```

#### Title Formats
- **Direct Chat:** `{sender_name}`
- **Group Chat:** `{sender_name} in {group_name}`

#### Body Formats
- **Text Message:** Message content (truncated to 100 chars)
- **Image:** "Sent an image 📷"
- **Video:** "Sent a video 🎥"
- **Audio:** "Sent an audio message 🎵"
- **File:** "Sent a file 📎"
- **Location:** "Sent a location 📍"

#### App Handling
```javascript
// Example: React Native / Flutter
if (notification.data.type === "chat_message") {
  // Navigate to chat room
  navigation.navigate("ChatRoom", {
    roomId: notification.data.room_id,
    messageId: notification.data.message_id
  });
}
```

---

## Campus-Wide Announcements

### 2. Campus Announcement
**Type:** `announcement`  
**Notification Category:** `campus_wide`  
**Trigger:** When admin sends a campus-wide announcement

#### Data Payload
```json
{
  "notification_type": "campus_wide",
  "type": "announcement",
  "announcement_id": "string",
  "priority": "normal|high",
  "campus_id": "string",
  "timestamp": "ISO 8601 date string"
}
```

#### Title Format
Custom title set by admin

#### Body Format
Custom message set by admin

#### Target Recipients
Can be filtered by `target_user_types`:
- `Student`
- `Teacher`
- `Parent`
- `Admin`

#### App Handling
```javascript
if (notification.data.type === "announcement") {
  // Navigate to announcements screen
  navigation.navigate("Announcements", {
    announcementId: notification.data.announcement_id
  });
}
```

---

## Future Notification Types

### 3. Assignment Notifications (Planned)
**Type:** `assignment_due`, `assignment_graded`  
**Notification Category:** `student`, `teacher`

#### Potential Data Payload
```json
{
  "notification_type": "student",
  "type": "assignment_due|assignment_graded",
  "assignment_id": "string",
  "assignment_name": "string",
  "due_date": "ISO 8601 date string",
  "class_id": "string",
  "subject_id": "string"
}
```

### 4. Fee Payment Notifications (Planned)
**Type:** `fee_due`, `fee_paid`, `fee_overdue`  
**Notification Category:** `student`, `parent`

#### Potential Data Payload
```json
{
  "notification_type": "student",
  "type": "fee_due|fee_paid|fee_overdue",
  "fee_id": "string",
  "amount": "number",
  "due_date": "ISO 8601 date string",
  "payment_status": "string"
}
```

### 5. Attendance Notifications (Planned)
**Type:** `attendance_marked`, `attendance_alert`  
**Notification Category:** `student`, `parent`, `teacher`

#### Potential Data Payload
```json
{
  "notification_type": "student",
  "type": "attendance_marked|attendance_alert",
  "attendance_id": "string",
  "date": "ISO 8601 date string",
  "status": "present|absent|late",
  "class_id": "string"
}
```

### 6. Exam/Quiz Notifications (Planned)
**Type:** `exam_scheduled`, `exam_reminder`, `results_published`  
**Notification Category:** `student`, `teacher`

#### Potential Data Payload
```json
{
  "notification_type": "student",
  "type": "exam_scheduled|exam_reminder|results_published",
  "exam_id": "string",
  "exam_name": "string",
  "exam_date": "ISO 8601 date string",
  "class_id": "string",
  "subject_id": "string"
}
```

### 7. Meeting/Class Notifications (Planned)
**Type:** `meeting_scheduled`, `meeting_starting`, `meeting_cancelled`  
**Notification Category:** `student`, `teacher`

#### Potential Data Payload
```json
{
  "notification_type": "class",
  "type": "meeting_scheduled|meeting_starting|meeting_cancelled",
  "meeting_id": "string",
  "meeting_title": "string",
  "start_time": "ISO 8601 date string",
  "meeting_link": "string"
}
```

### 8. Leave Request Notifications (Planned)
**Type:** `leave_approved`, `leave_rejected`, `leave_pending`  
**Notification Category:** `student`, `teacher`, `parent`

#### Potential Data Payload
```json
{
  "notification_type": "student",
  "type": "leave_approved|leave_rejected|leave_pending",
  "leave_id": "string",
  "start_date": "ISO 8601 date string",
  "end_date": "ISO 8601 date string",
  "status": "approved|rejected|pending"
}
```

---

## Data Payload Structure

### Common Fields
All notifications include these fields:

| Field | Type | Description |
|-------|------|-------------|
| `notification_type` | string | Category: `campus_wide`, `class`, `student`, `teacher`, `parent` |
| `type` | string | Specific notification type (e.g., `chat_message`, `announcement`) |
| `campus_id` | string | Campus identifier for multi-tenancy |
| `timestamp` | string | ISO 8601 formatted timestamp |

### Optional Fields
Additional fields based on notification type:

| Field | Type | Used In |
|-------|------|---------|
| `room_id` | string | Chat notifications |
| `message_id` | string | Chat notifications |
| `sender_id` | string | Chat notifications |
| `sender_name` | string | Chat notifications |
| `chat_type` | string | Chat notifications |
| `message_type` | string | Chat notifications |
| `priority` | string | Announcements |
| `announcement_id` | string | Announcements |

---

## Implementation Guide

### 1. Device Token Registration

#### Endpoint
```
POST /api/push-notification/register-token
```

#### Request Body
```json
{
  "device_token": "firebase_device_token_here",
  "device_type": "android|ios|web",
  "device_info": {
    "model": "iPhone 14 Pro",
    "os_version": "iOS 17.0",
    "app_version": "1.0.0"
  }
}
```

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

### 2. Topic Subscription

The backend automatically subscribes your device to:
- **Campus Topic:** `campus_{campus_id}` (for campus-wide announcements)

### 3. Handling Notifications

#### When App is in Foreground
```javascript
// React Native Example
messaging().onMessage(async remoteMessage => {
  const { notification, data } = remoteMessage;
  
  // Display in-app notification
  showInAppNotification(notification.title, notification.body);
  
  // Handle data based on type
  switch (data.type) {
    case 'chat_message':
      handleChatMessage(data);
      break;
    case 'announcement':
      handleAnnouncement(data);
      break;
    default:
      console.log('Unknown notification type:', data.type);
  }
});
```

#### When App is in Background/Quit
```javascript
// React Native Example
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message:', remoteMessage);
  // Update local database or state
});

// Handle notification tap
messaging().onNotificationOpenedApp(remoteMessage => {
  const { data } = remoteMessage;
  navigateToScreen(data);
});

// Check if app was opened from notification (quit state)
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      navigateToScreen(remoteMessage.data);
    }
  });
```

### 4. Navigation Handler
```javascript
function navigateToScreen(data) {
  switch (data.type) {
    case 'chat_message':
      navigation.navigate('ChatRoom', {
        roomId: data.room_id,
        messageId: data.message_id
      });
      break;
      
    case 'announcement':
      navigation.navigate('Announcements', {
        announcementId: data.announcement_id
      });
      break;
      
    default:
      navigation.navigate('Home');
  }
}
```

### 5. Notification Permissions

#### Android
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### iOS
Add to `Info.plist`:
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

Request permission in code:
```javascript
// React Native Example
import messaging from '@react-native-firebase/messaging';

async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted');
    // Register device token
    const token = await messaging().getToken();
    registerDeviceToken(token);
  }
}
```

### 6. Token Refresh Handling
```javascript
// React Native Example
messaging().onTokenRefresh(token => {
  // Update token on backend
  registerDeviceToken(token);
});
```

### 7. Unregister Device Token

#### Endpoint
```
POST /api/push-notification/unregister-token
```

#### Request Body
```json
{
  "device_token": "firebase_device_token_here"
}
```

Call this when:
- User logs out
- User disables notifications in app settings
- App is uninstalled (handle on backend automatically)

---

## Testing

### Test Notification Endpoint (Admin Only)

#### Endpoint
```
POST /api/push-notification/test
```

#### Request Body
```json
{
  "title": "Test Notification",
  "message": "This is a test message",
  "target_user_types": ["Student", "Teacher"]
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "success": true,
    "total_recipients": 150,
    "successful_sends": 145,
    "failed_sends": 5,
    "details": {
      "tokens_sent": 145,
      "topic_sent": true,
      "invalid_tokens": [],
      "errors": []
    }
  }
}
```

---

## Best Practices

### 1. **Handle All Notification Types**
Implement a fallback for unknown notification types to avoid crashes.

### 2. **Cache Notification Data**
Store notification data locally so users can view them even when offline.

### 3. **Notification Grouping**
Group similar notifications (e.g., multiple chat messages from same room) to avoid spam.

### 4. **Sound & Vibration**
Customize notification sounds based on type:
- Chat messages: Light sound
- Announcements: Louder sound
- Urgent alerts: Vibration + sound

### 5. **Badge Count**
Update app badge count for unread notifications:
```javascript
// React Native Example
import PushNotification from 'react-native-push-notification';

PushNotification.setApplicationIconBadgeNumber(unreadCount);
```

### 6. **Notification Channels (Android)**
Create separate channels for different notification types:
```javascript
// React Native Example
PushNotification.createChannel({
  channelId: "chat_messages",
  channelName: "Chat Messages",
  importance: 4,
  vibrate: true,
});

PushNotification.createChannel({
  channelId: "announcements",
  channelName: "Campus Announcements",
  importance: 5,
  vibrate: true,
});
```

### 7. **Error Handling**
Always handle FCM token registration failures gracefully:
```javascript
try {
  const token = await messaging().getToken();
  await registerDeviceToken(token);
} catch (error) {
  console.error('Failed to register device token:', error);
  // Retry with exponential backoff
}
```

### 8. **Notification Analytics**
Track notification interactions:
- Delivery rate
- Open rate
- Action taken (dismissed, tapped, swiped)

---

## Troubleshooting

### Common Issues

#### 1. Notifications Not Received
- **Check:** Device token registered correctly
- **Check:** User is subscribed to campus topic
- **Check:** Firebase project configuration
- **Check:** Network connectivity

#### 2. Notifications Received But Not Displaying
- **Check:** Notification permissions granted
- **Check:** App is not in Do Not Disturb mode
- **Check:** Notification channel settings (Android)

#### 3. Deep Links Not Working
- **Check:** Navigation handler implemented
- **Check:** Data payload parsing
- **Check:** Screen exists in navigation stack

#### 4. Token Registration Fails
- **Check:** Valid JWT token in Authorization header
- **Check:** Backend endpoint reachable
- **Check:** Device type matches enum: `android|ios|web`

---

## API Endpoints Summary

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/push-notification/register-token` | POST | Register device token | Yes |
| `/api/push-notification/unregister-token` | POST | Unregister device token | Yes |
| `/api/push-notification/device-tokens` | GET | Get user's device tokens | Yes |
| `/api/push-notification/campus-tokens` | GET | Get all campus tokens (Admin) | Yes (Admin) |
| `/api/push-notification/test` | POST | Send test notification (Admin) | Yes (Admin) |
| `/api/push-notification/cleanup-tokens` | POST | Clean up old tokens (Admin) | Yes (Admin) |

---

## Support & Questions

For implementation questions or issues:
1. Check the backend logs for push notification errors
2. Verify Firebase console for message delivery stats
3. Test with the `/test` endpoint (Admin only)
4. Contact backend team with device token and timestamp for debugging

---

## Changelog

### Version 1.0.0 (October 28, 2025)
- ✅ Chat message notifications
- ✅ Campus-wide announcements
- ✅ Device token management
- ✅ Topic subscription (campus-level)
- ✅ Admin test notifications

### Upcoming Features
- 🔜 Assignment notifications
- 🔜 Fee payment notifications
- 🔜 Attendance notifications
- 🔜 Exam/quiz notifications
- 🔜 Meeting notifications
- 🔜 Leave request notifications
- 🔜 User-level notification preferences
- 🔜 Notification history API

---

## Related Documentation
- [Chat Push Notifications Implementation](./CHAT_PUSH_NOTIFICATIONS.md)
- [Firebase Push Notifications Setup](./FIREBASE_PUSH_NOTIFICATIONS_SETUP.md)
- [Chat API Documentation](./CHAT_API_DOCUMENTATION.md)
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md)
