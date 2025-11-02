# KCS Meeting System - Complete Architecture & Implementation Guide

**Version:** 2.0  
**Last Updated:** November 3, 2025  
**Status:** Production-Ready Architecture

---

## 🎯 Executive Summary

This document defines the complete architecture for the KCS Meeting System - a production-grade, MS Teams-style video conferencing platform built on **WebRTC + mediasoup SFU + Socket.IO signaling**. Designed for scalability, reliability, and exceptional user experience.

### Key Capabilities
- ✅ Real-time video/audio conferencing (up to 10,000 participants)
- ✅ Adaptive bitrate streaming with simulcast
- ✅ Screen sharing with HD quality
- ✅ Live streaming to CDN
- ✅ Real-time chat with reactions
- ✅ Recording and analytics
- ✅ Breakout rooms
- ✅ Sub-500ms latency for meetings
- ✅ Horizontal scalability

---

## 📐 System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │  Desktop App │          │
│  │  (React/Vue) │  │ (React Native)│  │  (Electron)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │ WebSocket        │ WebSocket        │ WebSocket
          │ (Signaling)      │ (Signaling)      │ (Signaling)
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    SIGNALING SERVER LAYER                         │
│              (Node.js + Socket.IO + Express)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  REST API Layer                                           │   │
│  │  • Meeting CRUD                                           │   │
│  │  • Authentication & Authorization                         │   │
│  │  • Recording Management                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Socket.IO Signaling Layer                                │   │
│  │  • Room management                                        │   │
│  │  • Participant presence                                   │   │
│  │  • SDP/ICE exchange                                       │   │
│  │  • Chat & reactions                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ RPC/Internal API
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                      SFU MEDIA LAYER                              │
│                   (mediasoup Workers)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Worker 1 │  │ Worker 2 │  │ Worker 3 │  │ Worker N │        │
│  │          │  │          │  │          │  │          │        │
│  │ Router   │  │ Router   │  │ Router   │  │ Router   │        │
│  │ ├─Transport│ │ ├─Transport│ │ ├─Transport│ │ ├─Transport│   │
│  │ ├─Producer│  │ ├─Producer│  │ ├─Producer│  │ ├─Producer│    │
│  │ └─Consumer│  │ └─Consumer│  │ └─Consumer│  │ └─Consumer│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│  Media Processing:                                                │
│  • Simulcast (multiple quality layers)                           │
│  • SVC (Scalable Video Coding)                                   │
│  • Bandwidth estimation                                          │
│  • Packet loss handling                                          │
└───────────────────────────────────────────────────────────────────┘
          │                              │
          │ WebRTC (SRTP/DTLS)          │ RTMP/WebRTC
          │                              │
     ┌────┴────┐                   ┌─────┴─────┐
     │  TURN   │                   │ Streaming │
     │ Servers │                   │  Bridge   │
     │(coturn) │                   │(RTMP→CDN) │
     └─────────┘                   └───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Database │  │  Redis   │  │  S3/CDN  │  │ Monitoring│       │
│  │(Couchbase│  │ (Presence│  │(Recording│  │(Prometheus│       │
│  │ /MongoDB)│  │  & Cache)│  │   & VOD) │  │ & Grafana)│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Core Components

### 1. Signaling Server (Node.js + Socket.IO)

**Purpose:** Orchestrates meeting lifecycle, authentication, and WebRTC signaling.

**Responsibilities:**
- Meeting creation, scheduling, and management
- User authentication and authorization
- WebSocket connections for real-time signaling
- SDP/ICE candidate exchange
- Participant presence management
- Chat and reactions
- Recording triggers
- Analytics collection

**Technology Stack:**
- **Framework:** Hono.js (high-performance HTTP router)
- **WebSocket:** Socket.IO v4
- **Database:** Couchbase (meeting metadata)
- **Cache:** Redis (presence, session state)
- **Authentication:** JWT tokens

**Scaling Strategy:**
- Horizontal scaling with sticky sessions (Socket.IO + Redis adapter)
- Load balancer: NGINX/HAProxy with WebSocket support
- Stateless design with Redis for shared state

---

