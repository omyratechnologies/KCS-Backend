# Meeting System - Quick Reference Card

**Version:** 2.0  
**Last Updated:** November 3, 2025

---

## 🚀 Quick Start Commands

### Start Meeting Service
```bash
# Development
npm run dev

# Production
pm2 start ecosystem.config.json

# Check status
pm2 status
pm2 logs meeting-service
```

### Health Checks
```bash
# WebRTC health
curl https://api.example.com/api/health/webrtc

# System health
curl https://api.example.com/api/health/system

# Meeting stats
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/meeting/system/stats
```

---

## 📡 Key API Endpoints

### Meeting CRUD
```bash
# Create meeting
POST /api/meeting
Body: { meeting_name, meeting_start_time, meeting_end_time, participants }

# Get meeting
GET /api/meeting/{meeting_id}

# Start meeting
POST /api/meeting/{meeting_id}/start

# End meeting
POST /api/meeting/{meeting_id}/end

# Join meeting
POST /api/meeting/{meeting_id}/join
```

### Participant Management
```bash
# Add participants
POST /api/meeting/{id}/participants
Body: { participants: [{ user_id, email, role }] }

# Remove participants
DELETE /api/meeting/{id}/participants
Body: { participant_ids: [...] }

# Update role
PATCH /api/meeting/{id}/participants/{participant_id}/role
Body: { new_role: "co_host" }
```

---

## 🔌 Socket.IO Events Cheatsheet

### Client → Server

| Event | Payload | Use Case |
|-------|---------|----------|
| `room:join` | `{ meeting_id, display_name }` | Join meeting |
| `room:leave` | `{ meeting_id }` | Leave meeting |
| `media:toggle` | `{ kind: 'audio'/'video', enabled: boolean }` | Toggle mic/cam |
| `screen:start` | `{ meeting_id }` | Start screen share |
| `screen:stop` | `{ meeting_id }` | Stop screen share |
| `chat:send` | `{ meeting_id, message }` | Send chat message |
| `hand:raise` | `{ meeting_id }` | Raise hand |
| `reaction:send` | `{ meeting_id, emoji }` | Send reaction |

### Server → Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `room:joined` | `{ meeting, participants, your_role }` | Successfully joined |
| `participant:joined` | `{ user_id, display_name, role }` | Someone joined |
| `participant:left` | `{ user_id, reason }` | Someone left |
| `chat:message` | `{ user_id, message, timestamp }` | New chat message |
| `muted:by-host` | `{ kind, reason }` | Host muted you |
| `screen:started` | `{ user_id }` | Screen share started |
| `error` | `{ code, message, event }` | Error occurred |

---

## 🎥 WebRTC Flow (Simplified)

### Joining with Audio/Video

```
1. Client connects Socket.IO
   → socket.connect()

2. Client joins room
   → emit('room:join', { meeting_id })
   ← on('room:joined', { meeting, participants })

3. Create send transport
   → emit('transport:create', { direction: 'send' })
   ← on('transport:created', { transport_id, ice_parameters, dtls_parameters })

4. Connect transport
   → emit('transport:connect', { transport_id, dtls_parameters })

5. Get media tracks
   → navigator.mediaDevices.getUserMedia({ audio: true, video: true })

6. Produce media
   → emit('produce', { transport_id, kind: 'audio', rtp_parameters })
   ← on('producer:created', { producer_id })
   → emit('produce', { transport_id, kind: 'video', rtp_parameters })
   ← on('producer:created', { producer_id })

7. Others notified
   ← on('new-producer', { producer_id, user_id, kind })

8. Create receive transport & consume (for each remote producer)
   → emit('transport:create', { direction: 'recv' })
   → emit('consume', { producer_id, rtp_capabilities })
   ← on('consumer:created', { consumer_id, rtp_parameters })
```

---

## 🔍 Debugging Commands

### Check mediasoup Workers
```javascript
// In Node REPL
const workers = WebRTCService.workers;
console.log('Total workers:', workers.length);

for (const worker of workers) {
  const usage = await worker.getResourceUsage();
  console.log(`Worker ${worker.pid}:`, {
    cpu: usage.ru_utime + usage.ru_stime,
    memory_mb: (usage.ru_maxrss / 1024).toFixed(2)
  });
}
```

### Check Active Meetings
```javascript
// Server-side
const activeMeetings = WebRTCService.routers.size;
const activeParticipants = Array.from(WebRTCService.producers.values())
  .length;

console.log({
  active_meetings: activeMeetings,
  active_participants: activeParticipants
});
```

### Browser Console Debugging
```javascript
// Check WebRTC connection state
console.log('Connection state:', peerConnection.connectionState);
console.log('ICE state:', peerConnection.iceConnectionState);
console.log('Signaling state:', peerConnection.signalingState);

// Get statistics
const stats = await peerConnection.getStats();
stats.forEach(report => {
  if (report.type === 'inbound-rtp') {
    console.log('Inbound:', {
      kind: report.kind,
      packets_lost: report.packetsLost,
      jitter: report.jitter,
      bytes_received: report.bytesReceived
    });
  }
});

// Check ICE candidates
stats.forEach(report => {
  if (report.type === 'candidate-pair' && report.state === 'succeeded') {
    console.log('Active candidate pair:', {
      local: stats.get(report.localCandidateId),
      remote: stats.get(report.remoteCandidateId),
      rtt: report.currentRoundTripTime
    });
  }
});
```

