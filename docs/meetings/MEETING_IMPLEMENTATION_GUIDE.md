# Meeting System - Implementation Best Practices Guide

**Version:** 2.0  
**Last Updated:** November 3, 2025  
**Purpose:** Clean code practices, optimization patterns, and implementation guidelines

---

## 🎯 Table of Contents

1. [Code Organization](#code-organization)
2. [Service Layer Best Practices](#service-layer-best-practices)
3. [WebSocket Event Handling](#websocket-event-handling)
4. [WebRTC Service Optimization](#webrtc-service-optimization)
5. [Error Handling](#error-handling)
6. [Performance Patterns](#performance-patterns)
7. [Testing Strategy](#testing-strategy)
8. [Security Patterns](#security-patterns)

---

## 📁 Code Organization

### Project Structure

```
src/
├── controllers/
│   └── meeting.controller.ts       # HTTP endpoint handlers
├── services/
│   ├── meeting.service.ts          # Core meeting business logic
│   ├── webrtc.service.ts           # mediasoup wrapper & management
│   ├── socket.meeting.service.ts   # Meeting-specific WebSocket handlers
│   └── recording.service.ts        # Recording management
├── models/
│   ├── meeting.model.ts            # Meeting database schema
│   └── participant.model.ts        # Participant schema
├── middleware/
│   ├── auth.middleware.ts          # JWT validation
│   ├── meeting-access.middleware.ts # Meeting permission checks
│   └── rate-limit.middleware.ts    # Rate limiting
├── routes/
│   └── meeting.route.ts            # Route definitions
├── types/
│   ├── meeting.types.ts            # TypeScript interfaces
│   └── webrtc.types.ts             # WebRTC type definitions
├── utils/
│   ├── meeting-error.util.ts       # Error classes & handlers
│   ├── meeting-logger.util.ts      # Structured logging
│   └── meeting-validator.util.ts   # Input validation
└── config/
    ├── mediasoup.config.ts         # mediasoup configuration
    └── meeting.config.ts           # Meeting constants
```

---

## 🏗️ Service Layer Best Practices

### 1. Meeting Service Pattern

**❌ Bad: Monolithic Service**
```typescript
// DON'T: Everything in one giant class
class MeetingService {
  static async createMeeting(...) { /* 500 lines */ }
  static async startMeeting(...) { /* 300 lines */ }
  static async handleParticipant(...) { /* 400 lines */ }
  // ... 5000 lines total
}
```

**✅ Good: Single Responsibility Services**
```typescript
// meeting.service.ts - Core CRUD
export class MeetingService {
  static async create(data: CreateMeetingDTO): Promise<Meeting> {
    const meeting = await this.buildMeeting(data);
    await this.saveMeeting(meeting);
    await this.notifyParticipants(meeting);
    return meeting;
  }

  private static async buildMeeting(data: CreateMeetingDTO): Promise<Meeting> {
    // Building logic only
  }

  private static async saveMeeting(meeting: Meeting): Promise<void> {
    // Database logic only
  }
}

// participant.service.ts - Participant management
export class ParticipantService {
  static async addToMeeting(meetingId: string, users: User[]): Promise<void> {
    // Participant logic only
  }
}

// recording.service.ts - Recording management
export class RecordingService {
  static async startRecording(meetingId: string): Promise<Recording> {
    // Recording logic only
  }
}
```

---

### 2. Clean Method Design

**✅ Follow SOLID Principles**

```typescript
// Single Responsibility: One method, one purpose
class MeetingService {
  // ✅ GOOD: Clear, focused responsibility
  static async validateMeetingAccess(
    userId: string, 
    meetingId: string
  ): Promise<boolean> {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new MeetingNotFoundError(meetingId);
    
    const participant = meeting.participants.find(p => p.user_id === userId);
    return !!participant;
  }

  // ✅ GOOD: Separation of concerns
  static async createMeeting(data: CreateMeetingDTO): Promise<Meeting> {
    // Validation
    await this.validateMeetingData(data);
    
    // Creation
    const meeting = await this.buildMeeting(data);
    
    // Persistence
    await this.saveMeeting(meeting);
    
    // Side effects
    await this.triggerSideEffects(meeting);
    
    return meeting;
  }

  // ❌ BAD: Mixed concerns
  static async createMeetingBad(data: any): Promise<any> {
    // Validation, DB save, email, push notifications, 
    // WebRTC setup, analytics all mixed in 200 lines
  }
}
```

---

### 3. Data Transfer Objects (DTOs)

**✅ Use Strong Typing**

```typescript
// types/meeting.dto.ts
export interface CreateMeetingDTO {
  readonly meeting_name: string;
  readonly meeting_description: string;
  readonly meeting_start_time: Date;
  readonly meeting_end_time: Date;
  readonly participants: string[];
  readonly features?: MeetingFeaturesDTO;
}

export interface MeetingFeaturesDTO {
  readonly video_enabled: boolean;
  readonly audio_enabled: boolean;
  readonly screen_sharing_enabled: boolean;
  readonly recording_enabled: boolean;
}

// Validation helper
export class MeetingValidator {
  static validateCreateDTO(dto: CreateMeetingDTO): ValidationResult {
    const errors: string[] = [];

    if (!dto.meeting_name || dto.meeting_name.trim().length === 0) {
      errors.push('Meeting name is required');
    }

    if (dto.meeting_start_time >= dto.meeting_end_time) {
      errors.push('End time must be after start time');
    }

    if (dto.participants.length === 0) {
      errors.push('At least one participant is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

---

## 🔌 WebSocket Event Handling

### 1. Event Handler Pattern

**✅ Clean Event Architecture**

```typescript
// socket.meeting.service.ts
import { Server, Socket } from 'socket.io';
import { MeetingEvents } from './types/meeting-events';

export class MeetingSocketService {
  private io: Server;
  
  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Register all meeting-related socket handlers
   */
  public registerHandlers(socket: Socket): void {
    // Room events
    socket.on(MeetingEvents.ROOM_JOIN, (data) => this.handleRoomJoin(socket, data));
    socket.on(MeetingEvents.ROOM_LEAVE, (data) => this.handleRoomLeave(socket, data));
    
    // Media events
    socket.on(MeetingEvents.MEDIA_TOGGLE, (data) => this.handleMediaToggle(socket, data));
    socket.on(MeetingEvents.SCREEN_START, (data) => this.handleScreenStart(socket, data));
    
    // Participant events
    socket.on(MeetingEvents.HAND_RAISE, (data) => this.handleHandRaise(socket, data));
    socket.on(MeetingEvents.REACTION_SEND, (data) => this.handleReaction(socket, data));
    
    // Cleanup
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * Handle room join with complete error handling
   */
  private async handleRoomJoin(
    socket: Socket, 
    data: JoinRoomPayload
  ): Promise<void> {
    try {
      // 1. Validate input
      const validation = this.validateJoinData(data);
      if (!validation.isValid) {
        socket.emit(MeetingEvents.ERROR, { 
          code: 'INVALID_DATA', 
          message: validation.errors 
        });
        return;
      }

      // 2. Authenticate user
      const user = await this.authenticateSocket(socket);
      if (!user) {
        socket.emit(MeetingEvents.ERROR, { 
          code: 'UNAUTHORIZED', 
          message: 'Authentication required' 
        });
        return;
      }

      // 3. Check meeting access
      const hasAccess = await MeetingService.validateAccess(user.id, data.meeting_id);
      if (!hasAccess) {
        socket.emit(MeetingEvents.ERROR, { 
          code: 'FORBIDDEN', 
          message: 'You do not have access to this meeting' 
        });
        return;
      }

      // 4. Join room
      const meeting = await MeetingService.findById(data.meeting_id);
      await socket.join(data.meeting_id);

      // 5. Update participant list
      await ParticipantService.addParticipant(data.meeting_id, user.id);

      // 6. Emit success to joiner
      socket.emit(MeetingEvents.ROOM_JOINED, {
        meeting,
        participants: meeting.participants,
        your_role: this.getUserRole(meeting, user.id)
      });

      // 7. Notify others
      socket.to(data.meeting_id).emit(MeetingEvents.PARTICIPANT_JOINED, {
        user_id: user.id,
        display_name: user.display_name,
        role: this.getUserRole(meeting, user.id)
      });

      // 8. Log event
      MeetingLogger.info('participant_joined', {
        meeting_id: data.meeting_id,
        user_id: user.id,
        socket_id: socket.id
      });

    } catch (error) {
      this.handleError(socket, 'room:join', error);
    }
  }

  /**
   * Centralized error handler
   */
  private handleError(socket: Socket, event: string, error: any): void {
    MeetingLogger.error(`Error in ${event}`, error);
    
    socket.emit(MeetingEvents.ERROR, {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      event
    });
  }
}
```

---

### 2. Event Constants

**✅ Centralized Event Definitions**

```typescript
// types/meeting-events.ts
export const MeetingEvents = {
  // Room Management
  ROOM_CREATE: 'room:create',
  ROOM_CREATED: 'room:created',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_LEAVE: 'room:leave',
  ROOM_LEFT: 'room:left',
  ROOM_CLOSE: 'room:close',
  ROOM_CLOSED: 'room:closed',
  
  // Participants
  PARTICIPANT_JOINED: 'participant:joined',
  PARTICIPANT_LEFT: 'participant:left',
  PARTICIPANT_UPDATED: 'participant:updated',
  
  // Media Control
  MEDIA_TOGGLE: 'media:toggle',
  MEDIA_UPDATED: 'media:updated',
  SCREEN_START: 'screen:start',
  SCREEN_STOP: 'screen:stop',
  SCREEN_STARTED: 'screen:started',
  SCREEN_STOPPED: 'screen:stopped',
  
  // WebRTC Signaling
  TRANSPORT_CREATE: 'transport:create',
  TRANSPORT_CREATED: 'transport:created',
  TRANSPORT_CONNECT: 'transport:connect',
  PRODUCE: 'produce',
  PRODUCER_CREATED: 'producer:created',
  CONSUME: 'consume',
  CONSUMER_CREATED: 'consumer:created',
  
  // Errors
  ERROR: 'error'
} as const;

export type MeetingEventType = typeof MeetingEvents[keyof typeof MeetingEvents];
```

---

## 🎥 WebRTC Service Optimization

### 1. Worker Pool Management

**✅ Efficient Worker Distribution**

```typescript
// services/webrtc.service.ts
export class WebRTCService {
  private static workers: mediasoup.types.Worker[] = [];
  private static workerIndex = 0;
  private static roomWorkerMap = new Map<string, number>();

  /**
   * Get next available worker using round-robin
   */
  private static getNextWorker(): mediasoup.types.Worker {
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;
    return worker;
  }

  /**
   * Get worker by load (CPU-aware distribution)
   */
  private static async getLeastLoadedWorker(): Promise<mediasoup.types.Worker> {
    const workerLoads = await Promise.all(
      this.workers.map(async (worker, index) => ({
        worker,
        index,
        load: await this.getWorkerLoad(worker)
      }))
    );

    // Sort by load and return least loaded
    workerLoads.sort((a, b) => a.load - b.load);
    return workerLoads[0].worker;
  }

  /**
   * Calculate worker load score
   */
  private static async getWorkerLoad(worker: mediasoup.types.Worker): Promise<number> {
    const usage = await worker.getResourceUsage();
    // Simple load metric: combine CPU and router count
    const cpuLoad = usage.ru_utime + usage.ru_stime;
    const routerCount = (worker as any)._routers?.size || 0;
    return cpuLoad + (routerCount * 0.1);
  }

  /**
   * Create router for meeting with worker affinity
   */
  public static async createMeetingRouter(
    meetingId: string
  ): Promise<mediasoup.types.Router> {
    // Check if router already exists
    const existingRouter = this.routers.get(meetingId);
    if (existingRouter) return existingRouter;

    // Select worker
    const worker = await this.getLeastLoadedWorker();
    const workerIndex = this.workers.indexOf(worker);
    
    // Store worker mapping
    this.roomWorkerMap.set(meetingId, workerIndex);

    // Create router
    const router = await worker.createRouter({
      mediaCodecs: this.MEDIA_CODECS
    });

    this.routers.set(meetingId, router);

    MeetingLogger.info('router_created', {
      meeting_id: meetingId,
      worker_pid: worker.pid,
      worker_index: workerIndex
    });

    return router;
  }

  /**
   * Get router for existing meeting (ensures worker affinity)
   */
  public static async getRouter(meetingId: string): Promise<mediasoup.types.Router> {
    const router = this.routers.get(meetingId);
    if (!router) {
      throw new Error(`Router not found for meeting: ${meetingId}`);
    }
    return router;
  }
}
```

---

### 2. Transport Management

**✅ Proper Transport Lifecycle**

```typescript
export class WebRTCService {
  /**
   * Create WebRTC transport with proper configuration
   */
  public static async createTransport(
    meetingId: string,
    direction: 'send' | 'recv'
  ): Promise<TransportData> {
    const router = await this.getRouter(meetingId);

    // Create transport with optimized settings
    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP
        }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000, // 1 Mbps initial
      minimumAvailableOutgoingBitrate: 600000,  // 600 kbps minimum
      maxSctpMessageSize: 262144, // 256 KB for data channels
      enableSctp: direction === 'send' // Only for send transport
    });

    // Store transport with composite key
    const transportKey = `${meetingId}:${transport.id}`;
    this.transports.set(transportKey, transport);
    this.transportIdMap.set(transport.id, transportKey);

    // Handle transport close
    transport.on('routerclose', () => {
      this.transports.delete(transportKey);
      this.transportIdMap.delete(transport.id);
    });

    // Monitor transport stats
    this.monitorTransport(transport, meetingId);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: direction === 'send' ? transport.sctpParameters : undefined
    };
  }

  /**
   * Monitor transport performance
   */
  private static monitorTransport(
    transport: mediasoup.types.Transport,
    meetingId: string
  ): void {
    const interval = setInterval(async () => {
      if (transport.closed) {
        clearInterval(interval);
        return;
      }

      const stats = await transport.getStats();
      // Process and log stats
      for (const stat of stats.values()) {
        if (stat.type === 'transport') {
          MeetingLogger.debug('transport_stats', {
            meeting_id: meetingId,
            transport_id: transport.id,
            bytes_sent: stat.bytesSent,
            bytes_received: stat.bytesReceived,
            // Additional stats...
          });
        }
      }
    }, 10000); // Every 10 seconds
  }
}
```

---

### 3. Simulcast Implementation

**✅ Proper Simulcast Configuration**

```typescript
export class WebRTCService {
  /**
   * Create producer with simulcast enabled
   */
  public static async createProducer(
    transportId: string,
    kind: 'audio' | 'video',
    rtpParameters: mediasoup.types.RtpParameters,
    appData?: any
  ): Promise<mediasoup.types.Producer> {
    const transport = this.getTransportById(transportId);
    if (!transport) {
      throw new Error('Transport not found');
    }

    // Configure simulcast for video
    const producerOptions: mediasoup.types.ProducerOptions = {
      kind,
      rtpParameters
    };

    if (kind === 'video') {
      // Enable simulcast with 3 layers
      producerOptions.encodings = [
        { maxBitrate: 100000, scaleResolutionDownBy: 4 },  // Low: 180p
        { maxBitrate: 300000, scaleResolutionDownBy: 2 },  // Medium: 360p
        { maxBitrate: 900000, scaleResolutionDownBy: 1 }   // High: 720p
      ];
    }

    if (appData) {
      producerOptions.appData = appData;
    }

    const producer = await transport.produce(producerOptions);

    // Store producer
    this.producers.set(producer.id, producer);

    // Monitor producer
    this.monitorProducer(producer);

    return producer;
  }

  /**
   * Create consumer with appropriate quality layer
   */
  public static async createConsumer(
    consumerTransportId: string,
    producerId: string,
    rtpCapabilities: mediasoup.types.RtpCapabilities,
    preferredLayer?: number
  ): Promise<mediasoup.types.Consumer> {
    const producer = this.producers.get(producerId);
    if (!producer) {
      throw new Error('Producer not found');
    }

    const transport = this.getTransportById(consumerTransportId);
    if (!transport) {
      throw new Error('Consumer transport not found');
    }

    const router = producer.router;

    // Check if router can consume
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Cannot consume');
    }

    // Create consumer
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true, // Start paused, client will resume
      preferredLayers: producer.kind === 'video' && preferredLayer !== undefined
        ? { spatialLayer: preferredLayer, temporalLayer: 2 }
        : undefined
    });

    // Store consumer
    this.consumers.set(consumer.id, consumer);

    // Monitor consumer
    this.monitorConsumer(consumer);

    return consumer;
  }

  /**
   * Dynamically adjust consumer layers based on bandwidth
   */
  public static async adjustConsumerLayers(
    consumerId: string,
    availableBandwidth: number
  ): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    if (!consumer || consumer.kind !== 'video') return;

    let targetLayer: number;

    // Simple bandwidth-based layer selection
    if (availableBandwidth > 800000) {
      targetLayer = 2; // High quality
    } else if (availableBandwidth > 400000) {
      targetLayer = 1; // Medium quality
    } else {
      targetLayer = 0; // Low quality
    }

    await consumer.setPreferredLayers({
      spatialLayer: targetLayer,
      temporalLayer: 2
    });

    MeetingLogger.info('layer_adjusted', {
      consumer_id: consumerId,
      target_layer: targetLayer,
      bandwidth: availableBandwidth
    });
  }
}
```

---

## ⚠️ Error Handling

### 1. Custom Error Classes

**✅ Structured Error Hierarchy**

```typescript
// utils/meeting-error.util.ts
export class MeetingError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class MeetingNotFoundError extends MeetingError {
  constructor(meetingId: string) {
    super(
      `Meeting not found: ${meetingId}`,
      'MEETING_NOT_FOUND',
      404
    );
  }
}

export class MeetingAccessDeniedError extends MeetingError {
  constructor(userId: string, meetingId: string) {
    super(
      `User ${userId} does not have access to meeting ${meetingId}`,
      'ACCESS_DENIED',
      403
    );
  }
}

export class MeetingCapacityExceededError extends MeetingError {
  constructor(meetingId: string, maxCapacity: number) {
    super(
      `Meeting ${meetingId} has reached maximum capacity of ${maxCapacity}`,
      'CAPACITY_EXCEEDED',
      409
    );
  }
}

export class WebRTCTransportError extends MeetingError {
  constructor(message: string) {
    super(message, 'WEBRTC_TRANSPORT_ERROR', 500);
  }
}
```

---

### 2. Global Error Handler

**✅ Centralized Error Management**

```typescript
// middleware/error-handler.middleware.ts
import { Context } from 'hono';
import { MeetingError } from '../utils/meeting-error.util';
import { MeetingLogger } from '../utils/meeting-logger.util';

export async function errorHandler(err: Error, ctx: Context) {
  // Log error
  MeetingLogger.error('request_error', {
    error: err.message,
    stack: err.stack,
    path: ctx.req.path,
    method: ctx.req.method,
    user_id: ctx.get('user_id')
  });

  // Handle operational errors
  if (err instanceof MeetingError && err.isOperational) {
    return ctx.json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    }, err.statusCode);
  }

  // Handle unexpected errors
  return ctx.json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  }, 500);
}