### 2. SFU Media Layer (mediasoup)

**Purpose:** Selective Forwarding Unit for routing media streams efficiently.

**Why mediasoup?**
- Native Node.js integration
- Excellent performance (C++ core)
- Simulcast and SVC support
- Fine-grained control over media routing
- Active development and community

**Architecture:**
- Multiple Workers (CPU-bound, one per core)
- Router per meeting room
- Transports for send/receive
- Producers (client → SFU)
- Consumers (SFU → clients)

**Codec Support:**
- **Audio:** Opus (48kHz, stereo)
- **Video:** VP8, VP9, H.264, AV1
- **Screen Share:** VP9 (optimized for text/graphics)

**Quality Adaptation:**
- Simulcast: Multiple quality layers from sender (low/medium/high)
- SVC: Temporal/spatial scalability
- Bandwidth estimation with REMB
- Dynamic layer switching based on network conditions

---

### 3. TURN/STUN Servers

**Purpose:** NAT traversal and fallback for restricted networks.

**STUN Servers:**
- Public: Google STUN servers
- Private: Self-hosted STUN for better control

**TURN Servers:**
- Implementation: coturn
- Authentication: Time-limited credentials
- Deployment: Multiple regions for latency optimization
- Protocol: UDP (preferred), TCP, TLS

**Cost Optimization:**
- TURN is expensive (relays all traffic)
- Use only when direct P2P or STUN fails (~10-15% of cases)
- Monitor TURN usage and optimize ICE candidate gathering

---

### 4. Live Streaming Bridge

**Purpose:** Broadcast meetings to large audiences via CDN.

**Architecture:**
```
SFU → FFmpeg/GStreamer → RTMP → CDN → HLS/DASH → Viewers
```

**Options:**
1. **Low-Latency HLS:** 3-5 second latency
2. **DASH with Chunked CMAF:** 2-4 second latency
3. **WebRTC-to-CDN:** <1 second latency (expensive)

**Implementation:**
- Composite stream from SFU (speaker + screen share)
- Transcode to multiple bitrates
- Push to CDN (Cloudflare Stream, AWS IVS, Mux)

---

### 5. Recording Service

**Purpose:** Record meetings for playback and compliance.

**Recording Modes:**
1. **Local Recording:** Client-side (MediaRecorder API)
2. **Server Recording:** SFU-side (mediasoup-recorder)
3. **Composite Recording:** Mixed layout with all participants

**Storage:**
- S3-compatible storage (AWS S3, Wasabi, MinIO)
- Post-processing: FFmpeg for format conversion
- Retention policies: Auto-delete after N days

**Formats:**
- Video: MP4 (H.264 + AAC)
- Audio-only: M4A/AAC
- Chat log: JSON export

---

## 🔌 WebSocket Events (Socket.IO)

### Namespace: `/meeting`

All meeting-related events use the `/meeting` namespace for isolation.

---

### Client → Server Events

#### Room Management

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | `{ meeting_id, user_id, role }` | Create and initialize meeting room |
| `room:join` | `{ meeting_id, user_id, display_name, role }` | Join meeting room |
| `room:leave` | `{ meeting_id, user_id }` | Leave meeting room |

#### Media Signaling (WebRTC)

| Event | Payload | Description |
|-------|---------|-------------|
| `transport:create` | `{ meeting_id, direction: 'send'/'recv' }` | Request transport creation |
| `transport:connect` | `{ transport_id, dtls_parameters }` | Connect transport with DTLS |
| `produce` | `{ transport_id, kind, rtp_parameters }` | Start producing media (audio/video/screen) |
| `produce:close` | `{ producer_id }` | Stop producing media |
| `consume` | `{ producer_id, rtp_capabilities }` | Start consuming remote media |
| `consumer:resume` | `{ consumer_id }` | Resume paused consumer |
| `consumer:pause` | `{ consumer_id }` | Pause consumer |
| `consumer:close` | `{ consumer_id }` | Close consumer |

#### Media Controls

