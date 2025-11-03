# KCS Meeting System - Documentation Index

**Version:** 2.0  
**Last Updated:** November 3, 2025  
**Status:** Complete & Production-Ready

---

## 📚 Documentation Overview

This directory contains comprehensive documentation for the KCS Meeting System - a production-grade MS Teams-style video conferencing platform.

### 📖 Core Documentation

1. **[MEETING_SYSTEM_ARCHITECTURE.md](./MEETING_SYSTEM_ARCHITECTURE.md)**
   - Complete system architecture and design
   - WebRTC + mediasoup SFU architecture
   - Signaling with Socket.IO
   - Component breakdown and diagrams
   - Complete event catalog
   - User flows and UX patterns
   - Scaling strategies
   - Security and compliance
   - Implementation roadmap

2. **[MEETING_IMPLEMENTATION_GUIDE.md](./MEETING_IMPLEMENTATION_GUIDE.md)**
   - Clean code best practices
   - Service layer patterns
   - WebSocket event handling
   - WebRTC service optimization
   - Error handling strategies
   - Performance patterns
   - Testing strategies
   - Security patterns

3. **[MEETING_TROUBLESHOOTING_GUIDE.md](./MEETING_TROUBLESHOOTING_GUIDE.md)**
   - Common issues and solutions
   - Performance troubleshooting
   - Network issues
   - WebRTC debugging
   - mediasoup issues
   - Monitoring and alerting
   - Optimization checklists

---

## 🎯 Quick Start Guide

### For Backend Developers

1. Start with **MEETING_SYSTEM_ARCHITECTURE.md** to understand the overall system
2. Review **MEETING_IMPLEMENTATION_GUIDE.md** for coding standards
3. Reference **MEETING_TROUBLESHOOTING_GUIDE.md** when debugging

### For Frontend Developers

1. Read the "Complete User Flows" section in **MEETING_SYSTEM_ARCHITECTURE.md**
2. Study the "WebSocket Events" section for client-server communication
3. Check the "UI/UX Best Practices" section for implementation guidance

### For DevOps/SRE

1. Review the "Scaling & Performance" section in **MEETING_SYSTEM_ARCHITECTURE.md**
2. Study the "Monitoring & Observability" section for metrics and alerts
3. Reference **MEETING_TROUBLESHOOTING_GUIDE.md** for operational issues

---

## 🏗️ System Architecture Summary

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│           (Web, Mobile, Desktop Applications)               │
└───────────────────┬─────────────────────────────────────────┘
                    │ WebSocket (Signaling) + WebRTC (Media)
┌───────────────────┴─────────────────────────────────────────┐
│              SIGNALING SERVER LAYER                          │
│         (Node.js + Socket.IO + Hono.js)                     │
│  • REST API for meeting CRUD                                │
│  • Socket.IO for real-time signaling                        │
│  • Authentication & authorization                           │
└───────────────────┬─────────────────────────────────────────┘
                    │ Internal API
┌───────────────────┴─────────────────────────────────────────┐
│                SFU MEDIA LAYER                               │
│             (mediasoup Workers)                              │
│  • Selective Forwarding Unit                                │
│  • Adaptive bitrate streaming                               │
│  • Simulcast & SVC support                                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

✅ **Real-Time Video Conferencing**
- Up to 10,000 participants per meeting
- HD video quality with adaptive bitrate
- Crystal-clear audio with noise suppression

✅ **Advanced Media Handling**
- Screen sharing with HD quality
- Simulcast (multiple quality layers)
- Automatic quality adjustment

✅ **Collaboration Tools**
- In-meeting chat with reactions
- Hand raise and participant controls
- Breakout rooms (planned)

✅ **Recording & Analytics**
- Cloud recording with MP4 export
- Real-time analytics and telemetry
- Meeting history and playback

✅ **Enterprise Features**
- Role-based access control (Host, Co-Host, Presenter, Attendee)
- Waiting room support
- Live streaming to CDN
- End-to-end encryption (optional)

---

## 🔌 WebSocket Event Summary

### Core Events (Must Implement)

**Room Management:**
- `room:join` / `room:joined` - Join meeting room
- `room:leave` / `room:left` - Leave meeting
- `participant:joined` / `participant:left` - Participant presence

**Media Control:**
- `media:toggle` - Toggle mic/camera
- `screen:start` / `screen:stop` - Screen sharing
- `producer:created` / `consumer:created` - WebRTC media

**Participant Management:**
- `participant:add` - Add user to meeting
- `participant:remove` - Remove user from meeting
- `participant:mute` - Host mutes participant

