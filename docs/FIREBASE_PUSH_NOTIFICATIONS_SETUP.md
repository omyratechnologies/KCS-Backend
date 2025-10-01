# Firebase Push Notifications Setup Guide

This guide explains how to set up Firebase push notifications for the KCS Backend application.

## Prerequisites

1. A Firebase project
2. Firebase Admin SDK service account key
3. Client applications configured with Firebase SDK

## Firebase Project Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

### 2. Enable Cloud Messaging

1. In your Firebase project console, go to "Project settings" (gear icon)
2. Navigate to the "Cloud Messaging" tab
3. Note down your "Server key" (this will be used for authentication)

### 3. Generate Service Account Key

1. In Firebase console, go to "Project settings" > "Service accounts"
2. Click "Generate new private key"
3. Download the JSON file containing your service account credentials
4. Keep this file secure - it contains sensitive credentials

## Backend Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

**Important Notes:**
- `FIREBASE_PROJECT_ID`: Your Firebase project ID (found in project settings)
- `FIREBASE_SERVICE_ACCOUNT_KEY`: The entire contents of the service account JSON file as a string

### Alternative Configuration (Recommended for Production)

For production environments, you can also use individual environment variables:

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project-id.iam.gserviceaccount.com
```

## Client Application Setup

### Android

1. Add your Android app to Firebase project
2. Download `google-services.json`
3. Add Firebase SDK to your Android app
4. Implement FCM token registration

### iOS

1. Add your iOS app to Firebase project
2. Download `GoogleService-Info.plist`
3. Add Firebase SDK to your iOS app
4. Configure APNs certificates
5. Implement FCM token registration

### Web

1. Add your web app to Firebase project
2. Get your web app configuration
3. Add Firebase SDK to your web app
4. Implement FCM in your web application

## API Endpoints

Once configured, the following endpoints will be available:

### User Endpoints

- `POST /push-notification/register-token` - Register device token
- `POST /push-notification/unregister-token` - Unregister device token
- `GET /push-notification/device-tokens` - Get user's device tokens

### Admin Endpoints

- `POST /push-notification/test` - Send test notification
- `POST /push-notification/cleanup-tokens` - Clean up old tokens

## Testing

### 1. Register a Device Token

```bash
curl -X POST http://localhost:4500/push-notification/register-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "device_token": "fGHy7H8j9K0:APA91bF...",
    "device_type": "android",
    "device_info": {
      "model": "Pixel 6",
      "os_version": "13"
    }
  }'
```

### 2. Send Test Notification (Admin)

```bash
curl -X POST http://localhost:4500/push-notification/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification",
    "target_user_types": ["Student", "Teacher"]
  }'
```

### 3. Create Campus Announcement (Triggers Push Notification)

```bash
curl -X POST http://localhost:4500/notification/campus_wide \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "title": "Important Announcement",
    "message": "This announcement will trigger push notifications",
    "meta_data": {
      "priority": "high",
      "category": "announcement"
    }
  }'
```

## How It Works

1. **Device Registration**: Users register their FCM tokens via the mobile/web app
2. **Topic Subscription**: Devices are automatically subscribed to campus-wide topics
3. **Announcement Creation**: When admins create campus-wide notifications, push notifications are automatically sent
4. **Delivery**: Notifications are sent both to individual tokens and campus topics for reliability
5. **Token Management**: Invalid tokens are automatically cleaned up

## Features

- ✅ Campus-wide push notifications for announcements
- ✅ Device token management (register/unregister)
- ✅ Support for Android, iOS, and Web platforms
- ✅ Topic-based messaging for efficient delivery
- ✅ Automatic invalid token cleanup
- ✅ Test notification system for admins
- ✅ Comprehensive error handling
- ✅ Failed delivery tracking

## Security Considerations

1. **Service Account Key**: Keep your Firebase service account key secure
2. **Token Validation**: Device tokens are validated before sending notifications
3. **User Authentication**: All endpoints require valid JWT authentication
4. **Admin-only Actions**: Sensitive operations are restricted to admin users
5. **Rate Limiting**: Consider implementing rate limiting for notification endpoints

## Troubleshooting

### Common Issues

1. **Firebase not initialized**: Check environment variables
2. **Invalid tokens**: Tokens are automatically cleaned up
3. **No notifications received**: Verify device token registration
4. **Permission denied**: Ensure proper Firebase permissions

### Logs

Check application logs for Firebase initialization and notification delivery status:

```
✅ Firebase service initialized for push notifications
⚠️ Firebase initialization failed, continuing without push notification features
```

## Production Deployment

1. Set up proper environment variables
2. Use Firebase App Distribution for testing
3. Monitor notification delivery rates
4. Set up proper error logging
5. Implement notification analytics
6. Consider message queuing for high-volume notifications

## Support

For issues related to:
- Firebase setup: Check [Firebase Documentation](https://firebase.google.com/docs)
- FCM implementation: See [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- Backend integration: Contact the development team