# Meeting System - Troubleshooting & Optimization Guide

**Version:** 2.0  
**Last Updated:** November 3, 2025  
**Purpose:** Diagnostic procedures, common issues, and performance tuning

---

## 🎯 Table of Contents

1. [Common Issues & Solutions](#common-issues--solutions)
2. [Performance Troubleshooting](#performance-troubleshooting)
3. [Network Issues](#network-issues)
4. [WebRTC Debugging](#webrtc-debugging)
5. [mediasoup Issues](#mediasoup-issues)
6. [Database & Cache Issues](#database--cache-issues)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Optimization Checklist](#optimization-checklist)

---

## 🔧 Common Issues & Solutions

### Issue 1: Participants Can't Join Meeting

**Symptoms:**
- "Meeting not found" error
- "Access denied" error
- Stuck on "Joining..." screen

**Diagnostic Steps:**

```bash
# 1. Check if meeting exists in database
curl -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/meeting/{meeting_id}

# 2. Check Socket.IO connection
# In browser console:
socket.io.connected // Should be true

# 3. Check authentication
# Verify JWT token is valid and not expired
```

**Solutions:**

```typescript
// Solution A: Ensure proper authentication
// middleware/auth.middleware.ts
export async function authenticateSocket(socket: Socket): Promise<User | null> {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate user still exists and is active
    const user = await User.findById(decoded.user_id);
    if (!user || !user.is_active) {
      return null;
    }
    
    return user;
  } catch (error) {
    MeetingLogger.error('auth_failed', { error: error.message });
    return null;
  }
}

// Solution B: Add retry logic on client
// client/meeting-socket.ts
function joinMeetingWithRetry(meetingId: string, maxRetries = 3) {
  let attempts = 0;
  
  const tryJoin = () => {
    socket.emit('room:join', { meeting_id: meetingId }, (response) => {
      if (response.error && attempts < maxRetries) {
        attempts++;
        setTimeout(tryJoin, 1000 * attempts); // Exponential backoff
      } else if (response.error) {
        showError('Unable to join meeting after multiple attempts');
      } else {
        onJoinSuccess(response);
      }
    });
  };
  
  tryJoin();
}
```

---

### Issue 2: No Audio/Video After Joining

**Symptoms:**
- Participant sees others but can't be heard/seen
- "Producer creation failed" errors
- Microphone/camera permissions denied

**Diagnostic Steps:**

```javascript
// Browser console diagnostics
// 1. Check media permissions
navigator.permissions.query({ name: 'microphone' }).then(result => {
  console.log('Microphone:', result.state); // Should be 'granted'
});

navigator.permissions.query({ name: 'camera' }).then(result => {
  console.log('Camera:', result.state); // Should be 'granted'
});

// 2. Test getUserMedia
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    console.log('Media access OK', stream.getTracks());
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('Media access failed:', error);
  });

// 3. Check WebRTC connection state
pc.connectionState // Should be 'connected'
pc.iceConnectionState // Should be 'connected' or 'completed'
```

**Solutions:**

```typescript
// Solution A: Proper error handling for media access
async function requestMediaAccess(
  constraints: MediaStreamConstraints
): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error: any) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        showError('Please allow camera/microphone access in browser settings');
        break;
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        showError('No camera or microphone found');
        break;
      case 'NotReadableError':
      case 'TrackStartError':
        showError('Camera/microphone is already in use by another application');
        break;
      case 'OverconstrainedError':
        showError('Camera/microphone does not support requested settings');
        // Retry with relaxed constraints
        return await requestMediaAccess({ audio: true, video: true });
      default:
        showError(`Media access error: ${error.message}`);
    }
    return null;
  }
}

// Solution B: Implement transport recovery
export class WebRTCService {
  static async recoverTransport(transportId: string): Promise<boolean> {
    try {
      const transport = this.getTransportById(transportId);
      if (!transport) return false;

      // Check transport state
      if (transport.connectionState === 'failed') {
        MeetingLogger.warn('transport_recovery_attempt', { transport_id: transportId });
        
        // Close and recreate transport
        await transport.close();
        this.transports.delete(transportId);
        
        // Trigger client to recreate
        return false;
      }

      return true;
    } catch (error) {
      MeetingLogger.error('transport_recovery_failed', error);
      return false;
    }
  }
}
```

---

### Issue 3: Screen Share Not Working

**Symptoms:**
- "Screen share failed" error
- Blank/black screen shared
- Browser prompts but nothing happens

**Diagnostic Steps:**

```javascript
// Browser console check
navigator.mediaDevices.getDisplayMedia({ video: true })
  .then(stream => {
    console.log('Screen share OK:', stream.getVideoTracks()[0].label);
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('Screen share failed:', error);
  });
```

**Solutions:**

```typescript
// Solution: Robust screen share implementation
async function startScreenShare(): Promise<MediaStream | null> {
  try {
    const constraints: DisplayMediaStreamConstraints = {
      video: {
        cursor: 'always',
        displaySurface: 'monitor', // or 'window', 'browser'
        frameRate: { ideal: 30, max: 60 },
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    };

    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

    // Handle screen share stop (user clicks "Stop sharing" in browser UI)
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.addEventListener('ended', () => {
      console.log('Screen share ended by user');
      socket.emit('screen:stop', { meeting_id });
      onScreenShareEnded();
    });

    // Configure for content (text/graphics optimization)
    const sender = peerConnection.getSenders().find(s => s.track === videoTrack);
    if (sender) {
      const parameters = sender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      parameters.encodings[0].maxBitrate = 3000000; // 3 Mbps for screen
      await sender.setParameters(parameters);
    }

    // Set content hint for optimization
    if ('contentHint' in videoTrack) {
      videoTrack.contentHint = 'detail'; // Optimize for text/fine details
    }

    return stream;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      console.log('User cancelled screen share');
    } else {
      console.error('Screen share error:', error);
      showError('Failed to start screen share');
    }
    return null;
  }
}
```

---

### Issue 4: High Latency / Lag

**Symptoms:**
- Delay between speaking and others hearing (>500ms)
- Choppy video
- Audio cutouts

**Diagnostic Steps:**

```javascript
// Collect WebRTC stats
async function diagnoseLatency(peerConnection: RTCPeerConnection) {
  const stats = await peerConnection.getStats();
  
  stats.forEach(report => {
    if (report.type === 'inbound-rtp' && report.kind === 'audio') {
      console.log('Audio jitter:', report.jitter);
      console.log('Packets lost:', report.packetsLost);
      console.log('Packets received:', report.packetsReceived);
    }
    
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      console.log('RTT (Round Trip Time):', report.currentRoundTripTime);
      console.log('Available outgoing bitrate:', report.availableOutgoingBitrate);
    }
  });
}

// Target values:
// RTT < 100ms (excellent), < 300ms (acceptable), >500ms (poor)
// Jitter < 30ms (excellent), < 50ms (acceptable), >100ms (poor)
// Packet loss < 1% (excellent), < 3% (acceptable), >5% (poor)
```

**Solutions:**

```typescript
// Solution A: Implement adaptive bitrate
class BitrateController {
  private currentBitrate = 1000000; // Start at 1 Mbps
  private readonly MIN_BITRATE = 300000; // 300 kbps
  private readonly MAX_BITRATE = 2500000; // 2.5 Mbps

  async adjustBitrate(stats: RTCStatsReport) {
    let packetsLost = 0;
    let packetsReceived = 0;
    let rtt = 0;

    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        packetsLost += report.packetsLost || 0;
        packetsReceived += report.packetsReceived || 0;
      }
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        rtt = report.currentRoundTripTime * 1000; // Convert to ms
      }
    });

    const packetLossRate = packetsLost / (packetsLost + packetsReceived);

    // Decrease bitrate if quality is poor
    if (packetLossRate > 0.05 || rtt > 300) {
      this.currentBitrate = Math.max(
        this.currentBitrate * 0.8,
        this.MIN_BITRATE
      );
      console.log('Decreasing bitrate to', this.currentBitrate);
    }
    // Increase bitrate if quality is good
    else if (packetLossRate < 0.01 && rtt < 100) {
      this.currentBitrate = Math.min(
        this.currentBitrate * 1.1,
        this.MAX_BITRATE
      );
      console.log('Increasing bitrate to', this.currentBitrate);
    }

    // Apply new bitrate
    await this.applyBitrate(this.currentBitrate);
  }

  private async applyBitrate(bitrate: number) {
    // Apply to senders
    const senders = peerConnection.getSenders();
    for (const sender of senders) {
      if (sender.track?.kind === 'video') {
        const parameters = sender.getParameters();
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = bitrate;
        await sender.setParameters(parameters);
      }
    }
  }
}

// Solution B: Server-side layer switching
export class WebRTCService {
  static async optimizeConsumerLayers(meetingId: string) {
    const consumers = this.getConsumersByMeeting(meetingId);

    for (const consumer of consumers) {
      if (consumer.kind !== 'video') continue;

      const stats = await consumer.getStats();
      let packetLoss = 0;
      let bitrate = 0;

      for (const stat of stats.values()) {
        if (stat.type === 'inbound-rtp') {
          packetLoss = stat.fractionLost || 0;
          bitrate = stat.bytesReceived * 8 / stat.timestamp; // bps
        }
      }

      // Switch to lower layer if poor quality
      if (packetLoss > 0.05 || bitrate < 400000) {
        const currentLayer = consumer.preferredLayers?.spatialLayer || 2;
        if (currentLayer > 0) {
          await consumer.setPreferredLayers({
            spatialLayer: currentLayer - 1,
            temporalLayer: 2
          });
          MeetingLogger.info('layer_downgrade', {
            consumer_id: consumer.id,
            new_layer: currentLayer - 1
          });
        }
      }
    }
  }
}
```

---

## ⚡ Performance Troubleshooting

### Issue 5: High CPU Usage on Server

**Symptoms:**
- CPU usage >80% sustained
- Slow API responses
- Meeting join failures

**Diagnostic Steps:**

```bash
# 1. Check mediasoup worker CPU
pm2 list
pm2 monit

# 2. Check process stats
top -p $(pgrep -f mediasoup)

# 3. Profile application
node --prof index.js
# Generate report after stopping
node --prof-process isolate-*.log > profile.txt
```

**Solutions:**

```typescript
// Solution A: Worker load balancing
export class WebRTCService {
  static async getOptimalWorker(): Promise<mediasoup.types.Worker> {
    const workerMetrics = await Promise.all(
      this.workers.map(async (worker, index) => {
        const usage = await worker.getResourceUsage();
        const routerCount = this.getRouterCount(worker);
        
        return {
          worker,
          index,
          cpuUsage: usage.ru_utime + usage.ru_stime,
          routerCount,
          score: (usage.ru_utime + usage.ru_stime) + (routerCount * 100)
        };
      })
    );

    // Sort by score (lower is better)
    workerMetrics.sort((a, b) => a.score - b.score);

    const optimal = workerMetrics[0];
    
    MeetingLogger.info('worker_selected', {
      worker_index: optimal.index,
      cpu_usage: optimal.cpuUsage,
      router_count: optimal.routerCount
    });

    return optimal.worker;
  }

  // Periodically rebalance meetings
  static async rebalanceMeetings() {
    const meetings = Array.from(this.routers.keys());
    
    for (const meetingId of meetings) {
      const router = this.routers.get(meetingId);
      if (!router) continue;

      const worker = router.observer as any;
      const usage = await worker.getResourceUsage();

      // If worker is overloaded, migrate meeting
      if (usage.ru_utime + usage.ru_stime > 0.8) {
        await this.migrateMeeting(meetingId);
      }
    }
  }
}

// Solution B: Limit concurrent meetings per worker
export class MeetingService {
  static readonly MAX_MEETINGS_PER_WORKER = 50;

  static async createMeeting(data: CreateMeetingDTO): Promise<Meeting> {
    // Check capacity before creating
    const availableWorker = await WebRTCService.getAvailableWorker();
    if (!availableWorker) {
      throw new Error('No available workers, system at capacity');
    }

    // ... rest of creation logic
  }
}
```

---

### Issue 6: Memory Leaks

**Symptoms:**
- Memory usage grows over time
- Eventually crashes with OOM
- Slowness after hours of operation

**Diagnostic Steps:**

```bash
# 1. Monitor memory usage
pm2 monit

# 2. Take heap snapshot
node --inspect index.js
# Connect Chrome DevTools > Memory > Take Snapshot

# 3. Check for leaked event listeners
# In code:
process.getMaxListeners()
EventEmitter.listenerCount(emitter, 'event_name')
```

**Solutions:**

```typescript
// Solution A: Proper cleanup on disconnect
export class MeetingSocketService {
  private socketMeetingMap = new Map<string, string>(); // socket.id -> meeting_id

  private async handleDisconnect(socket: Socket): Promise<void> {
    try {
      const meetingId = this.socketMeetingMap.get(socket.id);
      if (!meetingId) return;

      // 1. Close all producers/consumers
      await this.cleanupWebRTC(socket, meetingId);

      // 2. Remove from participant list
      await ParticipantService.removeParticipant(meetingId, socket.data.user_id);

      // 3. Notify others
      socket.to(meetingId).emit('participant:left', {
        user_id: socket.data.user_id,
        reason: 'disconnected'
      });

      // 4. Clean up maps
      this.socketMeetingMap.delete(socket.id);

      // 5. Remove all listeners
      socket.removeAllListeners();

      MeetingLogger.info('disconnect_cleanup_complete', {
        socket_id: socket.id,
        meeting_id: meetingId
      });
    } catch (error) {
      MeetingLogger.error('disconnect_cleanup_failed', error);
    }
  }

  private async cleanupWebRTC(socket: Socket, meetingId: string): Promise<void> {
    // Close all producers for this socket
    const producers = WebRTCService.getProducersBySocket(socket.id);
    await Promise.all(
      producers.map(producer => {
        producer.close();
        WebRTCService.producers.delete(producer.id);
      })
    );

    // Close all consumers
    const consumers = WebRTCService.getConsumersBySocket(socket.id);
    await Promise.all(
      consumers.map(consumer => {
        consumer.close();
        WebRTCService.consumers.delete(consumer.id);
      })
    );

    // Close transports
    const transports = WebRTCService.getTransportsBySocket(socket.id);
    await Promise.all(
      transports.map(transport => {
        transport.close();
        WebRTCService.transports.delete(transport.id);
      })
    );
  }
}

// Solution B: Periodic garbage collection
export class CleanupService {
  static startPeriodicCleanup(): void {
    // Run cleanup every 30 minutes
    setInterval(() => {
      this.cleanupStaleConnections();
      this.cleanupOldMeetings();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        MeetingLogger.info('garbage_collection_triggered');
      }
    }, 30 * 60 * 1000);
  }

  static async cleanupStaleConnections(): Promise<void> {
    const now = Date.now();
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    // Clean up transports with no recent activity
    for (const [transportId, transport] of WebRTCService.transports) {
      const lastActivity = transport.appData?.lastActivity || 0;
      if (now - lastActivity > STALE_THRESHOLD) {
        MeetingLogger.warn('closing_stale_transport', { transport_id: transportId });
        transport.close();
        WebRTCService.transports.delete(transportId);
      }
    }
  }
}
```

---

## 🌐 Network Issues

### Issue 7: Connections Failing (Firewall/NAT)

**Symptoms:**
- "ICE connection failed" errors
- Works on some networks, fails on others
- Corporate/school networks particularly affected

**Diagnostic Steps:**

```javascript
// Check ICE gathering
pc.addEventListener('icegatheringstatechange', () => {
  console.log('ICE gathering state:', pc.iceGatheringState);
});

pc.addEventListener('icecandidate', event => {
  if (event.candidate) {
    console.log('ICE candidate:', event.candidate.type, event.candidate.protocol);
  }
});

// After gathering complete, check candidates
const stats = await pc.getStats();
stats.forEach(report => {
  if (report.type === 'local-candidate') {
    console.log('Local candidate:', report.candidateType, report.protocol);
  }
  if (report.type === 'remote-candidate') {
    console.log('Remote candidate:', report.candidateType, report.protocol);
  }
});

// Expected: Should see 'host', 'srflx' (STUN), and possibly 'relay' (TURN) candidates
```

**Solutions:**

```typescript
// Solution A: Comprehensive ICE configuration
const iceConfig: RTCConfiguration = {
  iceServers: [
    // STUN servers (public)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    
    // TURN servers (fallback) with credentials
    {
      urls: [
        'turn:turn.example.com:3478?transport=udp',
        'turn:turn.example.com:3478?transport=tcp',
        'turns:turn.example.com:5349?transport=tcp' // TLS for corporate
      ],
      username: 'user',
      credential: 'pass'
    }
  ],
  iceTransportPolicy: 'all', // Use all candidates (host, srflx, relay)
  iceCandidatePoolSize: 10, // Pre-gather candidates
  bundlePolicy: 'max-bundle', // Bundle media for better NAT traversal
  rtcpMuxPolicy: 'require' // Multiplex RTP and RTCP
};

// Solution B: TURN credential generation (server-side)
export class TURNService {
  static generateCredentials(userId: string): RTCIceServer {
    const secret = process.env.TURN_SECRET;
    const ttl = 24 * 3600; // 24 hours
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${timestamp}:${userId}`;
    
    // Generate HMAC
    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(username);
    const credential = hmac.digest('base64');

    return {
      urls: [
        `turn:${process.env.TURN_SERVER}:3478?transport=udp`,
        `turn:${process.env.TURN_SERVER}:3478?transport=tcp`,
        `turns:${process.env.TURN_SERVER}:5349?transport=tcp`
      ],
      username,
      credential
    };
  }
}
```

---

### Issue 8: High Bandwidth Usage / Costs

**Symptoms:**
- Expensive TURN server bills
- Users complaining about data usage
- Network congestion

**Solutions:**

```typescript
// Solution A: Optimize TURN usage
export class TURNOptimizer {
  static async monitorTURNUsage(meetingId: string): Promise<void> {
    const consumers = WebRTCService.getConsumersByMeeting(meetingId);

    for (const consumer of consumers) {
      const stats = await consumer.getStats();
      
      for (const report of stats.values()) {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const localCandidate = stats.get(report.localCandidateId);
          const remoteCandidate = stats.get(report.remoteCandidateId);

          // Check if using TURN relay
          if (localCandidate?.candidateType === 'relay' || 
              remoteCandidate?.candidateType === 'relay') {
            MeetingLogger.warn('turn_relay_in_use', {
              meeting_id: meetingId,
              consumer_id: consumer.id,
              bytes_sent: report.bytesSent,
              bytes_received: report.bytesReceived
            });

            // Alert if high TURN usage
            if ((report.bytesSent + report.bytesReceived) > 100 * 1024 * 1024) {
              await this.alertHighTURNUsage(meetingId, consumer.id);
            }
          }
        }
      }
    }
  }

  // Try to renegotiate without TURN if possible
  static async optimizeConnection(consumerId: string): Promise<void> {
    // Trigger ICE restart to attempt direct connection
    const consumer = WebRTCService.consumers.get(consumerId);
    if (consumer) {
      // mediasoup doesn't directly support ICE restart, but you can:
      // 1. Close current consumer
      // 2. Create new consumer with same producer
      // This will trigger new ICE gathering
    }
  }
}

// Solution B: Bandwidth-aware quality control
export class BandwidthManager {
  static async adjustQualityForBandwidth(meetingId: string): Promise<void> {
    const consumers = WebRTCService.getConsumersByMeeting(meetingId);
    const participantCount = consumers.length;

    for (const consumer of consumers) {
      if (consumer.kind !== 'video') continue;

      const stats = await consumer.getStats();
      let availableBitrate = 0;

      for (const report of stats.values()) {
        if (report.type === 'candidate-pair') {
          availableBitrate = report.availableOutgoingBitrate || 0;
        }
      }

      // Calculate fair share
      const fairShare = availableBitrate / participantCount;

      // Select appropriate layer
      let targetLayer = 2; // High quality by default
      if (fairShare < 300000) {
        targetLayer = 0; // Low quality
      } else if (fairShare < 700000) {
        targetLayer = 1; // Medium quality
      }

      await consumer.setPreferredLayers({
        spatialLayer: targetLayer,
        temporalLayer: 2
      });
    }
  }
}
```

---

## 📊 Monitoring & Alerting

### Health Check Endpoints

```typescript
// controllers/health.controller.ts
export class HealthController {
  /**
   * WebRTC health check
   */
  static async checkWebRTC(ctx: Context) {
    try {
      const status = WebRTCService.getStatus();
      
      const health = {
        status: status.available ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        workers: {
          total: status.workers,
          active: status.workers
        },
        routers: status.routers,
        active_rooms: status.activeRooms,
        details: await Promise.all(
          WebRTCService.workers.map(async (worker, index) => {
            const usage = await worker.getResourceUsage();
            return {
              worker_index: index,
              pid: worker.pid,
              cpu_usage: usage.ru_utime + usage.ru_stime,
              memory_mb: (usage.ru_maxrss / 1024).toFixed(2)
            };
          })
        )
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      return ctx.json(health, statusCode);
    } catch (error) {
      return ctx.json({
        status: 'unhealthy',
        error: error.message
      }, 503);
    }
  }

  /**
   * Meeting system health
   */
  static async checkMeetingSystem(ctx: Context) {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkWebRTCWorkers(),
      this.checkTURNServers()
    ]);

    const results = checks.map((check, index) => ({
      name: ['database', 'redis', 'webrtc', 'turn'][index],
      status: check.status === 'fulfilled' ? 'pass' : 'fail',
      details: check.status === 'fulfilled' ? check.value : check.reason
    }));

    const allHealthy = results.every(r => r.status === 'pass');

    return ctx.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: results
    }, allHealthy ? 200 : 503);
  }
}
```

---

## ✅ Optimization Checklist

### Server-Side Optimizations

- [ ] **Enable HTTP/2** for better multiplexing
- [ ] **Use Connection Pooling** for database connections
- [ ] **Implement Redis Caching** for hot data (meetings, participants)
- [ ] **Enable Gzip/Brotli Compression** for API responses
- [ ] **Use CDN** for static assets and recordings
- [ ] **Optimize Database Queries** (indexes, projections, batching)
- [ ] **Load Balance** Socket.IO with Redis adapter
- [ ] **Horizontal Scale** mediasoup workers across multiple machines
- [ ] **Monitor & Alert** on CPU, memory, network, error rates
- [ ] **Log Aggregation** (ELK, Loki) for troubleshooting

### WebRTC Optimizations

- [ ] **Enable Simulcast** for video producers
- [ ] **Implement Adaptive Bitrate** based on network conditions
- [ ] **Use VP9 Codec** for screen sharing (better compression)
- [ ] **Configure TURN Properly** with UDP, TCP, and TLS options
- [ ] **Implement Layer Switching** on server side
- [ ] **Monitor Packet Loss** and adjust quality
- [ ] **Use Hardware Encoding** when available (NVENC, Quick Sync)
- [ ] **Limit Frame Rate** on mobile to 15-20 FPS
- [ ] **Pause Video** when participant is off-screen
- [ ] **Implement Bandwidth Estimation** and probing

### Client-Side Optimizations

- [ ] **Pre-fetch WebRTC Config** before join
- [ ] **Implement Reconnection Logic** with exponential backoff
- [ ] **Use Web Workers** for CPU-intensive tasks
- [ ] **Lazy Load** non-critical features
- [ ] **Optimize React Renders** (useMemo, useCallback)
- [ ] **Implement Virtual Scrolling** for large participant lists
- [ ] **Debounce/Throttle** frequent events (typing, mouse move)
- [ ] **Use RequestAnimationFrame** for smooth animations
- [ ] **Implement Error Boundaries** for graceful failures
- [ ] **Monitor Performance** with Web Vitals

### Security Optimizations

- [ ] **Rate Limit** all API endpoints
- [ ] **Validate All Inputs** with Zod or Joi
- [ ] **Use HTTPS/WSS** everywhere
- [ ] **Implement CORS** properly
- [ ] **Rotate JWT Secrets** regularly
- [ ] **Hash Passwords** with bcrypt (cost factor 12+)
- [ ] **Sanitize Outputs** to prevent XSS
- [ ] **Use Prepared Statements** to prevent SQL injection
- [ ] **Implement RBAC** for fine-grained permissions
- [ ] **Audit Logs** for sensitive operations

---

## 📝 Conclusion

This troubleshooting guide covers the most common issues encountered in production meeting systems. Key takeaways:

1. **Monitor Proactively**: Don't wait for users to report issues
2. **Log Extensively**: Structured logs are invaluable for debugging
3. **Test Edge Cases**: Poor networks, many participants, long meetings
4. **Optimize Iteratively**: Measure, optimize, measure again
5. **Plan for Failure**: Implement graceful degradation and recovery

Keep this guide updated as you encounter and solve new issues in production.

---

**Last Updated:** November 3, 2025  
**Version:** 2.0  
**Maintainer:** KCS Development Team