---

## ⚠️ Common Issues - Quick Fixes

### "Connection Failed"
```bash
# 1. Check TURN server is running
telnet turn.example.com 3478

# 2. Verify TURN credentials
curl -u username:password turn.example.com:3478

# 3. Check firewall rules
# Allow UDP/TCP ports: 3478, 40000-49999
```

### "No Audio/Video"
```javascript
// Browser console
// Check permissions
navigator.permissions.query({ name: 'microphone' })
  .then(r => console.log('Mic:', r.state));

navigator.permissions.query({ name: 'camera' })
  .then(r => console.log('Cam:', r.state));

// Test getUserMedia
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    console.log('✅ Media OK');
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error('❌ Media failed:', err));
```

### "High CPU on Server"
```bash
# Check worker distribution
pm2 monit

# Check active meetings per worker
# (In Node REPL)
WebRTCService.workers.forEach((worker, i) => {
  console.log(`Worker ${i}:`, worker.observer.listenerCount('router'));
});

# Restart overloaded workers
pm2 restart meeting-service
```

### "Memory Leak"
```bash
# Take heap snapshot
node --inspect index.js
# Then in Chrome: chrome://inspect

# Check for event listener leaks
# (In Node REPL)
process.getMaxListeners() // Should be reasonable (10-20)

# Force garbage collection
node --expose-gc index.js
# Then: global.gc()
```

---

## 📊 Key Metrics Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **RTT** | <100ms | 100-300ms | >300ms |
| **Jitter** | <30ms | 30-50ms | >50ms |
| **Packet Loss** | <1% | 1-3% | >3% |
| **CPU** | <60% | 60-80% | >80% |
| **Memory** | <70% | 70-85% | >85% |
| **Join Success** | >99% | 95-99% | <95% |

---

## 🔐 Security Checklist (Quick)

```bash
# Generate JWT secret (production)
openssl rand -base64 64

# Generate TURN secret
openssl rand -hex 32

# Check TLS certificate expiry
openssl s_client -connect api.example.com:443 -servername api.example.com \
  | openssl x509 -noout -dates

# Test CORS
curl -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization" \
  -X OPTIONS https://api.example.com/api/meeting

# Rate limit test
for i in {1..100}; do
  curl -H "Authorization: Bearer $TOKEN" \
    https://api.example.com/api/meeting &
done
# Should see 429 errors after limit
```

---

## 🚨 Emergency Procedures

### Meeting Service Down
```bash
# 1. Check logs
pm2 logs meeting-service --lines 100

# 2. Restart service
pm2 restart meeting-service

# 3. Check health
curl https://api.example.com/api/health/webrtc

# 4. If still down, check dependencies
systemctl status redis
systemctl status couchbase-server
```

### Database Connection Lost
```bash
# 1. Check database status
couchbase-cli server-info -c localhost -u admin -p password

# 2. Restart database
systemctl restart couchbase-server

# 3. Clear connection pool
# (In Node REPL)
await Meeting.db.close();
await Meeting.db.connect();
```

### Redis Connection Lost
```bash
# 1. Check Redis
redis-cli ping

# 2. Restart Redis
systemctl restart redis

# 3. Clear stale data
redis-cli FLUSHDB # WARNING: Clears all data
```

---

## 📞 Escalation Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| **P0: Service Down** | On-call DevOps | 5 min |
| **P1: Degraded** | DevOps Team | 15 min |
| **P2: Bug** | Dev Team | 1 hour |
| **P3: Feature** | Product Team | Next sprint |

---

## 🔗 Useful Links

- **Architecture Doc**: `/docs/meetings/MEETING_SYSTEM_ARCHITECTURE.md`
- **Implementation Guide**: `/docs/meetings/MEETING_IMPLEMENTATION_GUIDE.md`
- **Troubleshooting**: `/docs/meetings/MEETING_TROUBLESHOOTING_GUIDE.md`
- **API Docs**: `https://api.example.com/docs`
- **Monitoring**: `https://grafana.example.com/meetings`
- **Logs**: `https://kibana.example.com`

---

## 📝 Quick Notes Space

```
# Use this space for environment-specific notes

Production:
- API URL: 
- WebSocket URL: 
- TURN Servers: 

Staging:
- API URL: 
- WebSocket URL: 
- TURN Servers: 

Development:
- API URL: http://localhost:3000
- WebSocket URL: ws://localhost:3000
- TURN Servers: turn:localhost:3478

Recent Issues:
- 

Performance Tuning:
- 

```

---

**Print this page and keep it handy for quick reference!**

---

**Last Updated:** November 3, 2025  
**Version:** 2.0  
**Maintainer:** KCS Development Team