// Usage in routes
app.onError(errorHandler);
```

---

## ⚡ Performance Patterns

### 1. Database Query Optimization

**✅ Efficient Queries**

```typescript
export class MeetingService {
  /**
   * ❌ BAD: N+1 query problem
   */
  static async getMeetingsWithParticipantsBad(userId: string): Promise<Meeting[]> {
    const meetings = await Meeting.find({ creator_id: userId });
    
    for (const meeting of meetings) {
      // N additional queries!
      meeting.participants = await Participant.find({ meeting_id: meeting.id });
    }
    
    return meetings;
  }

  /**
   * ✅ GOOD: Single query with join
   */
  static async getMeetingsWithParticipants(userId: string): Promise<Meeting[]> {
    const meetings = await Meeting.find({ creator_id: userId })
      .populate('participants')
      .lean()
      .exec();
    
    return meetings;
  }

  /**
   * ✅ GOOD: Use projection to limit fields
   */
  static async getMeetingsSummary(userId: string): Promise<MeetingSummary[]> {
    return await Meeting.find({ creator_id: userId })
      .select('id meeting_name meeting_start_time meeting_status')
      .lean()
      .exec();
  }
}
```

---

### 2. Caching Strategy

**✅ Redis Caching for Hot Data**

```typescript
// services/meeting-cache.service.ts
import { createClient, RedisClientType } from 'redis';