| Event | Payload | Description |
|-------|---------|-------------|
| `media:toggle` | `{ meeting_id, kind: 'audio'/'video', enabled: boolean }` | Toggle mic/camera |
| `screen:start` | `{ meeting_id }` | Start screen share |
| `screen:stop` | `{ meeting_id }` | Stop screen share |
| `quality:change` | `{ producer_id, layer: 'low'/'medium'/'high' }` | Request quality layer |

#### Participant Controls

| Event | Payload | Description |
|-------|---------|-------------|
| `participant:mute` | `{ meeting_id, target_user_id, kind: 'audio'/'video' }` | Host mutes participant |
| `participant:remove` | `{ meeting_id, target_user_id, reason }` | Remove participant from meeting |
| `participant:role:update` | `{ meeting_id, target_user_id, new_role }` | Update participant role |
| `hand:raise` | `{ meeting_id }` | Raise hand |
| `hand:lower` | `{ meeting_id }` | Lower hand |

#### Chat & Reactions

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:send` | `{ meeting_id, message, reply_to }` | Send in-meeting chat message |
| `chat:typing` | `{ meeting_id, is_typing }` | Typing indicator |
| `reaction:send` | `{ meeting_id, emoji }` | Send emoji reaction |

#### Recording

| Event | Payload | Description |
|-------|---------|-------------|
| `recording:start` | `{ meeting_id, options }` | Start recording |
| `recording:stop` | `{ meeting_id }` | Stop recording |
| `recording:pause` | `{ meeting_id }` | Pause recording |
| `recording:resume` | `{ meeting_id }` | Resume recording |

#### Layout & UI

| Event | Payload | Description |
|-------|---------|-------------|
| `layout:change` | `{ meeting_id, layout: 'grid'/'speaker'/'presentation' }` | Change layout mode |
| `participant:pin` | `{ meeting_id, target_user_id }` | Pin participant |
| `participant:spotlight` | `{ meeting_id, target_user_id }` | Spotlight participant |

#### Telemetry

| Event | Payload | Description |
|-------|---------|-------------|
| `stats:report` | `{ meeting_id, stats: { rtt, jitter, packetLoss, bitrate } }` | Report connection stats |

---

### Server → Client Events

#### Room Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:created` | `{ meeting_id, room_id, config }` | Room successfully created |
| `room:joined` | `{ meeting_id, participants, your_role }` | Successfully joined room |
| `room:closed` | `{ meeting_id, reason }` | Room closed by host or system |
| `room:error` | `{ meeting_id, error, code }` | Room-level error |

#### Participant Events

| Event | Payload | Description |
|-------|---------|-------------|
| `participant:joined` | `{ meeting_id, user_id, display_name, role }` | New participant joined |
| `participant:left` | `{ meeting_id, user_id, reason }` | Participant left |
| `participant:updated` | `{ meeting_id, user_id, updates }` | Participant metadata updated |
| `participant:media:updated` | `{ meeting_id, user_id, kind, enabled }` | Participant toggled media |
| `participant:role:changed` | `{ meeting_id, user_id, old_role, new_role }` | Role changed |

#### Media Signaling Responses

| Event | Payload | Description |
|-------|---------|-------------|
| `transport:created` | `{ transport_id, ice_parameters, ice_candidates, dtls_parameters }` | Transport created |
| `producer:created` | `{ producer_id, kind }` | Producer created successfully |
| `consumer:created` | `{ consumer_id, producer_id, kind, rtp_parameters }` | Consumer created |
| `consumer:closed` | `{ consumer_id, reason }` | Consumer closed |
| `new-producer` | `{ producer_id, user_id, kind }` | New remote producer available |

#### Controls & Notifications

| Event | Payload | Description |
|-------|---------|-------------|
| `muted:by-host` | `{ meeting_id, kind, reason }` | You were muted by host |
| `removed:from-meeting` | `{ meeting_id, reason }` | You were removed from meeting |
| `hand:raised` | `{ meeting_id, user_id }` | Participant raised hand |
| `hand:lowered` | `{ meeting_id, user_id }` | Participant lowered hand |

