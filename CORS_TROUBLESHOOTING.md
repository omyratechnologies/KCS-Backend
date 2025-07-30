# 🔧 CORS & WebSocket Troubleshooting Guide

## Problem: Frontend can't connect to backend after adding WebSockets and WebRTC

### Root Cause
The error "Access-Control-Allow-Origin cannot contain more than one origin" occurs when multiple layers in your stack are adding CORS headers, causing duplicate headers that browsers reject.

## ✅ Solutions Applied

### 1. Fixed Duplicate CORS Headers
- **Issue**: Both Nginx and Hono were adding CORS headers
- **Solution**: Removed CORS headers from Nginx, let Hono handle CORS exclusively

### 2. Improved CORS Configuration
```typescript
// Old (problematic)
cors({ origin: "*" })

// New (secure & specific)
cors({
  origin: (origin) => {
    const allowedOrigins = [
      "http://localhost:3000",    // React dev server
      "http://localhost:5173",    // Vite dev server
      "http://localhost:3001",    // Alternative port
      "https://dev.letscatchup-kcs.com",
      "https://letscatchup-kcs.com"
    ];
    
    if (!origin) return origin; // Allow no-origin requests
    return allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") 
      ? origin : null;
  },
  credentials: true
})
```

### 3. Socket.IO CORS Alignment
- Updated Socket.IO CORS to match main app CORS policy
- Added proper error handling for rejected origins

### 4. Fixed Import Error
- Fixed typo in `meeting.service.ts` import statement

## 🚀 How to Test the Fix

### 1. Run the troubleshooting script:
```bash
./troubleshoot-cors.sh
```

### 2. Manual Testing:

#### Start the backend:
```bash
bun run dev
```

#### Test CORS from browser console:
```javascript
// Test API endpoint
fetch('http://localhost:4500/api/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log('✅ API working:', data))
.catch(error => console.error('❌ API error:', error));

// Test Socket.IO connection
const socket = io('http://localhost:4501', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket.IO error:', error);
});
```

## 🔍 Common Issues & Solutions

### Issue 1: Still getting CORS errors
**Symptoms**: `Access-Control-Allow-Origin` errors in browser console

**Solutions**:
1. Clear browser cache and restart browser
2. Check if your frontend URL is in the allowed origins list
3. Ensure no browser extensions are interfering
4. Try incognito/private browsing mode

### Issue 2: Socket.IO connection fails
**Symptoms**: Socket connection timeout or authentication errors

**Solutions**:
1. Verify Socket.IO server is running on port 4501
2. Check firewall settings (allow port 4501)
3. Ensure JWT token is valid and being sent correctly
4. Check browser network tab for WebSocket upgrade requests

### Issue 3: WebRTC features not working
**Symptoms**: Video/audio not working in meetings

**Solutions**:
1. Check browser permissions for camera/microphone
2. Verify HTTPS is used (WebRTC requires secure context)
3. Check if STUN/TURN servers are accessible
4. Enable `WEBRTC_ENABLE_MEDIASOUP=true` in .env for advanced features

### Issue 4: Nginx 502 Bad Gateway
**Symptoms**: 502 errors when accessing through nginx

**Solutions**:
1. Ensure backend is running before starting nginx
2. Check nginx logs: `docker logs nginx-container`
3. Verify backend containers are healthy
4. Check if ports 4500 and 4501 are accessible from nginx container

## 📝 Configuration Files Updated

### 1. `src/app/index.ts`
- Updated CORS configuration with specific allowed origins
- Added credentials support
- Improved header handling

### 2. `src/services/socket.service.ts` 
- Aligned Socket.IO CORS with main app CORS
- Added origin validation callback
- Improved error handling

### 3. `nginx.conf`
- Removed duplicate CORS headers
- Let application handle CORS exclusively
- Maintained proxy settings for WebSocket upgrades

### 4. `src/services/meeting.service.ts`
- Fixed import typo
- Ensured all error monitoring imports work correctly

## 🌐 Frontend Integration

### React/Next.js Example:
```typescript
// API calls
const apiClient = axios.create({
  baseURL: 'http://localhost:4500/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Socket.IO connection
const socket = io('http://localhost:4501', {
  withCredentials: true,
  auth: {
    token: localStorage.getItem('jwt_token'),
  },
});
```

### Vue/Vite Example:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4500',
        changeOrigin: true,
        credentials: 'include',
      },
      '/socket.io': {
        target: 'http://localhost:4501',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
```

## 🔐 Security Notes

1. **Origin Validation**: Only specific origins are allowed, not wildcards
2. **Credentials**: CORS is configured to allow credentials (cookies, auth headers)
3. **JWT Authentication**: Socket.IO connections require valid JWT tokens
4. **Rate Limiting**: Nginx includes rate limiting for API and WebSocket endpoints

## 📊 Monitoring

The backend now includes enhanced error monitoring:
- Meeting operation errors are logged with context
- CORS rejection attempts are tracked
- WebRTC connection issues are monitored
- Socket.IO connection metrics are available

## 🆘 Still Having Issues?

1. **Check logs**: Look at browser console, backend logs, and nginx logs
2. **Run the troubleshoot script**: `./troubleshoot-cors.sh`
3. **Test with curl**: Use the curl commands in the troubleshoot script
4. **Check network tab**: Look for failed preflight requests or WebSocket upgrades
5. **Verify environment**: Ensure .env file is properly configured

## 📞 Quick Test Commands

```bash
# Test basic API
curl -H "Origin: http://localhost:3000" http://localhost:4500/api/health

# Test CORS preflight
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Authorization,Content-Type" \
     -X OPTIONS \
     http://localhost:4500/api/auth/login

# Check if Socket.IO server is running
curl http://localhost:4501/socket.io/

# Test WebSocket upgrade
curl -i -N \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:4501/socket.io/
```

---

**Note**: After making these changes, restart your backend services and clear your browser cache for the changes to take effect.
