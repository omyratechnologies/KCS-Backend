# MediaSoup WebRTC Endpoints Reference for Meetings

## Overview
This document provides a comprehensive reference for all MediaSoup WebRTC endpoints used in the KCS Meeting System. MediaSoup is a Selective Forwarding Unit (SFU) that provides scalable, high-quality video conferencing capabilities.

**Last Updated:** October 28, 2025  
**MediaSoup Version:** Latest  
**Backend Version:** 1.0.0

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [WebSocket Events for MediaSoup](#websocket-events-for-mediasoup)
3. [REST API Endpoints](#rest-api-endpoints)
4. [Client-Side Implementation Flow](#client-side-implementation-flow)
5. [Media Configuration](#media-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Performance & Scaling](#performance--scaling)

---

## Architecture Overview

### System Components

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Client    │◄───────►│  WebSocket   │◄───────►│  MediaSoup   │
│  (Browser)  │         │   Signaling  │         │   Workers    │
└─────────────┘         └──────────────┘         └──────────────┘
      │                        │                         │
      │                        │                         │
      ▼                        ▼                         ▼
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│ WebRTC      │         │   Socket.IO  │         │   Routers    │
│ Transport   │         │    Server    │         │  Transports  │
└─────────────┘         └──────────────┘         └──────────────┘
```

### MediaSoup Workers
- **Number of Workers:** Configurable via `MEDIASOUP_WORKERS` env variable (default: 4)
- **Load Balancing:** Round-robin distribution across workers
- **Port Range:** 10000-10999 per worker (configurable)
- **Protocols:** UDP (preferred), TCP fallback
- **TURN Server:** Optional for NAT traversal

### Supported Codecs
- **Audio:** Opus (48kHz, 2 channels)
- **Video:** VP8, VP9, H.264, AV1 (future)
- **Screen Sharing:** VP9 optimized

---

## WebSocket Events for MediaSoup

All WebRTC signaling happens through WebSocket using Socket.IO on port **4501**.

### Connection
**Endpoint:** `wss://your-domain.com:4501`  
**Authentication:** JWT token in query parameter or header

```javascript
const socket = io('wss://devapi.letscatchup-kcs.com:4501', {
  auth: { token: 'your-jwt-token' },
  transports: ['websocket', 'polling']
});
```

---

### 1. Create Transport

**Event:** `create-transport`  
**Direction:** Client → Server  
**Purpose:** Create a WebRTC transport for sending or receiving media

#### Request Payload
```json
{
  "meetingId": "meeting_uuid",
  "direction": "send" | "recv"
}
```

#### Response Event
**Event:** `transport-created`

```json
{
  "direction": "send" | "recv",
  "params": {
    "id": "transport_id",
    "iceParameters": {
      "usernameFragment": "string",
      "password": "string",
      "iceLite": true
    },
    "iceCandidates": [
      {
        "foundation": "string",
        "priority": 2130706431,
        "ip": "server_ip",
        "protocol": "udp",
        "port": 10000,
        "type": "host"
      }
    ],
    "dtlsParameters": {
      "role": "auto",
      "fingerprints": [
        {
          "algorithm": "sha-256",
          "value": "fingerprint_hash"
        }
      ]
    }
  }
}
```

#### Client Implementation
```javascript
// Create send transport (for sending audio/video)
socket.emit('create-transport', {
  meetingId: 'meeting_uuid',
  direction: 'send'
});

socket.on('transport-created', async ({ direction, params }) => {
  if (direction === 'send') {
    sendTransport = device.createSendTransport(params);
    
    // Handle connect event
    sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      socket.emit('connect-transport', {
        transportId: params.id,
        dtlsParameters
      });
      
      socket.once('transport-connected', () => {
        callback();
      });
    });
  }
});
```

---

### 2. Connect Transport

**Event:** `connect-transport`  
**Direction:** Client → Server  
**Purpose:** Establish DTLS connection for the transport

#### Request Payload
```json
{
  "transportId": "transport_id",
  "dtlsParameters": {
    "role": "client",
    "fingerprints": [
      {
        "algorithm": "sha-256",
        "value": "client_fingerprint_hash"
      }
    ]
  }
}
```

#### Response Event
**Event:** `transport-connected`

```json
{
  "transportId": "transport_id"
}
```

---

### 3. Produce Media

**Event:** `produce`  
**Direction:** Client → Server  
**Purpose:** Start sending audio or video to the SFU

#### Request Payload
```json
{
  "meetingId": "meeting_uuid",
  "kind": "audio" | "video",
  "rtpParameters": {
    "codecs": [
      {
        "mimeType": "audio/opus" | "video/VP8",
        "payloadType": 111,
        "clockRate": 48000,
        "channels": 2,
        "parameters": {}
      }
    ],
    "headerExtensions": [],
    "encodings": [
      {
        "ssrc": 12345,
        "maxBitrate": 500000
      }
    ]
  }
}
```

#### Response Event
**Event:** `produced`

```json
{
  "kind": "audio" | "video",
  "producerId": "producer_uuid"
}
```

#### Broadcast Event
**Event:** `new-producer` (sent to all other participants)

```json
{
  "participantId": "user_uuid",
  "producerId": "producer_uuid",
  "kind": "audio" | "video"
}
```

#### Client Implementation
```javascript
// Produce audio
const audioTrack = await navigator.mediaDevices.getUserMedia({ audio: true });
const audioProducer = await sendTransport.produce({
  track: audioTrack.getAudioTracks()[0],
  codecOptions: {
    opusStereo: 1,
    opusDtx: 1
  }
});

// Server will emit 'produced' event
socket.on('produced', ({ kind, producerId }) => {
  console.log(`Now producing ${kind}:`, producerId);
});
```

---

### 4. Consume Media

**Event:** `consume`  
**Direction:** Client → Server  
**Purpose:** Start receiving audio or video from another participant

#### Request Payload
```json
{
  "meetingId": "meeting_uuid",
  "producerParticipantId": "other_user_uuid",
  "kind": "audio" | "video",
  "rtpCapabilities": {
    "codecs": [
      {
        "mimeType": "audio/opus",
        "kind": "audio",
        "clockRate": 48000,
        "channels": 2,
        "preferredPayloadType": 111
      }
    ],
    "headerExtensions": []
  }
}
```

#### Response Event
**Event:** `consumed`

```json
{
  "id": "consumer_uuid",
  "producerId": "producer_uuid",
  "kind": "audio" | "video",
  "rtpParameters": {
    "codecs": [],
    "headerExtensions": [],
    "encodings": []
  },
  "producerParticipantId": "other_user_uuid"
}
```

#### Client Implementation
```javascript
// When you receive 'new-producer' event
socket.on('new-producer', async ({ participantId, producerId, kind }) => {
  // Get RTP capabilities from your device
  const rtpCapabilities = device.rtpCapabilities;
  
  socket.emit('consume', {
    meetingId: 'meeting_uuid',
    producerParticipantId: participantId,
    kind: kind,
    rtpCapabilities: rtpCapabilities
  });
});

socket.on('consumed', async ({ id, producerId, kind, rtpParameters }) => {
  const consumer = await recvTransport.consume({
    id,
    producerId,
    kind,
    rtpParameters
  });
  
  // Resume the consumer to start receiving media
  socket.emit('resume-consumer', { consumerId: id });
  
  // Attach to video/audio element
  if (kind === 'video') {
    videoElement.srcObject = new MediaStream([consumer.track]);
  }
});
```

---

### 5. Resume/Pause Consumer

**Event:** `resume-consumer` / `pause-consumer`  
**Direction:** Client → Server  
**Purpose:** Control media reception from a specific producer

#### Request Payload (Resume)
```json
{
  "consumerId": "consumer_uuid"
}
```

#### Response Event
**Event:** `consumer-resumed` / `consumer-paused`

```json
{
  "consumerId": "consumer_uuid"
}
```

#### Client Implementation
```javascript
// Resume receiving media
socket.emit('resume-consumer', { consumerId: 'consumer_uuid' });

// Pause receiving media (to save bandwidth)
socket.emit('pause-consumer', { consumerId: 'consumer_uuid' });
```

---

### 6. Additional Meeting Events

These events are also handled through WebSocket:

#### Raise Hand
```javascript
socket.emit('raise-hand', {
  meetingId: 'meeting_uuid',
  raised: true
});

socket.on('hand-raised', ({ participantId, userName, raised, timestamp }) => {
  // Update UI to show hand raised
});
```

#### Send Reaction
```javascript
socket.emit('send-reaction', {
  meetingId: 'meeting_uuid',
  reaction: '👍' // or '👏', '❤️', etc.
});

socket.on('participant-reaction', ({ participantId, userName, reaction, timestamp }) => {
  // Show reaction animation
});
```

---

## REST API Endpoints

### 1. Get WebRTC Configuration

**Endpoint:** `GET /api/meetings/:meeting_id`  
**Authentication:** Required (JWT)  
**Purpose:** Get meeting details including WebRTC configuration

#### Response
```json
{
  "success": true,
  "data": {
    "meeting": {
      "id": "meeting_uuid",
      "meeting_title": "Team Standup",
      "webrtc_config": {
        "ice_servers": [
          {
            "urls": ["stun:stun.l.google.com:19302"]
          },
          {
            "urls": [
              "turn:your-turn-server.com:3478?transport=udp",
              "turn:your-turn-server.com:3478?transport=tcp"
            ],
            "username": "1730044800:user_id",
            "credential": "base64_credential"
          }
        ]
      }
    }
  }
}
```

---

### 2. Get TURN Credentials

**Endpoint:** `GET /api/meetings/:meeting_id/webrtc-config`  
**Authentication:** Required (JWT)  
**Purpose:** Get fresh TURN credentials (24-hour validity)

#### Response
```json
{
  "success": true,
  "data": {
    "iceServers": [
      {
        "urls": ["stun:stun.l.google.com:19302"]
      },
      {
        "urls": [
          "turn:your-turn-server.com:3478?transport=udp",
          "turn:your-turn-server.com:3478?transport=tcp"
        ],
        "username": "timestamp:user_id",
        "credential": "hmac_credential",
        "credentialType": "password"
      }
    ],
    "rtcpMuxPolicy": "require",
    "bundlePolicy": "max-bundle"
  }
}
```

---

### 3. Get Meeting Statistics

**Endpoint:** `GET /api/meetings/:meeting_id/live-stats`  
**Authentication:** Required (JWT)  
**Purpose:** Get real-time MediaSoup statistics

#### Response
```json
{
  "success": true,
  "data": {
    "participants": 5,
    "activeProducers": 10,
    "activeConsumers": 40,
    "bandwidth": {
      "incoming": 5242880,
      "outgoing": 10485760
    },
    "quality": {
      "average": 0.85,
      "poor": 0.10,
      "good": 0.60,
      "excellent": 0.30
    }
  }
}
```

---

### 4. WebRTC Health Check

**Endpoint:** `GET /api/health/webrtc`  
**Authentication:** Required (Admin only)  
**Purpose:** Check MediaSoup worker health

#### Response
```json
{
  "success": true,
  "message": "WebRTC service healthy",
  "data": {
    "service": "MediaSoup WebRTC",
    "available": true,
    "workers": 4,
    "activeRooms": 12,
    "details": {
      "mode": "Full WebRTC",
      "workers": 4,
      "activeRooms": 12,
      "totalParticipants": 45
    }
  }
}
```

---

## Client-Side Implementation Flow

### Complete Meeting Join Flow

```javascript
// 1. Connect to WebSocket
const socket = io('wss://devapi.letscatchup-kcs.com:4501', {
  auth: { token: jwtToken },
  transports: ['websocket']
});

// 2. Initialize MediaSoup Device
import * as mediasoupClient from 'mediasoup-client';
const device = new mediasoupClient.Device();

// 3. Get router RTP capabilities (from server or meeting config)
const routerRtpCapabilities = meetingData.webrtc_config.rtpCapabilities;
await device.load({ routerRtpCapabilities });

// 4. Create Send Transport
let sendTransport;
socket.emit('create-transport', {
  meetingId: meetingId,
  direction: 'send'
});

socket.on('transport-created', async ({ direction, params }) => {
  if (direction === 'send') {
    sendTransport = device.createSendTransport(params);
    
    // Handle connection
    sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      socket.emit('connect-transport', {
        transportId: params.id,
        dtlsParameters
      });
      socket.once('transport-connected', callback);
    });
    
    // Handle production
    sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      socket.emit('produce', {
        meetingId,
        kind,
        rtpParameters
      });
      
      socket.once('produced', ({ producerId }) => {
        callback({ id: producerId });
      });
    });
  }
});

// 5. Create Receive Transport
let recvTransport;
socket.emit('create-transport', {
  meetingId: meetingId,
  direction: 'recv'
});

socket.on('transport-created', async ({ direction, params }) => {
  if (direction === 'recv') {
    recvTransport = device.createRecvTransport(params);
    
    recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      socket.emit('connect-transport', {
        transportId: params.id,
        dtlsParameters
      });
      socket.once('transport-connected', callback);
    });
  }
});

// 6. Start producing media (audio/video)
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
});

const audioTrack = stream.getAudioTracks()[0];
const videoTrack = stream.getVideoTracks()[0];

const audioProducer = await sendTransport.produce({ track: audioTrack });
const videoProducer = await sendTransport.produce({ track: videoTrack });

// 7. Consume media from other participants
socket.on('new-producer', async ({ participantId, producerId, kind }) => {
  socket.emit('consume', {
    meetingId,
    producerParticipantId: participantId,
    kind,
    rtpCapabilities: device.rtpCapabilities
  });
});

socket.on('consumed', async ({ id, producerId, kind, rtpParameters, producerParticipantId }) => {
  const consumer = await recvTransport.consume({
    id,
    producerId,
    kind,
    rtpParameters
  });
  
  // Resume to start receiving
  socket.emit('resume-consumer', { consumerId: id });
  
  // Render to DOM
  const videoElement = document.getElementById(`participant-${producerParticipantId}`);
  if (kind === 'video') {
    videoElement.srcObject = new MediaStream([consumer.track]);
  } else {
    // Handle audio
    const audioElement = new Audio();
    audioElement.srcObject = new MediaStream([consumer.track]);
    audioElement.play();
  }
});

// 8. Join meeting room via WebSocket
socket.emit('join-meeting', {
  meetingId: meetingId,
  meeting_password: password // if required
});

socket.on('meeting-joined', (data) => {
  console.log('Successfully joined meeting:', data);
});
```

---

## Media Configuration

### Recommended Video Settings

```javascript
const videoConstraints = {
  width: { min: 640, ideal: 1280, max: 1920 },
  height: { min: 360, ideal: 720, max: 1080 },
  frameRate: { min: 15, ideal: 30, max: 60 },
  aspectRatio: 16/9
};
```

### Recommended Audio Settings

```javascript
const audioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 2
};
```

### Screen Sharing Settings

```javascript
const screenConstraints = {
  video: {
    width: { max: 1920 },
    height: { max: 1080 },
    frameRate: { max: 30 }
  },
  audio: false
};

const screenStream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
```

### Bitrate Configuration

```javascript
// Video encoding parameters
const videoEncodings = [
  {
    rid: 'r0',
    maxBitrate: 100000,
    scalabilityMode: 'S1T3'
  },
  {
    rid: 'r1',
    maxBitrate: 300000,
    scalabilityMode: 'S1T3'
  },
  {
    rid: 'r2',
    maxBitrate: 900000,
    scalabilityMode: 'S1T3'
  }
];
```

---

## Troubleshooting

### Common Issues

#### 1. Transport Creation Fails
**Symptoms:** `transport-created` event never fires  
**Solutions:**
- Check MediaSoup workers are running: `GET /api/meetings/health/webrtc`
- Verify firewall allows UDP ports 10000-13999
- Check MEDIASOUP_ANNOUNCED_IP environment variable

#### 2. ICE Connection Failed
**Symptoms:** Transport state stuck in "connecting"  
**Solutions:**
- Verify STUN/TURN server configuration
- Check NAT/firewall settings
- Test with public STUN server: `stun:stun.l.google.com:19302`
- Enable TCP transport as fallback

#### 3. No Audio/Video Received
**Symptoms:** Consumer created but no media playing  
**Solutions:**
- Ensure `resume-consumer` event is sent
- Check producer is still active
- Verify codec compatibility
- Check browser media permissions

#### 4. Poor Quality or Lag
**Symptoms:** Choppy video, audio glitches  
**Solutions:**
- Check network bandwidth: `GET /api/meetings/:id/stats`
- Reduce video resolution/framerate
- Enable simulcast for adaptive streaming
- Check CPU usage on client side

#### 5. Worker Died
**Symptoms:** All connections drop suddenly  
**Solutions:**
- Check server logs for worker crash
- Verify system resources (CPU/Memory)
- Restart MediaSoup workers
- Check for memory leaks

---

## Performance & Scaling

### Server Requirements

| Participants | CPU Cores | RAM | Bandwidth |
|-------------|-----------|-----|-----------|
| 1-50 | 2 cores | 2GB | 100 Mbps |
| 50-200 | 4 cores | 4GB | 500 Mbps |
| 200-500 | 8 cores | 8GB | 1 Gbps |
| 500-1000 | 16 cores | 16GB | 2 Gbps |

### Bandwidth Calculation

**Per Participant:**
- Audio (Opus): ~50 Kbps
- Video 720p (VP8): ~1.5 Mbps
- Video 1080p (H.264): ~3 Mbps
- Screen share: ~2 Mbps

**For a 10-person meeting with video:**
- Incoming: 10 participants × 1.5 Mbps = 15 Mbps
- Outgoing: 1 stream × 9 receivers × 1.5 Mbps = 13.5 Mbps
- **Total per participant: ~28.5 Mbps**

### Optimization Tips

1. **Use Simulcast**
   - Send multiple quality layers
   - Server selects appropriate layer per consumer
   - Saves bandwidth for poor connections

2. **Enable VP9 SVC**
   - Scalable Video Coding
   - Better quality at lower bitrates
   - Single encoding for multiple qualities

3. **Implement Active Speaker Detection**
   - Only send high-quality video for active speakers
   - Reduce quality for inactive participants
   - Saves significant bandwidth in large meetings

4. **Use Audio-Only Mode**
   - Option for low-bandwidth users
   - Dramatically reduces data usage
   - ~50 Kbps vs ~1.5 Mbps per stream

5. **Connection Quality Monitoring**
   - Monitor RTT, jitter, packet loss
   - Dynamically adjust quality
   - Notify users of poor connections

---

## Environment Variables

Required configuration for MediaSoup:

```bash
# MediaSoup Configuration
MEDIASOUP_WORKERS=4                          # Number of workers
MEDIASOUP_LISTEN_IP=0.0.0.0                  # Listen on all interfaces
MEDIASOUP_ANNOUNCED_IP=your-public-ip        # Public IP for clients
MEDIASOUP_RTC_MIN_PORT=10000                 # RTC port range start
MEDIASOUP_RTC_MAX_PORT=13999                 # RTC port range end

# TURN Server (optional but recommended)
TURN_SERVER_HOST=your-turn-server.com        # TURN server hostname
TURN_SECRET=your-secret-key                  # Shared secret for auth
```

---

## Related Documentation

- [Complete Meeting System Guide](./COMPLETE_MEETING_SYSTEM_GUIDE.md)
- [Meeting WebSocket Events](./MEETING_SYSTEM_IMPLEMENTATION.md)
- [MediaSoup Official Docs](https://mediasoup.org/documentation/v3/)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)

---

## Support

For MediaSoup-specific issues:
1. Check server logs for worker errors
2. Use health check endpoint: `GET /api/meetings/health/webrtc`
3. Monitor stats endpoint: `GET /api/meetings/:id/stats`
4. Verify network/firewall configuration
5. Contact backend team with meeting ID and timestamps

---

**Version History:**
- v1.0.0 (October 28, 2025) - Initial documentation
- Covers all WebSocket events and REST endpoints
- Complete client implementation examples
- Performance and troubleshooting guides