#### Chat & Reactions

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:message` | `{ meeting_id, user_id, message, timestamp }` | New chat message |
| `chat:typing` | `{ meeting_id, user_id, is_typing }` | User typing status |
| `reaction:received` | `{ meeting_id, user_id, emoji, timestamp }` | Reaction from participant |

#### Recording

| Event | Payload | Description |
|-------|---------|-------------|
| `recording:started` | `{ meeting_id, recording_id }` | Recording started |
| `recording:stopped` | `{ meeting_id, recording_id, duration }` | Recording stopped |
| `recording:status` | `{ meeting_id, status, progress }` | Recording status update |

#### Quality & Performance

| Event | Payload | Description |
|-------|---------|-------------|
| `quality:warning` | `{ meeting_id, issue: 'bandwidth'/'cpu'/'network' }` | Quality degradation warning |
| `stats:update` | `{ meeting_id, aggregated_stats }` | Meeting-wide statistics |

---

## 🎬 Complete User Flows

### Flow 1: Join Meeting (Audio-Only)

**User Action:** Click "Join with Audio"

**Step-by-Step:**
1. **Client:** Request microphone permission
2. **Client:** Connect to Socket.IO `/meeting` namespace
3. **Client → Server:** Emit `room:join` with meeting_id and user credentials
4. **Server:** Validate authentication and authorization
5. **Server:** Check meeting capacity and status
6. **Server → Client:** Emit `room:joined` with room config and participant list
7. **Server → Other Clients:** Emit `participant:joined` notification
8. **Client → Server:** Emit `transport:create` for send transport
9. **Server:** Create mediasoup transport on appropriate worker
10. **Server → Client:** Emit `transport:created` with ICE parameters
11. **Client:** Gather ICE candidates and connect transport
12. **Client → Server:** Emit `transport:connect` with DTLS parameters
13. **Server:** Connect transport in mediasoup
14. **Client:** Create audio track from microphone
15. **Client → Server:** Emit `produce` with audio RTP parameters
16. **Server:** Create producer in mediasoup
17. **Server → Client:** Emit `producer:created` with producer_id
18. **Server → Other Clients:** Emit `new-producer` notification
19. **Other Clients → Server:** Emit `consume` to receive audio
20. **Server:** Create consumers for each client
21. **Server → Other Clients:** Emit `consumer:created` with RTP params
22. **Other Clients:** Receive and play audio stream

**UI State:**
- Show microphone active indicator
- Display participant list
- Show connection quality indicator
- Enable mute/unmute button

---

### Flow 2: Upgrade to Video

**User Action:** Click "Turn on Camera"

**Step-by-Step:**
1. **Client:** Request camera permission
2. **Client:** Create video track from camera
3. **Client → Server:** Emit `produce` with video RTP parameters (simulcast enabled)
4. **Server:** Create video producer in mediasoup with simulcast layers
5. **Server → Client:** Emit `producer:created` with producer_id
6. **Server → Other Clients:** Emit `new-producer` notification
7. **Other Clients → Server:** Emit `consume` for video stream
8. **Server:** Create consumers with appropriate quality layer based on bandwidth
9. **Server → Other Clients:** Emit `consumer:created`
10. **Other Clients:** Receive and render video stream
11. **Server → All:** Emit `participant:media:updated` notification

**UI State:**
- Replace audio-only tile with video tile
- Show own video preview
- Enable camera toggle button
- Show active speaker highlight

---

### Flow 3: Screen Share

**User Action:** Click "Share Screen"

**Step-by-Step:**
1. **Client:** Call `getDisplayMedia()` to get screen track
2. **User:** Select screen/window to share
3. **Client → Server:** Emit `screen:start`
4. **Client → Server:** Emit `produce` with screen track (high bitrate, VP9)
5. **Server:** Create screen share producer with priority flag
6. **Server → Client:** Emit `producer:created`
7. **Server → All Clients:** Emit `screen:started` notification
8. **Server:** Prioritize screen share consumer creation
9. **All Clients:** Request screen share consumer
10. **Server → All Clients:** Emit `consumer:created` for screen
11. **All Clients:** Display screen share (fullscreen or picture-in-picture)
12. **Client:** Optionally keep camera on (small PiP)

**UI State:**
- Large screen share view
- Small camera tiles at bottom/side
- "You are sharing your screen" indicator
- "Stop sharing" button

**Stop Screen Share:**
1. **User:** Clicks "Stop Sharing"
2. **Client → Server:** Emit `screen:stop`
3. **Server:** Close screen producer
4. **Server → All Clients:** Emit `screen:stopped`
5. **All Clients:** Remove screen share view, return to grid/speaker layout

---

### Flow 4: Add Participant (No Approval - MS Teams Style)

**User Action:** Host clicks "Add Participant" → Selects user(s) → Clicks "Add"

**Step-by-Step:**
1. **Host Client → Server:** Emit `participant:add` with user_ids or emails
2. **Server:** Validate host permissions
3. **Server:** Add participants to meeting database
4. **Server → New Participants:** Send push notification / email invitation
5. **Server → Existing Participants:** Emit `participant:added` notification
6. **New Participants:** Receive invitation link
7. **New Participants:** Click link and join immediately (no approval required)
8. **Server → All:** Emit `participant:joined` when they connect

**No Approval Required:**
- This is a product decision: trust the host's invite
- Security: Ensure meeting links include time-limited tokens
- Alternative: Enable "require_host_approval" flag for waiting room behavior

---

### Flow 5: Host Mutes Participant

**User Action:** Host clicks participant → "Mute"

**Step-by-Step:**
1. **Host Client → Server:** Emit `participant:mute` with target_user_id
2. **Server:** Validate host/co-host permissions
3. **Server → Target Participant:** Emit `muted:by-host` with reason
4. **Target Participant Client:** Disable audio producer
5. **Target Participant → Server:** Emit `produce:close` for audio
6. **Server:** Close audio producer
7. **Server → All Clients:** Emit `participant:media:updated` (audio: false)
8. **All Clients:** Update UI to show participant is muted

**UI Considerations:**
- Show notification to muted participant: "Host muted you"
- Optionally allow participant to unmute if "allow_unmute_self" is enabled
- Show muted icon on participant tile for everyone

---

### Flow 6: Live Streaming to Large Audience

**User Action:** Host clicks "Start Live Stream"

**Step-by-Step:**
1. **Host Client → Server:** Emit `stream:start` with streaming config
2. **Server:** Validate permissions and streaming plan
3. **Server:** Start streaming bridge (FFmpeg/GStreamer process)
4. **Streaming Bridge:** Connect to SFU and consume all active producers
5. **Streaming Bridge:** Composite video (speaker + screen share layout)
6. **Streaming Bridge:** Encode to multiple bitrates (adaptive streaming)
7. **Streaming Bridge → RTMP Server:** Push RTMP stream
8. **RTMP Server → CDN:** Distribute HLS/DASH streams
9. **Server → All Participants:** Emit `stream:started` with CDN URL
10. **Server → Viewers (large audience):** Provide HLS/DASH player
11. **Viewers:** Watch via CDN with 3-5 second latency

**Viewer Experience:**
- Low latency: 3-5 seconds (HLS), 2-4 seconds (DASH)
- Ultra-low latency: WebRTC-to-CDN (<1 second, premium)
- No interaction: view-only mode
- Optional: Allow chat for viewers via separate WebSocket

**Stop Streaming:**
1. **Host:** Clicks "Stop Stream"
2. **Server:** Terminate streaming bridge
3. **Server → All:** Emit `stream:stopped`
4. **CDN:** Playlist marked as ended

---

## 🔒 Security & Privacy

### Authentication & Authorization

**JWT Token Strategy:**
- **Access Token:** Short-lived (15 min), used for API calls
- **Refresh Token:** Long-lived (7 days), used to get new access tokens
- **Meeting Token:** Time-limited (meeting duration + 1 hour), embedded in meeting link

**Token Validation:**
```typescript
// Middleware for Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user_id = decoded.user_id;
    socket.data.role = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