export class MeetingCacheService {
  private static client: RedisClientType;
  private static readonly TTL = {
    MEETING: 3600,      // 1 hour
    PARTICIPANT: 7200,  // 2 hours
    PRESENCE: 300       // 5 minutes
  };

  static async initialize(): Promise<void> {
    this.client = createClient({
      url: process.env.REDIS_URL
    });
    await this.client.connect();
  }

  /**
   * Cache meeting data
   */
  static async cacheMeeting(meeting: Meeting): Promise<void> {
    const key = `meeting:${meeting.id}`;
    await this.client.setEx(
      key,
      this.TTL.MEETING,
      JSON.stringify(meeting)
    );
  }

  /**
   * Get meeting from cache with fallback
   */
  static async getMeeting(meetingId: string): Promise<Meeting | null> {
    const key = `meeting:${meetingId}`;
    const cached = await this.client.get(key);
    
    if (cached) {
      MeetingLogger.debug('cache_hit', { meeting_id: meetingId });
      return JSON.parse(cached);
    }

    MeetingLogger.debug('cache_miss', { meeting_id: meetingId });
    
    // Fetch from database
    const meeting = await Meeting.findById(meetingId);
    if (meeting) {
      await this.cacheMeeting(meeting);
    }
    
    return meeting;
  }

