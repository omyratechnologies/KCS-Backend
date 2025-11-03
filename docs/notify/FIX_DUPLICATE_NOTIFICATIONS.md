# Fix Duplicate Notifications - SOLUTION

## Problem

Notifications are appearing twice because:
1. Firebase automatically displays notifications with `notification` payload when app is in background/killed
2. Your foreground listener also processes and could display the same notification

## Root Cause

When your backend sends a message like this:
```javascript
{
  token: fcmToken,
  notification: {           // ❌ This causes Firebase to auto-display
    title: "Happy Day",
    body: "This is an important campus-wide announcement"
  },
  data: {
    type: "announcement",
    // ...
  }
}
```

Firebase automatically displays it when the app is in background/killed, creating a duplicate.

## ✅ Solution: Send Data-Only Messages

### Backend Changes Required

Update your backend to send **data-only messages** (no `notification` field):

```javascript
// ✅ CORRECT - Data-only message
await admin.messaging().send({
  token: fcmToken,
  data: {
    title: "Happy Day",                                    // Move title to data
    body: "This is an important campus-wide announcement", // Move body to data
    type: "announcement",
    announcement_id: "123",
    notification_type: "campus_wide",
    campus_id: "456",
    timestamp: new Date().toISOString(),
  },
  android: {
    priority: 'high',
  },
  apns: {
    payload: {
      aps: {
        contentAvailable: true,  // For iOS background delivery
      }
    },
    headers: {
      'apns-priority': '10',
    }
  }
});
```

### Why This Works

1. **Data-only messages** are delivered to your app without being automatically displayed
2. Your app's `onMessage` listener receives the message in all states:
   - Foreground: `onMessage` handler
   - Background: `setBackgroundMessageHandler`
   - Killed: Notification tray, handled when opened
3. **You have full control** over when and how to display notifications

## Implementation in Your App

Your app is already configured correctly to handle data-only messages:

### 1. Foreground Handler (Already Implemented)
```typescript
// In FirebaseNotificationService.ts
setupNotificationListeners(onMessageReceived?: (message: any) => void) {
  const unsubscribe = onMessageModular(messagingInstance, async (remoteMessage) => {
    console.log('📬 Foreground FCM message received:', remoteMessage);
    // Your app can display the notification here
    if (onMessageReceived) {
      onMessageReceived(remoteMessage);
    }
  });
  return unsubscribe;
}
```

### 2. Background Handler (Already Implemented)
```javascript
// In index.js
setBackgroundMessageHandlerModular(messagingInstance, async remoteMessage => {
  console.log('📬 Background FCM message received:', remoteMessage);
  // Message is received, Firebase won't auto-display if it's data-only
});
```

### 3. Display Notifications (If Needed)

If you want to display notifications when the app is in foreground, you can use local notifications:

```typescript
// Optional: Display notification in foreground
import { Alert } from 'react-native';

setupNotificationListeners((message) => {
  // Show in-app alert or custom UI
  Alert.alert(
    message.data.title,
    message.data.body,
    [
      {
        text: 'View',
        onPress: () => {
          // Navigate to relevant screen
          notificationHandler.handleNotificationData(message.data);
        }
      },
      { text: 'Dismiss' }
    ]
  );
});
```

## Backend Message Examples

### ✅ Announcement (Data-Only)
```javascript
await admin.messaging().send({
  token: fcmToken,
  data: {
    title: "Campus Announcement",
    body: "Important update for all students",
    type: "announcement",
    announcement_id: "123",
    notification_type: "campus_wide",
    priority: "high",
  }
});
```

### ✅ Assignment Due (Data-Only)
```javascript
await admin.messaging().send({
  token: fcmToken,
  data: {
    title: "Assignment Due Tomorrow",
    body: "Math homework deadline approaching",
    type: "assignment_due",
    assignment_id: "456",
    assignment_name: "Algebra Chapter 5",
    class_id: "789",
    subject_id: "101",
  }
});
```

### ✅ Chat Message (Data-Only)
```javascript
await admin.messaging().send({
  token: fcmToken,
  data: {
    title: "John Doe",
    body: "Sent you a message",
    type: "chat_message",
    room_id: "abc123",
    message_id: "msg456",
    sender_id: "user789",
    sender_name: "John Doe",
  }
});
```

## Testing

### 1. Test with Firebase Console

When testing from Firebase Console, use the "Custom data" section:

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. **DO NOT** fill in "Notification title" and "Notification text"
4. Scroll down to "Additional options"
5. Click "Custom data"
6. Add key-value pairs:
   - `title`: "Test Title"
   - `body`: "Test Body"
   - `type`: "announcement"
   - etc.

### 2. Verify No Duplicates

After backend changes:
1. Send notification from backend
2. App in background → Should see **ONE** notification
3. App in foreground → Message received in listener
4. ✅ No duplicates!

## Alternative: Keep notification field but handle duplicates

If you **MUST** keep the `notification` field (e.g., for compatibility), you can prevent duplicates by:

### Option A: Don't process in foreground if notification field exists

```typescript
setupNotificationListeners((message) => {
  // Only process data-only messages in foreground
  if (!message.notification) {
    // Display custom notification or handle data
    console.log('Data-only message:', message.data);
  } else {
    // Firebase already displayed it, just handle navigation data
    console.log('Notification auto-displayed by Firebase');
  }
});
```

### Option B: Use Android notification channels to control display

Configure your Android app to not auto-display:

```typescript
// This would require notifee or native code
// Generally not recommended - easier to use data-only messages
```

## Recommended Approach

**✅ Use data-only messages** - This is the cleanest solution:
- Full control over notification display
- No duplicates
- Consistent behavior across platforms
- Better user experience

## Backend Migration Checklist

- [ ] Update all notification sending code to use data-only format
- [ ] Move `title` and `body` from `notification` to `data`
- [ ] Remove `notification` field entirely
- [ ] Test on both Android and iOS
- [ ] Verify no duplicates in all app states (foreground, background, killed)

## Summary

**Problem**: Notifications appearing twice  
**Cause**: Backend sending `notification` field + your app processing messages  
**Solution**: Send data-only messages (remove `notification` field from backend)  
**Result**: One notification, full control, no duplicates ✅

---

**Important**: Coordinate with your backend team to make these changes. All Firebase Admin SDK code that sends notifications needs to be updated to use the data-only format.
