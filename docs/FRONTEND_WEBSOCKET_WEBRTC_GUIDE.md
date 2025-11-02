# WebSocket, WebRTC & Mediasoup Integration Guide for Frontend Developers

**Version:** 1.0.0  
**Last Updated:** November 3, 2025  
**Technology Stack:** Socket.IO v4.8.1 + mediasoup v3.18.0 + Redis  
**WebSocket URL:** `wss://your-domain.com` or `https://your-domain.com`

---

## Table of Contents

1. [Overview](#overview)
2. [Socket.IO Connection](#socketio-connection)
3. [WebRTC Architecture](#webrtc-architecture)
4. [Meeting Events](#meeting-events)
5. [WebRTC Events](#webrtc-events)
6. [Chat Events](#chat-events)
7. [Complete Integration Example](#complete-integration-example)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The KCS Meeting platform uses a **hybrid architecture** combining:

- **Socket.IO** for real-time signaling and events
- **mediasoup** (SFU) for scalable WebRTC media routing
- **Redis** for horizontal scaling and presence management

### Key Features

✅ **Scalable Video Conferencing** - Up to 10,000 concurrent participants  
✅ **Adaptive Quality (Simulcast)** - 3-layer video streaming (low/medium/high)  
✅ **Real-time Chat** - With typing indicators and presence  
✅ **Screen Sharing** - With quality optimization  
✅ **Recording** - Video, audio, and chat recording  
✅ **Hand Raise** - Non-verbal communication  
✅ **Reactions** - Emoji reactions with rate limiting  
✅ **Connection Quality Monitoring** - RTT, packet loss, jitter tracking  

### Architecture Overview

```
┌─────────────┐
│  Frontend   │
│   (React)   │
└──────┬──────┘
       │
       │ Socket.IO + WebRTC
       │
┌──────▼──────────────────────────────┐
│  Backend (Node.js + Hono)           │
│  ┌────────────┐  ┌────────────┐    │
│  │ Socket.IO  │  │ mediasoup  │    │
│  │  Server    │  │    SFU     │    │
│  └─────┬──────┘  └─────┬──────┘    │
│        │                │            │
│  ┌─────▼────────────────▼──────┐   │
│  │     Redis Adapter            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Socket.IO Connection

### 1. Installation

```bash
npm install socket.io-client
```

### 2. Basic Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-domain.com', {
  auth: {
    token: 'YOUR_JWT_TOKEN', // Required for authentication
  },
  transports: ['websocket', 'polling'], // Try WebSocket first
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected the socket, reconnect manually
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});
```

### 3. Authentication

The JWT token must contain:
```json
{
  "user_id": "user_123",
  "campus_id": "campus_001",
  "userName": "John Doe",
  "email": "john@example.com"
}
```

---

## WebRTC Architecture

### mediasoup SFU (Selective Forwarding Unit)

The backend uses **mediasoup** - a high-performance WebRTC SFU that:

- Routes media streams between participants (no mixing)
- Supports **simulcast** (3 quality layers)
- Handles up to 10,000 concurrent users
- Provides bandwidth adaptation
- Supports multiple codecs (VP8, VP9, H.264, AV1)

### Connection Flow

```
1. Join Meeting (Socket.IO)
   └─> join-meeting event
   
2. Create Transport (WebRTC signaling)
   ├─> create-transport (send)
   └─> create-transport (recv)
   
3. Connect Transport (DTLS handshake)
   ├─> connect-transport (send)
   └─> connect-transport (recv)
   
4. Produce Media (send audio/video)
   ├─> produce (audio)
   └─> produce (video with simulcast)
   
5. Consume Media (receive from others)
   ├─> consume (for each participant's audio/video)
   └─> resume-consumer (start receiving)
   
6. Quality Management
   └─> quality:change (switch layers)
```

---

## Meeting Events

### 1. Join Meeting

**Emit:** `join-meeting`

```javascript
socket.emit('join-meeting', {
  meetingId: 'meeting_abc123',
  userId: 'user_123',      // Optional (from JWT)
  userName: 'John Doe'     // Optional (from JWT)
});
```

**Listen:** `participant-joined`

```javascript
socket.on('participant-joined', (data) => {
  console.log('New participant joined:', data);
  /*
  {
    participantId: 'participant_xyz',
    userName: 'Jane Smith',
    userId: 'user_456',
    participantCount: 5
  }
  */
});
```

**Error Responses:**

```javascript
socket.on('error', (error) => {
  // Meeting not found
  // Access denied
  // Meeting has ended
  // Meeting is full
});
```

### 2. Leave Meeting

**Emit:** `leave-meeting`

```javascript
socket.emit('leave-meeting', {
  meetingId: 'meeting_abc123'
});
```

**Listen:** `participant-left`

```javascript
socket.on('participant-left', (data) => {
  console.log('Participant left:', data);
  /*
  {
    participantId: 'participant_xyz',
    userName: 'Jane Smith'
  }
  */
  
  // Remove participant's video element
  removeParticipantVideo(data.participantId);
});
```

### 3. Screen Sharing

**Start Screen Share:**

```javascript
socket.emit('screen:start', {
  meetingId: 'meeting_abc123'
});

socket.on('screen:started', (data) => {
  /*
  {
    meetingId: 'meeting_abc123',
    userId: 'user_123',
    userName: 'John Doe',
    timestamp: '2025-11-03T10:30:00Z'
  }
  */
  showScreenShareIndicator(data);
});
```

**Stop Screen Share:**

```javascript
socket.emit('screen:stop', {
  meetingId: 'meeting_abc123'
});

socket.on('screen:stopped', (data) => {
  hideScreenShareIndicator(data);
});
```

### 4. Hand Raise

**Raise Hand:**

```javascript
socket.emit('hand:raise', {
  meetingId: 'meeting_abc123'
});

socket.on('hand:raised', (data) => {
  /*
  {
    meetingId: 'meeting_abc123',
    userId: 'user_123',
    userName: 'John Doe',
    timestamp: '2025-11-03T10:30:00Z'
  }
  */
  showHandRaiseIndicator(data.userId);
});
```

**Lower Hand:**

```javascript
socket.emit('hand:lower', {
  meetingId: 'meeting_abc123'
});

socket.on('hand:lowered', (data) => {
  hideHandRaiseIndicator(data.userId);
});
```

### 5. Participant Mute (Host/Moderator Only)

```javascript
socket.emit('participant:mute', {
  meetingId: 'meeting_abc123',
  targetUserId: 'user_456',
  muteType: 'audio' // or 'video'
});

// Receive mute notification
socket.on('participant:muted', (data) => {
  if (data.targetUserId === myUserId) {
    // You were muted by host
    muteMyAudio();
    showNotification(`Muted by ${data.moderatorName}`);
  }
});
```

### 6. Reactions (Rate Limited: 3/second)

```javascript
socket.emit('reaction:send', {
  meetingId: 'meeting_abc123',
  emoji: '👍' // Valid: 👍, ❤️, 😂, 😮, 😢, 👏, 🎉, 🤔, 👎, 🔥
});

socket.on('reaction:received', (data) => {
  /*
  {
    meetingId: 'meeting_abc123',
    userId: 'user_123',
    userName: 'John Doe',
    emoji: '👍',
    timestamp: '2025-11-03T10:30:00Z'
  }
  */
  showReactionAnimation(data);
});

// Rate limit error
socket.on('error', (error) => {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.warn('Too many reactions, slow down!');
  }
});
```

### 7. Recording Control (Host/Moderator Only)

**Start Recording:**

```javascript
socket.emit('recording:start', {
  meetingId: 'meeting_abc123',
  options: {
    recordVideo: true,
    recordAudio: true,
    recordChat: false
  }
});

socket.on('recording:started', (data) => {
  /*
  {
    meetingId: 'meeting_abc123',
    recordingId: 'rec_xyz',
    hostName: 'John Doe',
    timestamp: '2025-11-03T10:30:00Z'
  }
  */
  showRecordingIndicator();
});
```

**Stop Recording:**

```javascript
socket.emit('recording:stop', {
  meetingId: 'meeting_abc123'
});

socket.on('recording:stopped', (data) => {
  hideRecordingIndicator();
});
```

**Pause/Resume Recording:**

```javascript
// Pause
socket.emit('recording:pause', { meetingId: 'meeting_abc123' });
socket.on('recording:paused', (data) => { /* ... */ });

// Resume
socket.emit('recording:resume', { meetingId: 'meeting_abc123' });
socket.on('recording:resumed', (data) => { /* ... */ });
```

**Authorization Errors:**

```javascript
socket.on('error', (error) => {
  switch(error.code) {
    case 'RECORDING_DISABLED':
      alert('Recording is disabled for this meeting');
      break;
    case 'UNAUTHORIZED_RECORDING':
      alert('Only hosts and moderators can control recording');
      break;
  }
});
```

### 8. Layout Control

```javascript
socket.emit('layout:change', {
  meetingId: 'meeting_abc123',
  layout: 'grid' // 'grid', 'speaker', 'presentation'
});

socket.on('layout:changed', (data) => {
  switchLayout(data.layout);
});
```

### 9. Participant Pin/Spotlight

```javascript
// Pin participant (personal view)
socket.emit('participant:pin', {
  meetingId: 'meeting_abc123',
  targetUserId: 'user_456'
});

socket.on('participant:pinned', (data) => {
  pinParticipantVideo(data.targetUserId);
});

// Spotlight participant (everyone sees)
socket.emit('participant:spotlight', {
  meetingId: 'meeting_abc123',
  targetUserId: 'user_456'
});

socket.on('participant:spotlighted', (data) => {
  spotlightParticipant(data.targetUserId);
});
```

### 10. Connection Statistics (Rate Limited: 1/5 seconds)

```javascript
socket.emit('stats:report', {
  meetingId: 'meeting_abc123',
  stats: {
    rtt: 45,           // Round-trip time (ms)
    packetLoss: 0.5,   // Packet loss percentage
    jitter: 10,        // Jitter (ms)
    bitrate: 1500000   // Bitrate (bps)
  }
});

// Stats are stored in database, no response event
```

---

## WebRTC Events

### 1. Create Transport

You need **two transports**: one for sending (`send`) and one for receiving (`recv`).

```javascript
// Create send transport (for your audio/video)
socket.emit('create-transport', {
  meetingId: 'meeting_abc123',
  direction: 'send'
});

socket.on('transport-created', async (data) => {
  /*
  {
    direction: 'send',
    params: {
      id: 'transport_id_xyz',
      iceParameters: { ... },
      iceCandidates: [ ... ],
      dtlsParameters: { ... }
    }
  }
  */
  
  if (data.direction === 'send') {
    sendTransport = device.createSendTransport(data.params);
    await setupSendTransport(sendTransport);
  } else if (data.direction === 'recv') {
    recvTransport = device.createRecvTransport(data.params);
    await setupRecvTransport(recvTransport);
  }
});

// Create recv transport (for receiving others' audio/video)
socket.emit('create-transport', {
  meetingId: 'meeting_abc123',
  direction: 'recv'
});
```

### 2. Connect Transport

After creating transports, connect them with DTLS parameters:

```javascript
// Setup send transport
async function setupSendTransport(transport) {
  transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    try {
      // Send DTLS parameters to server
      socket.emit('connect-transport', {
        transportId: transport.id,
        dtlsParameters: dtlsParameters
      });
      
      socket.once('transport-connected', () => {
        callback();
      });
    } catch (error) {
      errback(error);
    }
  });
  
  transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
    try {
      // Tell server you're producing media
      socket.emit('produce', {
        meetingId: 'meeting_abc123',
        kind: kind,
        rtpParameters: rtpParameters
      });
      
      socket.once('produced', (data) => {
        callback({ id: data.producerId });
      });
    } catch (error) {
      errback(error);
    }
  });
}

// Setup recv transport
async function setupRecvTransport(transport) {
  transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    try {
      socket.emit('connect-transport', {
        transportId: transport.id,
        dtlsParameters: dtlsParameters
      });
      
      socket.once('transport-connected', () => {
        callback();
      });
    } catch (error) {
      errback(error);
    }
  });
}
```

### 3. Produce Media (Send Audio/Video)

**With Simulcast (Video):**

```javascript
async function produceVideo(stream) {
  const videoTrack = stream.getVideoTracks()[0];
  
  // Create producer with simulcast
  const producer = await sendTransport.produce({
    track: videoTrack,
    encodings: [
      { maxBitrate: 100000, scaleResolutionDownBy: 4 },  // Low
      { maxBitrate: 300000, scaleResolutionDownBy: 2 },  // Medium
      { maxBitrate: 900000 }                             // High
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000
    }
  });
  
  // Backend automatically emits 'new-producer' to other participants
  
  return producer;
}

async function produceAudio(stream) {
  const audioTrack = stream.getAudioTracks()[0];
  
  const producer = await sendTransport.produce({
    track: audioTrack
  });
  
  return producer;
}
```

### 4. Consume Media (Receive from Others)

```javascript
// Listen for new producers
socket.on('new-producer', async (data) => {
  /*
  {
    participantId: 'user_456',
    producerId: 'producer_xyz',
    kind: 'video'
  }
  */
  
  await consumeMedia(data);
});

async function consumeMedia(producerData) {
  const { participantId, producerId, kind } = producerData;
  
  // Get RTP capabilities from your device
  const rtpCapabilities = device.rtpCapabilities;
  
  // Request to consume
  socket.emit('consume', {
    meetingId: 'meeting_abc123',
    producerParticipantId: participantId,
    kind: kind,
    rtpCapabilities: rtpCapabilities
  });
  
  socket.once('subscribed', async (data) => {
    /*
    {
      id: 'consumer_xyz',
      producerId: 'producer_xyz',
      kind: 'video',
      rtpParameters: { ... }
    }
    */
    
    // Create consumer
    const consumer = await recvTransport.consume({
      id: data.id,
      producerId: data.producerId,
      kind: data.kind,
      rtpParameters: data.rtpParameters
    });
    
    // Resume consumer to start receiving
    socket.emit('resume-consumer', {
      consumerId: consumer.id
    });
    
    // Display video/audio
    if (kind === 'video') {
      displayParticipantVideo(participantId, consumer.track);
    } else if (kind === 'audio') {
      playParticipantAudio(participantId, consumer.track);
    }
    
    // Store consumer reference
    consumers.set(consumer.id, consumer);
  });
}
```

### 5. Pause/Resume Consumer

```javascript
// Pause receiving media (e.g., when participant is off-screen)
socket.emit('pause-consumer', {
  consumerId: 'consumer_xyz'
});

// Resume receiving media
socket.emit('resume-consumer', {
  consumerId: 'consumer_xyz'
});
```

### 6. Quality Switching (Simulcast)

```javascript
// Switch to different quality layer
socket.emit('quality:change', {
  meetingId: 'meeting_abc123',
  participantId: 'user_456',
  quality: 'high' // 'low', 'medium', 'high'
});

socket.on('quality:changed', (data) => {
  console.log(`Quality changed to ${data.quality} for ${data.participantId}`);
});
```

**Automatic Quality Adaptation:**

```javascript
// Monitor connection quality and auto-switch
function monitorConnectionQuality() {
  setInterval(async () => {
    const stats = await getConnectionStats();
    
    if (stats.packetLoss > 5 || stats.rtt > 200) {
      // Poor connection, switch to low quality
      switchAllToLowQuality();
    } else if (stats.packetLoss < 1 && stats.rtt < 50) {
      // Good connection, switch to high quality
      switchAllToHighQuality();
    }
  }, 5000);
}
```

---

## Chat Events

### 1. Send Message (Rate Limited: 10/minute)

```javascript
socket.emit('send-message', {
  meetingId: 'meeting_abc123',
  message: 'Hello everyone!',
  recipientType: 'all', // 'all', 'private', 'host'
  recipientId: 'user_456' // Required for private messages
});

socket.on('new-message', (message) => {
  /*
  {
    id: 'msg_xyz',
    meeting_id: 'meeting_abc123',
    sender_id: 'user_123',
    sender_name: 'John Doe',
    message: 'Hello everyone!',
    message_type: 'text',
    recipient_type: 'all',
    timestamp: '2025-11-03T10:30:00Z'
  }
  */
  displayChatMessage(message);
});
```

### 2. Typing Indicator (Rate Limited: 1/second)

```javascript
// Start typing
socket.emit('typing', {
  meetingId: 'meeting_abc123',
  typing: true
});

// Stop typing
socket.emit('typing', {
  meetingId: 'meeting_abc123',
  typing: false
});

// Listen for others typing
socket.on('user-typing', (data) => {
  /*
  {
    userId: 'user_456',
    userName: 'Jane Smith',
    typing: true
  }
  */
  
  if (data.typing) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator(data.userName);
  }
});
```

---

## Complete Integration Example

Here's a complete example showing the full integration flow:

```javascript
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

class MeetingClient {
  constructor() {
    this.socket = null;
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map(); // kind -> producer
    this.consumers = new Map(); // consumerId -> consumer
    this.meetingId = null;
  }

  // Step 1: Connect to Socket.IO
  async connect(token) {
    this.socket = io('https://your-domain.com', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        this.setupSocketListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        reject(error);
      });
    });
  }

  // Step 2: Setup all socket event listeners
  setupSocketListeners() {
    // Meeting events
    this.socket.on('participant-joined', (data) => {
      console.log('👤 Participant joined:', data.userName);
      this.onParticipantJoined(data);
    });

    this.socket.on('participant-left', (data) => {
      console.log('👋 Participant left:', data.userName);
      this.onParticipantLeft(data);
    });

    // WebRTC events
    this.socket.on('new-producer', async (data) => {
      console.log('🎥 New producer:', data);
      await this.consumeMedia(data);
    });

    // Chat events
    this.socket.on('new-message', (message) => {
      console.log('💬 New message:', message);
      this.onNewMessage(message);
    });

    // Screen sharing
    this.socket.on('screen:started', (data) => {
      console.log('📺 Screen sharing started');
      this.onScreenShareStarted(data);
    });

    // Reactions
    this.socket.on('reaction:received', (data) => {
      this.showReaction(data);
    });

    // Errors
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.handleError(error);
    });
  }

  // Step 3: Join meeting
  async joinMeeting(meetingId) {
    this.meetingId = meetingId;

    return new Promise((resolve, reject) => {
      this.socket.emit('join-meeting', { meetingId });

      this.socket.once('participant-joined', async () => {
        // Initialize mediasoup device
        await this.initializeDevice();
        
        // Create transports
        await this.createTransports();
        
        resolve();
      });

      this.socket.once('error', (error) => {
        reject(error);
      });
    });
  }

  // Step 4: Initialize mediasoup device
  async initializeDevice() {
    // Get router RTP capabilities from server
    const rtpCapabilities = await this.getRtpCapabilities();

    this.device = new mediasoupClient.Device();
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });

    console.log('✅ Device initialized');
  }

  async getRtpCapabilities() {
    // This would come from your REST API
    const response = await fetch(`/meeting/${this.meetingId}/webrtc-config`);
    const data = await response.json();
    return data.rtpCapabilities;
  }

  // Step 5: Create send and recv transports
  async createTransports() {
    // Create send transport
    await this.createSendTransport();
    
    // Create recv transport
    await this.createRecvTransport();

    console.log('✅ Transports created');
  }

  async createSendTransport() {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-transport', {
        meetingId: this.meetingId,
        direction: 'send'
      });

      this.socket.once('transport-created', async (data) => {
        if (data.direction === 'send') {
          this.sendTransport = this.device.createSendTransport(data.params);

          // Handle connect event
          this.sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
            this.socket.emit('connect-transport', {
              transportId: this.sendTransport.id,
              dtlsParameters
            });

            this.socket.once('transport-connected', () => callback());
            this.socket.once('error', errback);
          });

          // Handle produce event
          this.sendTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
            this.socket.emit('produce', {
              meetingId: this.meetingId,
              kind,
              rtpParameters
            });

            this.socket.once('produced', (data) => {
              callback({ id: data.producerId });
            });
            this.socket.once('error', errback);
          });

          resolve();
        }
      });
    });
  }

  async createRecvTransport() {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-transport', {
        meetingId: this.meetingId,
        direction: 'recv'
      });

      this.socket.once('transport-created', async (data) => {
        if (data.direction === 'recv') {
          this.recvTransport = this.device.createRecvTransport(data.params);

          // Handle connect event
          this.recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
            this.socket.emit('connect-transport', {
              transportId: this.recvTransport.id,
              dtlsParameters
            });

            this.socket.once('transport-connected', () => callback());
            this.socket.once('error', errback);
          });

          resolve();
        }
      });
    });
  }

  // Step 6: Produce media (send your audio/video)
  async produceMedia(stream) {
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    // Produce audio
    if (audioTrack) {
      const audioProducer = await this.sendTransport.produce({
        track: audioTrack
      });
      this.producers.set('audio', audioProducer);
      console.log('🎤 Audio producer created');
    }

    // Produce video with simulcast
    if (videoTrack) {
      const videoProducer = await this.sendTransport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 100000, scaleResolutionDownBy: 4 },
          { maxBitrate: 300000, scaleResolutionDownBy: 2 },
          { maxBitrate: 900000 }
        ],
        codecOptions: {
          videoGoogleStartBitrate: 1000
        }
      });
      this.producers.set('video', videoProducer);
      console.log('🎥 Video producer created with simulcast');
    }
  }

  // Step 7: Consume media (receive from others)
  async consumeMedia(producerData) {
    const { participantId, producerId, kind } = producerData;

    return new Promise((resolve, reject) => {
      this.socket.emit('consume', {
        meetingId: this.meetingId,
        producerParticipantId: participantId,
        kind,
        rtpCapabilities: this.device.rtpCapabilities
      });

      this.socket.once('subscribed', async (data) => {
        const consumer = await this.recvTransport.consume({
          id: data.id,
          producerId: data.producerId,
          kind: data.kind,
          rtpParameters: data.rtpParameters
        });

        this.consumers.set(consumer.id, consumer);

        // Resume consumer
        this.socket.emit('resume-consumer', { consumerId: consumer.id });

        // Display media
        if (kind === 'video') {
          this.displayVideo(participantId, consumer.track);
        } else if (kind === 'audio') {
          this.playAudio(participantId, consumer.track);
        }

        console.log(`✅ Consuming ${kind} from ${participantId}`);
        resolve(consumer);
      });

      this.socket.once('error', reject);
    });
  }

  // Display video track
  displayVideo(participantId, track) {
    let videoElement = document.getElementById(`video-${participantId}`);
    
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.id = `video-${participantId}`;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      document.getElementById('videos-container').appendChild(videoElement);
    }

    const stream = new MediaStream([track]);
    videoElement.srcObject = stream;
  }

  // Play audio track
  playAudio(participantId, track) {
    const audioElement = document.createElement('audio');
    audioElement.id = `audio-${participantId}`;
    audioElement.autoplay = true;
    
    const stream = new MediaStream([track]);
    audioElement.srcObject = stream;
    
    document.body.appendChild(audioElement);
  }

  // Send chat message
  sendMessage(message) {
    this.socket.emit('send-message', {
      meetingId: this.meetingId,
      message,
      recipientType: 'all'
    });
  }

  // Toggle video
  async toggleVideo() {
    const videoProducer = this.producers.get('video');
    
    if (videoProducer) {
      if (videoProducer.paused) {
        await videoProducer.resume();
      } else {
        await videoProducer.pause();
      }
    }
  }

  // Toggle audio
  async toggleAudio() {
    const audioProducer = this.producers.get('audio');
    
    if (audioProducer) {
      if (audioProducer.paused) {
        await audioProducer.resume();
      } else {
        await audioProducer.pause();
      }
    }
  }

  // Leave meeting
  async leaveMeeting() {
    // Close all producers
    for (const producer of this.producers.values()) {
      producer.close();
    }

    // Close all consumers
    for (const consumer of this.consumers.values()) {
      consumer.close();
    }

    // Close transports
    if (this.sendTransport) this.sendTransport.close();
    if (this.recvTransport) this.recvTransport.close();

    // Emit leave event
    this.socket.emit('leave-meeting', {
      meetingId: this.meetingId
    });

    console.log('👋 Left meeting');
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage
const meetingClient = new MeetingClient();

async function joinMeeting() {
  try {
    // Connect to server
    await meetingClient.connect('YOUR_JWT_TOKEN');

    // Join meeting
    await meetingClient.joinMeeting('meeting_abc123');

    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    // Produce media
    await meetingClient.produceMedia(stream);

    console.log('✅ Successfully joined meeting!');
  } catch (error) {
    console.error('❌ Failed to join meeting:', error);
  }
}
```

---

## Error Handling

### Common Errors

```javascript
socket.on('error', (error) => {
  switch(error.code) {
    case 'MEETING_NOT_FOUND':
      alert('Meeting not found');
      break;
      
    case 'ACCESS_DENIED':
      alert('You do not have access to this meeting');
      break;
      
    case 'MEETING_FULL':
      alert('Meeting is full');
      break;
      
    case 'MEETING_ENDED':
      alert('Meeting has ended');
      break;
      
    case 'RATE_LIMIT_EXCEEDED':
      console.warn('Rate limit exceeded:', error.event);
      break;
      
    case 'UNAUTHORIZED_RECORDING':
      alert('Only hosts can control recording');
      break;
      
    case 'RECORDING_DISABLED':
      alert('Recording is disabled for this meeting');
      break;
      
    default:
      console.error('Unknown error:', error);
  }
});
```

### Reconnection Handling

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected, try to reconnect
    socket.connect();
  }
  
  // Show reconnection UI
  showReconnectingIndicator();
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  
  // Rejoin meeting
  rejoinMeeting();
  
  // Hide reconnection UI
  hideReconnectingIndicator();
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  alert('Connection lost. Please refresh the page.');
});
```

---

## Best Practices

### 1. Resource Management

```javascript
// Always clean up resources when leaving
async function cleanup() {
  // Stop all tracks
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  // Close producers
  producers.forEach(producer => producer.close());

  // Close consumers
  consumers.forEach(consumer => consumer.close());

  // Close transports
  if (sendTransport) sendTransport.close();
  if (recvTransport) recvTransport.close();

  // Emit leave event
  socket.emit('leave-meeting', { meetingId });
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
```

### 2. Bandwidth Optimization

```javascript
// Monitor bandwidth and adjust quality
async function optimizeBandwidth() {
  const stats = await getNetworkStats();
  
  if (stats.bandwidth < 500000) { // < 500 kbps
    // Low bandwidth, switch to audio-only
    disableVideo();
    switchAllToLowQuality();
  } else if (stats.bandwidth < 1500000) { // < 1.5 Mbps
    // Medium bandwidth, use medium quality
    switchAllToMediumQuality();
  } else {
    // Good bandwidth, use high quality
    switchAllToHighQuality();
  }
}
```

### 3. UI Synchronization

```javascript
// Keep UI in sync with meeting state
class MeetingState {
  participants = new Map();
  
  addParticipant(data) {
    this.participants.set(data.userId, {
      name: data.userName,
      video: false,
      audio: false,
      screenSharing: false,
      handRaised: false
    });
    
    this.updateParticipantList();
  }
  
  updateParticipantMedia(userId, mediaType, enabled) {
    const participant = this.participants.get(userId);
    if (participant) {
      participant[mediaType] = enabled;
      this.updateParticipantList();
    }
  }
  
  updateParticipantList() {
    // Update UI to show current participants
    const container = document.getElementById('participants');
    container.innerHTML = '';
    
    this.participants.forEach((data, userId) => {
      const element = this.createParticipantElement(userId, data);
      container.appendChild(element);
    });
  }
}
```

### 4. Performance Monitoring

```javascript
// Monitor connection quality
function startQualityMonitoring() {
  setInterval(async () => {
    for (const [id, consumer] of consumers) {
      const stats = await consumer.getStats();
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp') {
          const quality = calculateQuality({
            packetsLost: report.packetsLost,
            jitter: report.jitter,
            bytesReceived: report.bytesReceived
          });
          
          updateQualityIndicator(id, quality);
        }
      });
    }
  }, 5000);
}

function calculateQuality(stats) {
  const lossRate = stats.packetsLost / (stats.packetsReceived || 1);
  
  if (lossRate > 0.05 || stats.jitter > 50) return 'poor';
  if (lossRate > 0.02 || stats.jitter > 30) return 'fair';
  if (lossRate > 0.01 || stats.jitter > 20) return 'good';
  return 'excellent';
}
```

### 5. Error Recovery

```javascript
// Automatic recovery from transport failures
sendTransport.on('connectionstatechange', (state) => {
  console.log('Send transport state:', state);
  
  if (state === 'failed') {
    console.error('Send transport failed, recreating...');
    recreateSendTransport();
  }
});

async function recreateSendTransport() {
  try {
    // Close old transport
    if (sendTransport) {
      sendTransport.close();
    }
    
    // Create new transport
    await createSendTransport();
    
    // Reproduce media
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    await produceMedia(stream);
    
    console.log('✅ Transport recreated successfully');
  } catch (error) {
    console.error('❌ Failed to recreate transport:', error);
  }
}
```

---

## Troubleshooting

### Problem: No Video/Audio

**Possible Causes:**
1. Camera/microphone permissions not granted
2. Transport not connected
3. Producer not created
4. Consumer paused

**Solution:**

```javascript
// Check permissions
const permissions = await navigator.permissions.query({ name: 'camera' });
if (permissions.state !== 'granted') {
  await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}

// Check transport state
console.log('Send transport state:', sendTransport.connectionState);
console.log('Recv transport state:', recvTransport.connectionState);

// Check producer state
const videoProducer = producers.get('video');
console.log('Video producer paused:', videoProducer?.paused);

// Resume consumer if paused
consumer.resume();
```

### Problem: Poor Video Quality

**Possible Causes:**
1. Low bandwidth
2. High packet loss
3. Wrong simulcast layer

**Solution:**

```javascript
// Check connection stats
const stats = await consumer.getStats();
stats.forEach(report => {
  if (report.type === 'inbound-rtp') {
    console.log('Packets lost:', report.packetsLost);
    console.log('Jitter:', report.jitter);
    console.log('Bitrate:', report.bytesReceived * 8 / report.timestamp);
  }
});

// Switch to lower quality
socket.emit('quality:change', {
  meetingId: 'meeting_abc123',
  participantId: 'user_456',
  quality: 'low'
});
```

### Problem: Echo/Feedback

**Solution:**

```javascript
// Enable audio constraints
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

// Don't play your own audio
audioElement.muted = true; // For local audio element
```

### Problem: Socket Disconnections

**Possible Causes:**
1. Network instability
2. Server restart
3. Authentication token expired

**Solution:**

```javascript
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server forcibly disconnected, might be auth issue
    refreshAuthToken().then(() => socket.connect());
  }
});