**Chat & Reactions:**
- `chat:send` / `chat:message` - In-meeting chat
- `reaction:send` - Emoji reactions

See **MEETING_SYSTEM_ARCHITECTURE.md** for complete event catalog.

---

## ⚡ Performance Targets

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| **Latency** | <100ms | <300ms | >500ms |
| **Jitter** | <30ms | <50ms | >100ms |
| **Packet Loss** | <1% | <3% | >5% |
| **CPU Usage** | <60% | <80% | >90% |
| **Memory** | <70% | <85% | >95% |
| **Join Success Rate** | >99% | >95% | <95% |

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)
- Basic meeting CRUD API
- Authentication & authorization
- Database schema
- Redis integration

### Phase 2: WebRTC Core (3-4 weeks)
- mediasoup worker initialization
- Transport creation & management
- Audio/video producers & consumers
- Basic video conferencing (2-3 participants)

### Phase 3: Scaling & Quality (2-3 weeks)
- Simulcast implementation
- Adaptive bitrate control
- Load balancing across workers
- TURN server setup

### Phase 4: Features (3-4 weeks)
- Screen sharing
- In-meeting chat
- Participant controls
- Recording support

### Phase 5: Production Ready (2-3 weeks)
- Monitoring & alerting
- Error handling & recovery
- Performance optimization
- Security hardening

**Total Estimate: 4-6 months**

---

## 🔒 Security Checklist

- [ ] JWT authentication with refresh tokens
- [ ] HTTPS/WSS for all connections
- [ ] DTLS/SRTP for media encryption
- [ ] Input validation with Zod
- [ ] Rate limiting on all endpoints
- [ ] RBAC for meeting permissions
- [ ] CORS configuration
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Audit logging for sensitive actions

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

**Business Metrics:**
- Total meeting minutes
- Active meetings (gauge)
- Unique users per day/week/month
- Meeting completion rate

**Technical Metrics:**
- RTT (Round Trip Time)
- Packet loss percentage
- Bitrate (actual vs allocated)
- CPU & memory per worker
- Connection success rate

**Cost Metrics:**
- TURN relay usage
- Recording storage size
- CDN bandwidth usage
- Infrastructure costs

See **MEETING_SYSTEM_ARCHITECTURE.md** for complete monitoring strategy.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend Framework** | Node.js + Hono.js | High-performance HTTP server |
| **WebSocket** | Socket.IO v4 | Real-time signaling |
| **SFU** | mediasoup v3 | Media routing |
| **Database** | Couchbase / MongoDB | Meeting metadata |
| **Cache** | Redis | Presence & session state |
| **TURN/STUN** | coturn | NAT traversal |
| **Monitoring** | Prometheus + Grafana | Metrics & dashboards |
| **Logging** | ELK / Loki | Log aggregation |

---

## 📞 Support & Resources