**Role-Based Access Control (RBAC):**

| Role | Permissions |
|------|-------------|
| **Host** | Full control: create, end, remove participants, mute others, record, manage settings |
| **Co-Host** | Most host permissions except ending meeting |
| **Presenter** | Share screen, unmute self, chat |
| **Attendee** | Join, view, chat, mute/unmute self (if allowed) |
| **Guest** | Limited: view-only, no chat (optional) |

---

### Encryption

**Signaling Encryption:**
- TLS 1.3 for all HTTPS/WSS connections
- Certificate pinning for mobile apps (optional)

**Media Encryption:**
- DTLS for key exchange
- SRTP for media encryption (AES-128 GCM)
- Forward secrecy with ephemeral keys

**End-to-End Encryption (E2EE):**
- Complex with SFU (server needs to decrypt for routing)
- Alternative: Insertable Streams API for E2EE
- Best for small groups (<10 participants)

---

### Privacy Considerations

**Permissions:**
- Explicit microphone/camera permission requests
- Show active indicators (recording light, screen share banner)
- "Meeting is being recorded" notification

**Data Retention:**
- Meeting metadata: Configurable (default: 1 year)
- Recordings: Configurable (default: 30 days, then auto-delete)
- Chat logs: Same as meeting metadata
- Analytics: Anonymized after 90 days