  /**
   * Invalidate meeting cache
   */
  static async invalidateMeeting(meetingId: string): Promise<void> {
    const key = `meeting:${meetingId}`;
    await this.client.del(key);
  }

  /**
   * Store participant presence
   */
  static async setParticipantPresence(
    meetingId: string,
    userId: string,
    status: 'active' | 'away'
  ): Promise<void> {
    const key = `presence:${meetingId}:${userId}`;
    await this.client.setEx(key, this.TTL.PRESENCE, status);
  }

  /**
   * Get all active participants
   */
  static async getActiveParticipants(meetingId: string): Promise<string[]> {
    const pattern = `presence:${meetingId}:*`;
    const keys = await this.client.keys(pattern);
    
    const participants: string[] = [];
    for (const key of keys) {
      const status = await this.client.get(key);
      if (status === 'active') {
        const userId = key.split(':')[2];
        participants.push(userId);
      }
    }
    
    return participants;
  }
}
```

---

### 3. Parallel Operations

**✅ Use Promise.all for Independent Operations**

```typescript
export class MeetingService {
  /**
   * ❌ BAD: Sequential execution
   */
  static async createMeetingBad(data: CreateMeetingDTO): Promise<Meeting> {
    const meeting = await Meeting.create(data);
    await this.sendInvitations(meeting);      // Wait
    await this.setupWebRTC(meeting);          // Wait
    await this.sendPushNotifications(meeting); // Wait
    return meeting;
  }

