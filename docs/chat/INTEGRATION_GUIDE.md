# 🔌 Integration Guide - Enhanced Chat Features

## Quick Integration Steps

### 1. Import and Register Enhanced Routes

In your main application file (e.g., `src/index.ts` or `src/app.ts`):

```typescript
// Import the enhanced chat router
import enhancedChatRouter from "./routes/enhanced_chat.route";

// Register the routes (add this with your other route registrations)
app.route("/api/v1/chat", enhancedChatRouter);
```

**Note:** The enhanced routes are mounted under `/api/v1/chat` to keep them organized with existing chat routes.

---

### 2. Socket Events (Already Integrated)

The socket events are **automatically registered** when users connect. No additional integration needed!

The enhanced events are registered in `src/services/socket.service.ts`:

```typescript
// This code is already added for you:
EnhancedSocketEvents.registerEnhancedEvents(socket);
EnhancedSocketEvents.registerPresenceEvents(socket);
```

---

### 3. Test the Integration

#### Test Media Upload:
```bash
curl -X POST http://localhost:4501/api/v1/chat/media/upload-url \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }'
```

#### Test Device Registration:
```bash
curl -X POST http://localhost:4501/api/v1/chat/devices/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device_123",
    "device_name": "iPhone 14",
    "device_type": "mobile",
    "platform": "iOS",
    "app_version": "1.0.0"
  }'
```

#### Test Message Forwarding:
```bash
curl -X POST http://localhost:4501/api/v1/chat/messages/MSG_ID/forward \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_room_ids": ["room_1", "room_2"]
  }'
```

---

### 4. Frontend Socket Integration

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4501', {
  auth: { token: yourAuthToken }
});

// Media upload request
socket.emit('media:upload:request', {
  fileName: 'photo.jpg',
  fileType: 'image/jpeg',
  fileSize: 2048000,
  messageType: 'image'
});

socket.on('media:upload:url', (result) => {
  if (result.success) {
    const { uploadUrl, fileKey } = result.data;
    // Upload file to R2 using uploadUrl
    // Then confirm with media:upload:complete
  }
});

// Device sync
socket.emit('chats:sync', { device_id: 'my_device_123' });

socket.on('chats:synced', (result) => {
  if (result.success) {
    const { rooms, last_sync_timestamp } = result.data;
    // Update local chat list
  }
});

// Forward message
socket.emit('message:forward', {
  message_id: 'msg_123',
  target_room_ids: ['room_1', 'room_2']
});

socket.on('message:forwarded', (result) => {
  console.log(`Forwarded to ${result.data.forwarded_count} rooms`);
});
```

---

### 5. Environment Variables

Ensure these Cloudflare R2 variables are set in your `.env`:

```bash
# Cloudflare R2 Configuration (already present)
R2_BUCKET=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_URL=https://your-custom-domain.com/
```

---

### 6. Database Sync

The new `UserDevice` model will be automatically created by Ottoman. If using manual migrations:

```typescript
// No migration needed - Ottoman auto-creates on first use
// Just make sure to import the model somewhere in your app:
import { UserDevice } from "./models/user_device.model";
```

---

## 🎯 Complete Integration Example

Here's a complete example for your main app file:

```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer } from 'http';

// Import routes
import chatRouter from './routes/chat.route';
import enhancedChatRouter from './routes/enhanced_chat.route';

// Import socket service
import { SocketService } from './services/socket.service';

const app = new Hono();

// Register routes
app.route('/api/v1/chat', chatRouter);
app.route('/api/v1/chat', enhancedChatRouter);  // 👈 Add this line

// Create HTTP server
const server = createServer(serve({ fetch: app.fetch, port: 4501 }));

// Initialize Socket.IO (this automatically registers enhanced events)
SocketService.initialize(server);

// Start server
server.listen(4501, () => {
  console.log('🚀 Server running on port 4501');
  console.log('✅ Enhanced chat features active');
});
```

---

## 📋 Verification Checklist

After integration, verify these work:

- [ ] Media upload URL generation: `POST /api/v1/chat/media/upload-url`
- [ ] Device registration: `POST /api/v1/chat/devices/register`
- [ ] Chat sync: `POST /api/v1/chat/sync/chats`
- [ ] Message forwarding: `POST /api/v1/chat/messages/:id/forward`
- [ ] Star message: `POST /api/v1/chat/messages/:id/star`
- [ ] Socket event: `media:upload:request` → `media:upload:url`
- [ ] Socket event: `chats:sync` → `chats:synced`
- [ ] Socket event: `message:forward` → `message:forwarded`

---

## 🐛 Troubleshooting

### Routes not found (404)
- Make sure you registered the route: `app.route('/api/v1/chat', enhancedChatRouter)`
- Check the route is imported correctly
- Restart your server

### Socket events not working
- Verify socket connection is authenticated
- Check browser console for socket errors
- Ensure `EnhancedSocketEvents.registerEnhancedEvents(socket)` is called in socket.service.ts

### Media upload fails
- Verify R2 environment variables are set
- Check R2 bucket permissions
- Ensure CORS is configured on R2 bucket

### Device registration fails
- Verify all required fields are sent (device_id, device_name, etc.)
- Check authentication token is valid
- Ensure user has a valid campus_id

---

## 📚 Next Steps

1. ✅ Integrate routes (see step 1)
2. ✅ Test API endpoints (see step 3)
3. ✅ Integrate socket events in frontend (see step 4)
4. ✅ Test end-to-end flows
5. 🚀 Deploy to production

---

## 💡 Tips

- **Use Postman/Insomnia** to test REST endpoints before frontend integration
- **Use socket.io-client test script** to test socket events
- **Monitor logs** for any errors during integration
- **Check network tab** in browser DevTools for API calls
- **Test with multiple devices** to verify multi-device sync

---

**Need Help?** Check the full documentation in `docs/chat/IMPLEMENTATION_SUMMARY.md`