**Compliance:**
- GDPR: Right to deletion, data export, consent management
- CCPA: Opt-out of data collection
- HIPAA: Encryption at rest and in transit, audit logs
- COPPA: Parental consent for minors

---

## 🚀 Scaling & Performance

### Horizontal Scaling Strategy

**Signaling Servers:**
- Stateless design: all state in Redis
- Load balancer with sticky sessions (Socket.IO)
- Redis adapter for Socket.IO clustering

**Configuration:**
```typescript
// Socket.IO with Redis adapter
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

**SFU Workers:**
- Distribute meetings across workers (round-robin or least-loaded)
- Room affinity: Keep all participants of a meeting on same worker
- Worker orchestration: Kubernetes StatefulSet or plain VMs
- Health checks: Monitor worker CPU/memory/network

**Worker Distribution Algorithm:**
```typescript
function selectWorker(meeting_id: string): Worker {
  // Hash-based consistent distribution
  const hash = crypto.createHash('sha256').update(meeting_id).digest('hex');
  const index = parseInt(hash.slice(0, 8), 16) % workers.length;
  return workers[index];
}
```

---

### Performance Optimization

**Bandwidth Optimization:**
- Simulcast: Client sends 3 layers (180p, 360p, 720p)
- Server selects layer based on receiver's bandwidth
- Automatic layer switching with hysteresis

**CPU Optimization:**
- Offload codec processing to hardware (Quick Sync, NVENC)
- Limit max participants per worker based on benchmarks
- Dynamic quality reduction under high CPU load

**Network Optimization:**
- Regional deployment: Place SFU close to users (multi-region)
- Edge caching for static assets
- TURN servers in multiple regions

**Latency Targets:**
- Intra-region: <100ms end-to-end
- Inter-region: <300ms end-to-end
- Target: Sub-500ms perceived latency

---

### Capacity Planning

**Single SFU Worker Capacity (8-core, 16GB RAM):**
- Small meetings (2-5 participants): 50-100 concurrent meetings
- Medium meetings (10-20 participants): 20-30 concurrent meetings
- Large meetings (50-100 participants): 5-10 concurrent meetings
- Very large meetings (>100 participants): 1-2 with dedicated worker

**Bandwidth Requirements:**
- Upstream (per participant): 1-3 Mbps (video + audio + screen)
- Downstream (per participant): N * (0.5-2 Mbps) where N = active speakers
- Server egress: Sum of all downstream bandwidth

**Cost Estimation (AWS):**
- Signaling server: c6i.2xlarge ($0.34/hr) × 3 = $245/month
- SFU workers: c6i.4xlarge ($0.68/hr) × 10 = $2,040/month
- TURN servers: t3.large ($0.0832/hr) × 5 = $299/month
- Total infrastructure: ~$2,600/month for 500 concurrent participants

---

## 📊 Monitoring & Observability

### Key Metrics

**Meeting Metrics:**
- Active meetings (gauge)
- Total participants (gauge)
- Meetings created/ended (counter)
- Average meeting duration (histogram)
- Participant join/leave rate (counter)

**Quality Metrics:**
- RTT (Round Trip Time) - target: <100ms
- Jitter - target: <30ms
- Packet loss - target: <1%
- Bitrate (actual vs allocated)
- Connection success rate - target: >99%

**Infrastructure Metrics:**
- CPU utilization per worker - target: <80%
- Memory utilization - target: <85%
- Network egress/ingress
- WebSocket connections (gauge)
- mediasoup router/transport/producer/consumer counts

**Business Metrics:**
- Total meeting minutes
- Unique users per day/week/month
- Meeting completion rate
- Recording storage usage
- TURN relay usage (cost indicator)

---

### Alerting Rules

**Critical Alerts (PagerDuty):**
- SFU worker crash or unresponsive
- Signaling server down
- Database unavailable
- TURN server failure
- Connection success rate <95%
- CPU >90% for >5 minutes

**Warning Alerts (Slack):**
- CPU >80% for >5 minutes
- Memory >85%
- Packet loss >2%
- RTT >200ms
- Disk space <20%

---

### Logging Strategy

**Structured Logging:**
```typescript
logger.info({
  event: 'participant_joined',
  meeting_id: 'room_abc123',
  user_id: 'user_xyz789',
  timestamp: new Date().toISOString(),
  metadata: {
    connection_type: 'direct',
    ice_state: 'connected',
    video_enabled: true,
    audio_enabled: true
  }
});
```

**Log Levels:**
- **ERROR:** Failures requiring investigation
- **WARN:** Degraded performance, retries
- **INFO:** Important events (join, leave, produce)
- **DEBUG:** Detailed flow (enabled per meeting for troubleshooting)

**Log Aggregation:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Or: Loki + Grafana (lighter weight)
- Retention: 30 days hot, 90 days cold

---

## 🎨 UI/UX Best Practices

### Pre-Join Lobby

**Purpose:** Let users test and configure before joining.

**Features:**
- Camera/microphone preview
- Device selection (multiple cameras/mics)
- Audio/video toggle
- Display name input
- "Join muted" checkbox
- Network quality check
- Browser compatibility warning

---

### Meeting Layouts

**1. Grid Layout (Default):**
- Equal-sized tiles for all participants
- Pagination for >25 participants
- Active speaker auto-highlight

**2. Speaker Layout:**
- Large view of active speaker
- Small thumbnails of others at bottom
- Auto-switch based on audio level

**3. Presentation Layout:**
- Screen share takes majority of screen
- Small participant tiles on side
- Focus on content

**4. Custom Layouts:**
- Pin specific participants
- Spotlight mode (everyone sees the same view)
- Picture-in-Picture for screen share

---

### Accessibility

**Keyboard Navigation:**
- Tab through controls
- Spacebar: Mute/unmute
- Ctrl+D: Toggle camera
- Ctrl+E: Leave meeting

**Screen Reader Support:**
- ARIA labels for all controls
- Announce participant join/leave
- Announce chat messages

**Captions/Transcription:**
- Live captions via speech-to-text API
- Language selection
- Caption display at bottom

**High Contrast Mode:**
- Ensure 4.5:1 contrast ratio
- Large, clear buttons
- Visual indicators for status

---

## 🐛 Common Pitfalls & Solutions

### Pitfall 1: Bandwidth Explosion (Mesh Topology)

**Problem:** Each participant sends to every other participant (N×(N-1) connections).

**Solution:** Use SFU (mediasoup). Each participant sends once to SFU, SFU forwards to others.

**Result:** O(N) complexity instead of O(N²).

---

### Pitfall 2: TURN Cost Overrun

**Problem:** TURN relays all traffic, leading to high bandwidth costs.

**Solution:**
- Optimize ICE candidate gathering (prefer direct/STUN)
- Use TURN only as fallback
- Monitor TURN usage per meeting
- Consider managed TURN with usage-based pricing

---

### Pitfall 3: Single Worker Bottleneck

**Problem:** All meetings on one worker → CPU overload.

**Solution:**
- Distribute meetings across multiple workers
- Monitor per-worker load
- Auto-scale workers based on demand

---

### Pitfall 4: Signaling Race Conditions

**Problem:** Transport connect before create completes.

**Solution:**
- Use ACKs for critical events
- Implement state machine on client
- Sequence: create transport → wait for ack → connect transport

---

### Pitfall 5: Mobile Battery Drain

**Problem:** Continuous video encoding drains battery.

**Solution:**
- Lower frame rate on mobile (15-20 FPS)
- Reduce resolution (360p default)
- Pause video when app in background
- Show battery warning when <20%

---

### Pitfall 6: Screen Share Quality

**Problem:** Text is blurry, laggy updates.

**Solution:**
- Use VP9 codec (better for screen content)
- Higher bitrate for screen share (2-4 Mbps)
- Content hint: `track.contentHint = 'detail'`

---

## 📋 Implementation Checklist

### Phase 1: Foundation (2-3 weeks)
- [ ] Set up Node.js + Socket.IO signaling server
- [ ] Implement JWT authentication
- [ ] Create meeting CRUD API
- [ ] Database schema (Couchbase/MongoDB)
- [ ] Redis for presence and cache
- [ ] Basic participant management

### Phase 2: WebRTC Core (3-4 weeks)
- [ ] Initialize mediasoup workers
- [ ] Implement transport creation flow
- [ ] Producer/consumer management
- [ ] Audio-only meetings (simple test)
- [ ] Video conferencing (2-3 participants)
- [ ] ICE candidate handling
- [ ] STUN server configuration

### Phase 3: Scaling & Quality (2-3 weeks)
- [ ] Simulcast implementation
- [ ] SVC support
- [ ] Bandwidth estimation
- [ ] Quality layer switching
- [ ] Load balancing across workers
- [ ] TURN server setup and fallback

### Phase 4: Features (3-4 weeks)
- [ ] Screen sharing
- [ ] In-meeting chat
- [ ] Reactions and hand raise
- [ ] Host controls (mute, remove)
- [ ] Participant roles and permissions
- [ ] Recording (local and server-side)
- [ ] Layout modes (grid, speaker, presentation)

### Phase 5: Polish & Production (2-3 weeks)
- [ ] Pre-join lobby with device testing
- [ ] Network quality indicators
- [ ] Reconnection logic
- [ ] Error handling and user messaging
- [ ] Analytics and telemetry
- [ ] Admin dashboard
- [ ] Performance optimization

### Phase 6: Advanced Features (3-4 weeks)
- [ ] Breakout rooms
- [ ] Live streaming to CDN
- [ ] Waiting room
- [ ] Whiteboard collaboration
- [ ] Background blur/virtual backgrounds
- [ ] E2EE (optional)

### Phase 7: Production Readiness (2-3 weeks)
- [ ] Load testing (100+ participants)
- [ ] Security audit
- [ ] Compliance checks (GDPR, HIPAA, etc.)
- [ ] Monitoring and alerting setup
- [ ] Documentation and API docs
- [ ] Deploy to production

**Total Estimated Time:** 17-24 weeks (4-6 months)

---

## 🔗 Additional Resources

### Documentation
- [mediasoup Documentation](https://mediasoup.org/documentation/v3/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### Community
- [mediasoup Discourse](https://mediasoup.discourse.group/)
- [WebRTC Community](https://webrtc.org/community/)

### Tools
- [WebRTC Troubleshooter](https://test.webrtc.org/)
- [mediasoup-demo](https://github.com/versatica/mediasoup-demo)

---

## 📝 Conclusion

This architecture provides a production-ready foundation for building a scalable, MS Teams-style meeting system. The design emphasizes:

1. **Scalability:** Horizontal scaling for millions of users
2. **Reliability:** Graceful degradation, reconnection logic
3. **Performance:** Sub-500ms latency, adaptive quality
4. **Security:** End-to-end encryption, RBAC, compliance
5. **User Experience:** Seamless flows, accessibility

Adjust based on your specific needs, budget, and user base. Start with Phase 1-3 for MVP, then iterate based on user feedback.

---

**Last Updated:** November 3, 2025  
**Version:** 2.0  
**Maintainer:** KCS Development Team