  /**
   * ✅ GOOD: Parallel execution
   */
  static async createMeeting(data: CreateMeetingDTO): Promise<Meeting> {
    const meeting = await Meeting.create(data);
    
    // Execute independent operations in parallel
    await Promise.allSettled([
      this.sendInvitations(meeting),
      this.setupWebRTC(meeting),
      this.sendPushNotifications(meeting)
    ]);
    
    return meeting;
  }

  /**
   * ✅ GOOD: Batch operations
   */
  static async addMultipleParticipants(
    meetingId: string,
    userIds: string[]
  ): Promise<void> {
    // Batch database insert
    const participants = userIds.map(userId => ({
      meeting_id: meetingId,
      user_id: userId,
      role: 'attendee',
      joined_at: new Date()
    }));

    await Participant.insertMany(participants);

    // Parallel notifications
    await Promise.allSettled(
      userIds.map(userId => this.notifyParticipant(userId, meetingId))
    );
  }
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

**✅ Test Core Business Logic**

```typescript
// __tests__/services/meeting.service.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MeetingService } from '../../src/services/meeting.service';
import { Meeting } from '../../src/models/meeting.model';

describe('MeetingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeeting', () => {
    it('should create a meeting with valid data', async () => {
      const mockData = {
        meeting_name: 'Test Meeting',
        meeting_description: 'Description',
        meeting_start_time: new Date('2025-11-10T10:00:00Z'),
        meeting_end_time: new Date('2025-11-10T11:00:00Z'),
        participants: ['user1', 'user2'],
        features: {
          video_enabled: true,
          audio_enabled: true
        }
      };

      const meeting = await MeetingService.createMeeting('campus1', 'creator1', mockData);

      expect(meeting).toBeDefined();
      expect(meeting.meeting_name).toBe('Test Meeting');
      expect(meeting.participants).toHaveLength(2);
    });

    it('should throw error when end time is before start time', async () => {
      const mockData = {
        meeting_name: 'Test Meeting',
        meeting_start_time: new Date('2025-11-10T11:00:00Z'),
        meeting_end_time: new Date('2025-11-10T10:00:00Z'), // Before start!
        participants: ['user1']
      };

      await expect(
        MeetingService.createMeeting('campus1', 'creator1', mockData as any)
      ).rejects.toThrow();
    });
  });

  describe('validateAccess', () => {
    it('should return true for participant with access', async () => {
      const mockMeeting = {
        id: 'meeting1',
        participants: ['user1', 'user2']
      };

      jest.spyOn(Meeting, 'findById').mockResolvedValue(mockMeeting as any);

      const hasAccess = await MeetingService.validateAccess('user1', 'meeting1');
      expect(hasAccess).toBe(true);
    });

    it('should return false for user without access', async () => {
      const mockMeeting = {
        id: 'meeting1',
        participants: ['user1', 'user2']
      };

      jest.spyOn(Meeting, 'findById').mockResolvedValue(mockMeeting as any);

      const hasAccess = await MeetingService.validateAccess('user3', 'meeting1');
      expect(hasAccess).toBe(false);
    });
  });
});
```

---

### 2. Integration Tests

**✅ Test Complete Flows**

```typescript
// __tests__/integration/meeting-flow.test.ts
import { io as ioClient, Socket } from 'socket.io-client';
import { MeetingService } from '../../src/services/meeting.service';

describe('Meeting Flow Integration Tests', () => {
  let clientSocket: Socket;
  let serverUrl: string;

  beforeAll((done) => {
    serverUrl = `http://localhost:${process.env.PORT}/meeting`;
    done();
  });

  beforeEach((done) => {
    clientSocket = ioClient(serverUrl, {
      auth: { token: 'valid_jwt_token' }
    });
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
  });

  it('should complete full join meeting flow', (done) => {
    const meetingId = 'test_meeting_123';

    // Listen for success event
    clientSocket.on('room:joined', (data) => {
      expect(data.meeting_id).toBe(meetingId);
      expect(data.participants).toBeDefined();
      done();
    });

    // Emit join request
    clientSocket.emit('room:join', {
      meeting_id: meetingId,
      display_name: 'Test User'
    });
  });

  it('should broadcast participant join to others', (done) => {
    const meetingId = 'test_meeting_123';
    
    // Create second client
    const client2 = ioClient(serverUrl, {
      auth: { token: 'valid_jwt_token_2' }
    });

    client2.on('connect', () => {
      // Client 2 joins first
      client2.emit('room:join', { meeting_id: meetingId });

      // Wait for client 2 to join
      client2.on('room:joined', () => {
        // Client 2 listens for new participant
        client2.on('participant:joined', (data) => {
          expect(data.user_id).toBe('user1');
          client2.close();
          done();
        });

        // Client 1 joins
        clientSocket.emit('room:join', { meeting_id: meetingId });
      });
    });
  });
});
```

---

## 🔐 Security Patterns

### 1. Input Validation

**✅ Validate All Inputs**

```typescript
import { z } from 'zod';