### Internal Resources
- Slack: `#kcs-meetings-dev`
- Wiki: [Meeting System Wiki](https://wiki.internal/meetings)
- Issue Tracker: [JIRA KCS-MEET](https://jira.internal/projects/KCS-MEET)

### External Resources
- [mediasoup Documentation](https://mediasoup.org/documentation/v3/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

## 📝 Contributing

When updating meeting system documentation:

1. Update version number at the top of each document
2. Add entry to changelog
3. Run documentation linter
4. Get review from at least one other developer
5. Update this index if adding new documents

---

## 🎯 What's Next?

### Planned Features (Q1 2026)
- [ ] Breakout rooms
- [ ] Virtual backgrounds
- [ ] Live transcription & captions
- [ ] Whiteboard collaboration
- [ ] Polls and Q&A
- [ ] Meeting templates
- [ ] Advanced analytics dashboard

### Performance Improvements
- [ ] Hardware-accelerated encoding
- [ ] Edge deployment for low latency
- [ ] Smart bandwidth allocation
- [ ] AI-powered quality optimization

---

## Original Design Notes

Below are the original design specifications that informed this implementation:

---

# How it should work (high level)

* Clients (browser) use **WebRTC** for real-time media (audio, video, screen share).
* One **signaling channel** (Socket.IO/WebSocket) handles room discovery, signalling (SDP/ICE), presence, chat, and control events.
* Use an **SFU (Selective Forwarding Unit)** (recommended: **mediasoup** or **Janus**) to forward/route media streams efficiently for multi-participant meetings (scales much better than peer-to-peer mesh).
* For large broadcasts / live streaming to many viewers, push from SFU to an **ingest (RTMP/WeBRTC→CDN)** or use a dedicated streaming pipeline (e.g., NGINX RTMP, Wowza, or managed CDN).
* Use TURN servers for NAT traversal; use STUN for ICE candidates.

---

# Key architecture components

1. **Clients** — Web (WebRTC), mobile (WebRTC or native wrappers). Maintain a Socket.IO connection for signaling.
2. **Signaling server** — Socket.IO + REST endpoints for auth, meeting creation, presigned uploads,
3. **SFU cluster** — mediasoup / Janus / Jitsi Videobridge:

   * Receives participants’ upstream tracks.
   * Forwards selected tracks to other participants (downstreams).
   * Handles simulcast and SVC layers for adaptive quality.
4. **TURN/STUN servers** — coturn or hosted TURN (Twilio, Xirsys) for NAT traversal & fallback.
5. **Media workers** — screen-capture handling.
6. **Live streaming bridge** — SFU → RTMP sink for CDN or WebRTC to HLS/DASH pipeline.
7. **Backend DB and pub/sub** — Mongo/Postgres for metadata; Redis for presence; message queue (Kafka/Redis Streams) for tasks and event propagation.
9. **Monitoring & logging** — Prometheus, Grafana, Sentry, call-quality metrics (Jitter, RTT, packet loss).

---

# Core UX flows (user stories + behavior)

## 1. Join meeting via **Audio** (one click)

* User clicks “Audio”.
* Client:

  * Requests mic permission.
  * Connects to signaling socket, authenticates.
  * Joins room on server (server authorizes join).
  * Creates a local audio-only WebRTC track and **publishes** it to SFU.
  * Subscribes to SFU for other participants’ audio streams (auto-subscribed or selective).
* UI:

  * Mute/unmute mic button, participant list, speaker indicator.
  * Shows meeting timer & connection quality dot.

## 2. Upgrade to **Video** (click video)

* User clicks “Video” while in call or from entry screen.
* Client requests camera permission, creates video track, publishes to SFU (new track).
* Notify others via signaling; SFU updates routing.
* UI:

  * Replace audio-only tile with video tile (own feed).
  * Toggle buttons for camera select, mirror, video quality.

## 3. Join with Video directly (video + audio)

* Same as audio join but publish both audio + video tracks in one step.

## 4. Screen Share

* User clicks “Share screen”.
* Use `getDisplayMedia()` → create screen track; publish to SFU as separate track or as “screen” stream.
* SFU forwards screen to subscribers—often prioritized and pinned UI.
* Optionally: simultaneous camera + screen (picture-in-picture) — publish both.

## 5. Add participants at any time (no approval)

* Host or any authorized user triggers “add participant” action; server invites/adds user to room.
* If no approval required, server updates room membership and emits `participant:added` to the new user (and they auto-join or the client auto-joins via notification).
* Security note: adding without approval is a product decision — ensure meeting links or tokens are controlled to avoid unwanted joiners.

## 6. Muting/Removing participants

* Host may mute remote audio/video (SFU can stop forwarding or ask client to mute via signaling).
* Removing participant triggers `participant:removed` event and server forces leave.

## 7. Live streaming (broadcaster mode)

* One or multiple presenters publish to SFU.
* SFU forwards main program to a **stream bridge** that outputs RTMP/HLS to CDN.
* Viewers receive HLS/low-latency stream or connect via WebRTC viewer mode (subscribe-only).
* Support “low-latency HLS” or WebRTC-to-CDN for near real-time.


# SFU vs MCU vs Mesh — which to use?

* **Mesh**: each participant sends media to every other peer — fine for <4 participants; not scalable.
* **MCU (Mixer)**: server mixes streams into a single composite stream — heavy CPU, but simple client.
* **SFU (Recommended)**: participants publish to SFU; SFU forwards selected streams to consumers. Scales well, supports simulcast, per-client quality control.

Use **mediasoup** or **Janus** (mediasoup has excellent Node.js integration and flexibility). 

---

# Signaling & Socket Events (complete list — no code, only event names & purpose)

Use a single Socket.IO namespace `/meeting` for call-related events. These are the core events you’ll implement:

### Connection & Room

* `room:create` — client → server — create meeting room (returns roomId, join token)
* `room:join` — client → server — join meeting room (auth, role: host/participant)
* `room:joined` — server → client — confirmed join + room state
* `room:left` — client → server — leave room
* `room:close` — server → clients — close meeting for everyone
* `room:members` — server → client — list of current members

### Media Signaling (WebRTC + SFU)

* `webcam:publish` — client → server — notify server will publish webcam track (metadata)
* `screen:publish` — client → server — notify server will publish screen track
* `media:unpublish` — client → server — stop publishing a track
* `sdp:offer` / `sdp:answer` — client ↔ server — pass SDP offers/answers for establishing transports (for mediasoup createTransport/connect/produce/consume flows)
* `ice:candidate` — client → server — pass ICE candidate
* `transport:connect` — client → server — signal transport connection
* `produce` — client → server — create a producer (upload track) on SFU
* `consume` — client → server — create a consumer (receive track) from SFU
* `consumer:resume` / `consumer:pause` — client → server — pause/resume consuming a track
* `simulcast:layers` — server → client — instruct quality layers (for adaptive streaming)

### Controls & UX

* `mute:self` — client → server — mute own mic
* `mute:remote` — server → client — instruct remote to mute (host action)
* `pin:user` — client → server — pin a participant's stream (UI-only or server-side priority)
* `layout:update` — client → server → clients — request/change grid/speaker view
* `hand:raise` / `hand:lower` — client → server — raise/low hand
* `role:update` — server → client — change role (promote to co-host)
* `participant:add` — server → client — add a participant to meeting (no approval)
* `participant:remove` — server → client — remove participant
* `participant:info` — server → client — participant metadata update (name, avatar, status)

### Screen Share Specific

* `screenshare:start` — client → server — starting screenshare
* `screenshare:stop` — client → server — stop screen share
* `screenshare:notify` — server → clients — notify others screenshare started

### Live Streaming 

* `stream:start` — server → clients — start broadcast (notify viewers)
* `stream:stop` — server → clients — stop broadcast

### Quality & Telemetry

* `stats:report` — client → server — periodic connection stats (RTT, packet loss)
* `stats:update` — server → clients — aggregated call quality
* `reconnect:attempt` — client → server — reconnection flow indicator

### Chat & Reactions (in-meeting)

* `chat:send` — client → server — in-meeting text chat
* `chat:receive` — server → clients — broadcast chat message
* `reaction:send` — client → server — emoji reaction
* `reaction:update` — server → clients — reaction updates

---

# Design & UX recommendations (practical)

* **Persistent meeting link + short-lived tokens**: meeting link (roomId) plus a time-limited join token to control access.
* **Two entry buttons**: “Join with audio” and “Join with video” with clear permission prompts.
* **Prejoin Lobby**: let users choose mic/camera/device and audio/video preview; toggle “join muted” or “camera off”.
* **Auto-swap layout**: speaker view (active speaker) with grid option; pin & spotlight features.
* **Screen share UX**: prominent overlay when someone shares; allow viewers to switch to full-screen.
* **Raising hands & permissions**: show raised-hand badge; host can approve speak/allow unmute (optional).
* **Participant management**: host UI for mute/unmute remote, remove, or promote.
* **Network fallback**: when poor connection, auto-disable video and show audio-only mode; show quality indicator.
* **Accessibility**: captions (live transcription), keyboard navigation, large buttons and contrast for meeting controls.
* **Low-latency mode**: for meetings, aim for sub-500ms RT; for live streaming, accept HLS latency (a few seconds) or use low-latency HLS / WebRTC CDN options.

---

# Security, privacy & policy considerations

* **Auth & tokens**: JWT for REST + ephemeral join tokens for rooms. Validate tokens server-side.
* **Encryption**: TLS for signaling and DTLS/SRTP for media; consider E2EE for meetings (complex with multiple participants — requires end-to-end key exchange / insertable streams).
* **Permissions**: require explicit microphone/camera permission; indicate active screen-share to all participants.
* **Moderation**: implement UI & backend for reporting and removing bad actors.
* **Data retention & compliance**: retention policies, GDPR/CCPA compliance.

---

# Scaling & operational notes

* **Scale SFU horizontally**: distribute rooms to SFU worker pools; use autoscaling based on concurrent-publishers and downstream bandwidth.
* **Room routing**: use a signalling registry to map room → SFU worker; ensure sticky assignment or re-negotiation for migration.
* **Bandwidth & cost**: video consumes significant egress; use simulcast + SVC to send appropriate layers to each downstream.
* **Use CDNs** for streaming playback delivery.
* **TURN capacity planning**: TURN is traffic-intensive (relay); budget accordingly or use a managed TURN provider.
* **Monitoring**: capture per-room and per-participant metrics (bitrate, jitter, packet loss), and create alerts.


# Implementation pitfalls & gotchas

* **Bandwidth explosion** if you accidentally use mesh for >4 users; use SFU.
* **TURN costs**: relayed media is billed; limit TURN usage to necessary cases.
* **Browser differences**: `getDisplayMedia()` for screenshare behaves differently across browsers.
* **Mobile battery**: continuous video drains battery — implement adaptive backgrounding.
* **Signaling race conditions**: orchestrate transport creation → connect → produce → consume carefully; use ACKs.

---