// Implement exponential backoff
let reconnectAttempts = 0;
socket.on('reconnect_attempt', () => {
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  console.log(`Reconnecting in ${delay}ms...`);
});
```

---

## Summary

### Event Overview

**Meeting Events (19 total):**
- join-meeting, leave-meeting
- screen:start, screen:stop
- hand:raise, hand:lower
- participant:mute, participant:pin, participant:spotlight
- reaction:send
- recording:start, recording:stop, recording:pause, recording:resume
- layout:change
- stats:report

**WebRTC Events (7 total):**
- create-transport, connect-transport
- produce, consume
- resume-consumer, pause-consumer
- quality:change

**Chat Events (3 total):**
- send-message, typing
- (receive: new-message, user-typing)

### Rate Limits
- **send-message**: 10/minute
- **typing**: 1/second
- **reaction:send**: 3/second
- **stats:report**: 1/5 seconds

### Key Features
✅ Simulcast (3-layer video)  
✅ Automatic quality adaptation  
✅ Real-time chat with typing indicators  
✅ Screen sharing  
✅ Recording control  
✅ Hand raise & reactions  
✅ Connection quality monitoring  

---

**Need Help?**
- WebRTC Issues: Check transport states and RTP capabilities
- Socket Issues: Check authentication and connection state
- Media Issues: Verify getUserMedia permissions and constraints
- Quality Issues: Monitor stats and adjust simulcast layers

**Last Updated:** November 3, 2025