export class MeetingValidator {
  static readonly createMeetingSchema = z.object({
    meeting_name: z.string()
      .min(1, 'Meeting name is required')
      .max(100, 'Meeting name too long')
      .trim(),
    meeting_description: z.string()
      .max(500, 'Description too long')
      .optional(),
    meeting_start_time: z.string()
      .datetime('Invalid start time'),
    meeting_end_time: z.string()
      .datetime('Invalid end time'),
    participants: z.array(z.string().uuid())
      .min(1, 'At least one participant required')
      .max(10000, 'Too many participants'),
    features: z.object({
      video_enabled: z.boolean().optional(),
      audio_enabled: z.boolean().optional(),
      recording_enabled: z.boolean().optional()
    }).optional()
  }).refine(
    (data) => new Date(data.meeting_start_time) < new Date(data.meeting_end_time),
    { message: 'End time must be after start time' }
  );

  static validateCreateMeeting(data: unknown) {
    return this.createMeetingSchema.parse(data);
  }
}
```

---

### 2. Rate Limiting

**✅ Protect Against Abuse**

```typescript
// middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL
});

export const meetingRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:meeting:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

export const strictMeetingRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:meeting:strict:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Rate limit exceeded for meeting operations'
});
```

---

## 📝 Conclusion

This implementation guide provides clean, optimized patterns for building a production-ready meeting system. Key takeaways:

1. **Separation of Concerns**: Keep services focused and single-purpose
2. **Type Safety**: Use TypeScript interfaces and DTOs throughout
3. **Error Handling**: Implement structured error classes and centralized handling
4. **Performance**: Cache aggressively, batch operations, use parallelism
5. **Testing**: Cover critical paths with unit and integration tests
6. **Security**: Validate inputs, rate limit, authenticate/authorize properly

Follow these patterns consistently across your codebase for maintainability and scalability.

---

**Last Updated:** November 3, 2025  
**Version:** 2.0  
**Maintainer:** KCS Development Team
