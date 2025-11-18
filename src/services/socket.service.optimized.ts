import { Server as HTTPServer } from "node:http";

import { verify } from "hono/jwt";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

import { type IMeetingParticipant, Meeting, MeetingChat, MeetingParticipant, MeetingRecording, type IMeetingRecording } from "@/models/meeting.model";
import { config } from "@/utils/env";

import { UserService } from "./users.service";
import { WebRTCService } from "./webrtc.service";
import { ChatCacheService } from "./chat_cache.service";
import { EnhancedSocketEvents } from "./enhanced_socket_events.service";
import log, { LogTypes } from "@/libs/logger";

/**
 * 🚀 OPTIMIZED Socket.IO Service for Real-time Communication
 *
 * Performance Optimizations:
 * - Redis adapter for horizontal scaling
 * - Redis-based connection state management
 * - Instant online status updates (no DB writes)
 * - Cached typing indicators with 3s TTL
 * - Optimistic message delivery
 * - Batch operations for efficiency
 * - Connection pooling
 * - Minimal database operations
 *
 * Handles:
 * - Real-time WebRTC signaling
 * - Live chat with ultra-low latency
 * - Participant presence (online/offline)
 * - Typing indicators
 * - Message delivery/read receipts
 * - Screen sharing coordination
 */
export class SocketServiceOptimized {
    private static io: SocketIOServer;
    private static activeSockets: Map<string, Socket> = new Map();
    private static userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
    private static socketUsers: Map<string, string> = new Map(); // socketId -> userId
    private static meetingParticipants: Map<string, Set<string>> = new Map(); // meetingId -> socketIds
    
    // Redis clients for pub/sub
    private static pubClient: ReturnType<typeof createClient>;
    private static subClient: ReturnType<typeof createClient>;

    // Helper utilities for multi-device tracking
    private static addUserSocket(userId: string, socketId: string): void {
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socketId);
    }

    private static removeUserSocket(userId: string, socketId: string): number {
        const sockets = this.userSockets.get(userId);
        if (!sockets) {
            return 0;
        }
        sockets.delete(socketId);
        if (sockets.size === 0) {
            this.userSockets.delete(userId);
            return 0;
        }
        return sockets.size;
    }

    private static emitToUserSockets(userId: string, event: string, payload: any): void {
        const sockets = this.userSockets.get(userId);
        if (!sockets) {
            return;
        }

        for (const socketId of sockets) {
            const socket = this.activeSockets.get(socketId);
            if (socket) {
                socket.emit(event, payload);
            }
        }
    }

    private static getFirstActiveSocket(userId: string): Socket | undefined {
        const sockets = this.userSockets.get(userId);
        if (!sockets || sockets.size === 0) {
            return undefined;
        }
        for (const socketId of sockets) {
            const socket = this.activeSockets.get(socketId);
            if (socket) {
                return socket;
            }
        }
        return undefined;
    }

    // ✅ Rate limiting infrastructure
    private static rateLimiters: Map<string, Map<string, { count: number; resetTime: number }>> = new Map();

    // 🚀 Message queue for offline users
    private static pendingMessages: Map<string, Array<{
        message: any;
        roomId: string;
        queuedAt: Date;
    }>> = new Map(); // userId -> pending messages

    /**
     * Initialize Socket.IO server with Redis adapter for horizontal scaling
     */
    public static async initialize(httpServer: HTTPServer): Promise<void> {
        // Initialize Redis clients for Socket.IO adapter
        try {
            this.pubClient = createClient({ url: config.REDIS_URI });
            this.subClient = this.pubClient.duplicate();

            await Promise.all([
                this.pubClient.connect(),
                this.subClient.connect()
            ]);

            log("✅ Redis pub/sub clients connected for Socket.IO", LogTypes.LOGS, "SOCKET_SERVICE");
        } catch (error) {
            log(`⚠️ Redis adapter not available, running in single-server mode: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
        }

        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: false,
            },
            transports: ["websocket", "polling"],
            pingTimeout: 60_000,
            pingInterval: 25_000,
            // Performance optimizations
            perMessageDeflate: false, // Disable compression for lower latency
            httpCompression: false,
            maxHttpBufferSize: 1e6, // 1MB max message size
            connectTimeout: 10_000,
        });

        // Use Redis adapter if available
        if (this.pubClient && this.subClient) {
            this.io.adapter(createAdapter(this.pubClient, this.subClient));
            log("✅ Socket.IO Redis adapter enabled", LogTypes.LOGS, "SOCKET_SERVICE");
        }

        // Authentication middleware
        this.io.use(async (socket, next) => {
            try {
                const token =
                    socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

                if (!token) {
                    return next(new Error("Authentication token missing"));
                }

                const tokenData = await verify(token, config.JWT_SECRET, "HS512");
                if (tokenData instanceof Error) {
                    return next(new Error("Invalid token"));
                }

                const { user_id, user_type, campus_id } = tokenData as any;

                // Get user data
                const user = await UserService.getUser(user_id);
                if (!user) {
                    return next(new Error("User not found"));
                }

                // Attach user data to socket
                socket.data = {
                    userId: user_id,
                    userType: user_type,
                    campusId: campus_id || user.campus_id,
                    userName: `${user.first_name} ${user.last_name}`,
                    userEmail: user.email,
                };

                next();
            } catch {
                next(new Error("Authentication failed"));
            }
        });

        this.io.on("connection", this.handleConnection.bind(this));

        log("🔌 Optimized Socket.IO server initialized", LogTypes.LOGS, "SOCKET_SERVICE");
    }

    /**
     * ✅ Rate limiting helper
     * @param socketId Socket identifier
     * @param eventName Event to rate limit
     * @param maxEvents Maximum events allowed
     * @param windowMs Time window in milliseconds
     * @returns true if allowed, false if rate limited
     */
    private static checkRateLimit(
        socketId: string,
        eventName: string,
        maxEvents: number,
        windowMs: number
    ): boolean {
        const now = Date.now();
        const key = `${socketId}:${eventName}`;
        
        if (!this.rateLimiters.has(eventName)) {
            this.rateLimiters.set(eventName, new Map());
        }
        
        const eventLimiter = this.rateLimiters.get(eventName)!;
        const limiterData = eventLimiter.get(socketId);
        
        // Check if we need to reset the window
        if (!limiterData || now >= limiterData.resetTime) {
            eventLimiter.set(socketId, {
                count: 1,
                resetTime: now + windowMs
            });
            return true; // Allowed
        }
        
        // Check if limit exceeded
        if (limiterData.count >= maxEvents) {
            return false; // Rate limited
        }
        
        // Increment counter
        limiterData.count++;
        return true; // Allowed
    }

    /**
     * Handle new socket connection
     */
    private static handleConnection(socket: Socket): void {
        const { userId, userName } = socket.data;

        log(`👤 User ${userName} (${userId}) connected with socket ${socket.id}`, LogTypes.LOGS, "SOCKET_SERVICE");

        // Store socket mappings
        this.activeSockets.set(socket.id, socket);
        this.addUserSocket(userId, socket.id);
        this.socketUsers.set(socket.id, userId);

        // 🚀 OPTIMIZATION: Set user online in Redis immediately (no DB write)
        ChatCacheService.setUserOnline(userId, socket.id).catch(err => 
            log(`Failed to set user online in cache: ${err}`, LogTypes.ERROR, "SOCKET_SERVICE")
        );

        // 🚀 NEW: Send any pending messages queued while user was offline
        this.sendPendingMessages(userId, socket).catch(err => 
            log(`Failed to send pending messages: ${err}`, LogTypes.ERROR, "SOCKET_SERVICE")
        );

        // ♻️ Auto re-join cached chat rooms so every socket stays in sync
        this.restoreCachedChatRooms(socket).catch(err =>
            log(`Failed to restore cached chat rooms: ${err}`, LogTypes.ERROR, "SOCKET_SERVICE")
        );

        // Register event handlers
        this.registerMeetingEvents(socket);
        this.registerMeetingChatEvents(socket);
        this.registerGeneralChatEventsOptimized(socket); // OPTIMIZED version
        this.registerWebRTCEvents(socket);
        this.registerPresenceEventsOptimized(socket); // OPTIMIZED version
        // NEW: Register enhanced events (media, sync, devices, etc.)
        EnhancedSocketEvents.registerEnhancedEvents(socket);
        EnhancedSocketEvents.registerPresenceEvents(socket);

        // Start heartbeat
        this.startHeartbeat(socket);

        // Handle disconnection
        socket.on("disconnect", () => this.handleDisconnection(socket));
    }

    /**
     * Ensure newly connected sockets automatically rejoin cached chat rooms
     */
    private static async restoreCachedChatRooms(socket: Socket): Promise<void> {
        const { userId, userName } = socket.data;

        try {
            const cachedRooms = await ChatCacheService.getCachedUserRooms(userId);
            if (!cachedRooms || cachedRooms.length === 0) {
                return;
            }

            for (const roomId of cachedRooms) {
                await socket.join(`chat_room_${roomId}`);
                await ChatCacheService.addUserToRoomOnline(roomId, userId);
            }

            socket.emit("chat-rooms-synced", {
                success: true,
                rooms: cachedRooms,
                restoredAt: new Date().toISOString()
            });

            log(`♻️ Restored ${cachedRooms.length} chat rooms for ${userName}`, LogTypes.LOGS, "SOCKET_SERVICE");
        } catch (error) {
            log(`Failed to restore cached chat rooms for ${userName}: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
        }
    }

    /**
     * Start heartbeat to keep user online status fresh
     */
    private static startHeartbeat(socket: Socket): void {
        const heartbeatInterval = setInterval(async () => {
            const userId = socket.data.userId;
            if (userId) {
                await ChatCacheService.heartbeat(userId);
            }
        }, 30_000); // Every 30 seconds

        socket.on("disconnect", () => {
            clearInterval(heartbeatInterval);
        });
    }

    /**
     * Register meeting-related events
     */
    private static registerMeetingEvents(socket: Socket): void {
        const { userId: authUserId, userName: authUserName, campusId } = socket.data;

        // Join meeting room
        socket.on("join-meeting", async (data: { meetingId: string; userId?: string; userName?: string }) => {
            try {
                const { meetingId } = data;
                
                const userId = data.userId || authUserId;
                const userName = data.userName || authUserName;

                // Verify meeting exists and user has access
                const meeting = await Meeting.findById(meetingId);
                if (!meeting) {
                    socket.emit("error", { message: "Meeting not found" });
                    return;
                }

                if (meeting.campus_id !== campusId) {
                    socket.emit("error", { message: "Access denied" });
                    return;
                }

                if (meeting.meeting_status === "ended" || meeting.meeting_status === "cancelled") {
                    socket.emit("error", { message: "Meeting has ended" });
                    return;
                }

                const currentParticipants = this.meetingParticipants.get(meetingId)?.size || 0;
                if (currentParticipants >= meeting.max_participants) {
                    socket.emit("error", { message: "Meeting is full" });
                    return;
                }

                await socket.join(meetingId);

                if (!this.meetingParticipants.has(meetingId)) {
                    this.meetingParticipants.set(meetingId, new Set());
                }
                this.meetingParticipants.get(meetingId)!.add(socket.id);

                const participantId = `${meetingId}_${userId}_${Date.now()}`;

                const participantData: Partial<IMeetingParticipant> = {
                    meeting_id: meetingId,
                    user_id: userId,
                    participant_name: userName,
                    participant_email: socket.data.userEmail,
                    connection_status: "connected",
                    joined_at: new Date(),
                    peer_connection_id: participantId,
                    socket_id: socket.id,
                    ip_address: socket.handshake.address,
                    user_agent: socket.handshake.headers["user-agent"] || "",
                    permissions: {
                        can_share_screen: true,
                        can_use_chat: true,
                        can_use_whiteboard: true,
                        is_moderator: meeting.creator_id === userId,
                        is_host: meeting.creator_id === userId,
                    },
                };

                const participant = await MeetingParticipant.create(participantData);

                if (meeting.meeting_status === "scheduled") {
                    await Meeting.updateById(meetingId, {
                        meeting_status: "live",
                        updated_at: new Date(),
                    });
                }

                if (currentParticipants === 0) {
                    await WebRTCService.createMeetingRouter(meetingId);
                }

                const existingParticipants = await this.getMeetingParticipants(meetingId);

                // Get router RTP capabilities for WebRTC initialization
                const rtpCapabilities = WebRTCService.getMeetingRouterRtpCapabilities(meetingId);

                socket.to(meetingId).emit("participant-joined", {
                    participantId: participantId,
                    userName,
                    userId,
                    audio: true,
                    video: true,
                    screen: false,
                    permissions: participantData.permissions,
                });

                socket.emit("meeting-joined", {
                    meeting,
                    participantId: participantId,
                    participants: existingParticipants,
                    webrtcConfig: {
                        ...meeting.webrtc_config,
                        rtpCapabilities: rtpCapabilities, // ✅ Added RTP capabilities for frontend
                    },
                });

                console.log(`✅ ${userName} joined meeting ${meetingId}`);
            } catch (error) {
                log(`Error joining meeting: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", { message: "Failed to join meeting" });
            }
        });

        // Leave meeting
        socket.on("leave-meeting", async (data: { meetingId: string }) => {
            await this.handleLeaveMeeting(socket, data.meetingId);
        });

        // ============================================
        // 🎥 SCREEN SHARING EVENTS
        // ============================================
        
        socket.on("screen:start", async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;
                const { userId, userName } = socket.data;

                log(`📺 ${userName} started screen sharing in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Update participant media status
                await MeetingParticipant.findOneAndUpdate(
                    { meeting_id: meetingId, user_id: userId },
                    { 
                        media_status: {
                            screen_sharing: true
                        } as any,
                        updated_at: new Date()
                    }
                );

                // Update analytics
                await Meeting.findByIdAndUpdate(meetingId, {
                    $inc: { "analytics.screen_shares_count": 1 }
                });

                // Notify all participants in the meeting
                this.io.to(meetingId).emit("screen:started", {
                    meetingId,
                    userId,
                    userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error starting screen share: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "screen:start",
                    message: "Failed to start screen sharing",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        socket.on("screen:stop", async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;
                const { userId, userName } = socket.data;

                log(`📺 ${userName} stopped screen sharing in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Update participant media status
                await MeetingParticipant.findOneAndUpdate(
                    { meeting_id: meetingId, user_id: userId },
                    { 
                        media_status: {
                            screen_sharing: false
                        } as any,
                        updated_at: new Date()
                    }
                );

                // Notify all participants
                this.io.to(meetingId).emit("screen:stopped", {
                    meetingId,
                    userId,
                    userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error stopping screen share: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "screen:stop",
                    message: "Failed to stop screen sharing",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // ============================================
        // ✋ HAND RAISE EVENTS
        // ============================================

        socket.on("hand:raise", async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;
                const { userId, userName } = socket.data;

                log(`✋ ${userName} raised hand in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Notify all participants (especially host)
                this.io.to(meetingId).emit("hand:raised", {
                    meetingId,
                    userId,
                    userName,
                    timestamp: new Date().toISOString()
                });

                // Store in audit trail for analytics
                await Meeting.findByIdAndUpdate(meetingId, {
                    $push: {
                        audit_trail: {
                            timestamp: new Date(),
                            action: "hand_raised",
                            user_id: userId,
                            details: { userName }
                        }
                    }
                });

            } catch (error) {
                log(`Error raising hand: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "hand:raise",
                    message: "Failed to raise hand",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        socket.on("hand:lower", async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;
                const { userId, userName } = socket.data;

                log(`✋ ${userName} lowered hand in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Notify all participants
                this.io.to(meetingId).emit("hand:lowered", {
                    meetingId,
                    userId,
                    userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error lowering hand: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "hand:lower",
                    message: "Failed to lower hand",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // ============================================
        // 🔇 PARTICIPANT CONTROL EVENTS (HOST ACTIONS)
        // ============================================

        socket.on("participant:mute", async (data: { 
            meetingId: string; 
            targetUserId: string;
            kind: "audio" | "video";
        }) => {
            try {
                const { meetingId, targetUserId, kind } = data;
                const { userId: hostUserId, userName: hostName } = socket.data;

                // Verify host has permission
                const meeting = await Meeting.findById(meetingId);
                if (!meeting) {
                    throw new Error("Meeting not found");
                }

                // Check if requester is host or co-host
                const hostParticipant = await MeetingParticipant.findOne({
                    meeting_id: meetingId,
                    user_id: hostUserId
                });

                if (!hostParticipant?.permissions.is_host && !hostParticipant?.permissions.is_moderator) {
                    throw new Error("Permission denied - only host can mute participants");
                }

                log(`🔇 ${hostName} muted ${targetUserId}'s ${kind} in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Update target participant's status
                await MeetingParticipant.findOneAndUpdate(
                    { meeting_id: meetingId, user_id: targetUserId },
                    {
                        media_status: {
                            [kind + '_enabled']: false,
                            is_muted_by_host: true
                        } as any,
                        updated_at: new Date()
                    }
                );

                // Notify every active device owned by the participant
                this.emitToUserSockets(targetUserId, "muted:by-host", {
                    meetingId,
                    kind,
                    hostName,
                    reason: "Muted by host",
                    timestamp: new Date().toISOString()
                });

                // Notify all participants about the update
                this.io.to(meetingId).emit("participant:media:updated", {
                    meetingId,
                    userId: targetUserId,
                    kind,
                    enabled: false,
                    mutedByHost: true
                });

                // Store in audit trail
                await Meeting.findByIdAndUpdate(meetingId, {
                    $push: {
                        audit_trail: {
                            timestamp: new Date(),
                            action: "participant_muted",
                            user_id: hostUserId,
                            details: { targetUserId, kind, hostName }
                        }
                    }
                });

            } catch (error) {
                log(`Error muting participant: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "participant:mute",
                    message: "Failed to mute participant",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // ============================================
        // 😊 REACTION EVENTS
        // ============================================

        socket.on("reaction:send", async (data: { 
            meetingId: string; 
            emoji: string;
        }) => {
            try {
                // ✅ Rate limit: 3 reactions per second
                if (!this.checkRateLimit(socket.id, "reaction:send", 3, 1000)) {
                    socket.emit("error", {
                        event: "reaction:send",
                        message: "Reaction rate limit exceeded. Please slow down.",
                        code: "RATE_LIMIT_EXCEEDED"
                    });
                    return;
                }
                
                const { meetingId, emoji } = data;
                const { userId, userName } = socket.data;

                // Validate emoji (basic check)
                const validEmojis = ["👍", "❤️", "😂", "😮", "😢", "👏", "🎉", "🤔", "👎", "🔥"];
                if (!validEmojis.includes(emoji)) {
                    throw new Error("Invalid emoji");
                }

                log(`${emoji} ${userName} sent reaction in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Broadcast reaction to all participants (ephemeral - not stored in DB)
                this.io.to(meetingId).emit("reaction:received", {
                    meetingId,
                    userId,
                    userName,
                    emoji,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error sending reaction: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "reaction:send",
                    message: "Failed to send reaction",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // ============================================
        // 🔴 RECORDING CONTROL EVENTS
        // ============================================

        socket.on("recording:start", async (data: {
            meetingId: string;
            options?: {
                recordVideo?: boolean;
                recordAudio?: boolean;
                recordChat?: boolean;
            }
        }) => {
            try {
                const { meetingId, options = {} } = data;
                const { userId, userName } = socket.data;

                // ✅ Get meeting first to check if recording is enabled
                const meeting = await Meeting.findById(meetingId);
                if (!meeting) {
                    socket.emit("error", {
                        event: "recording:start",
                        message: "Meeting not found",
                        code: "MEETING_NOT_FOUND"
                    });
                    return;
                }

                // ✅ Check if recording is enabled for this meeting
                if (!(meeting as any).recording_enabled) {
                    socket.emit("error", {
                        event: "recording:start",
                        message: "Recording is disabled for this meeting",
                        code: "RECORDING_DISABLED"
                    });
                    return;
                }

                // ✅ Verify permission (only host or moderator can start recording)
                const participant = await MeetingParticipant.findOne({
                    meeting_id: meetingId,
                    user_id: userId
                });

                if (!participant) {
                    socket.emit("error", {
                        event: "recording:start",
                        message: "You are not a participant in this meeting",
                        code: "NOT_A_PARTICIPANT"
                    });
                    return;
                }

                if (!participant.permissions?.is_host && !participant.permissions?.is_moderator) {
                    socket.emit("error", {
                        event: "recording:start",
                        message: "Only hosts and moderators can start recording",
                        code: "UNAUTHORIZED_RECORDING"
                    });
                    return;
                }

                log(`🔴 ${userName} started recording meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Create recording record in database
                const recordingData: Partial<IMeetingRecording> = {
                    meeting_id: meetingId,
                    recording_type: 'video',
                    started_at: new Date(),
                    is_available: false,
                };

                const recording = await MeetingRecording.create(recordingData);

                // Notify all participants
                this.io.to(meetingId).emit("recording:started", {
                    meetingId,
                    recordingId: recording.id,
                    hostName: userName,
                    options,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error starting recording: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "recording:start",
                    message: "Failed to start recording",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        socket.on("recording:stop", async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;
                const { userId, userName } = socket.data;

                // ✅ Verify participant exists and has permission
                const participant = await MeetingParticipant.findOne({
                    meeting_id: meetingId,
                    user_id: userId
                });

                if (!participant) {
                    socket.emit("error", {
                        event: "recording:stop",
                        message: "You are not a participant in this meeting",
                        code: "NOT_A_PARTICIPANT"
                    });
                    return;
                }

                if (!participant.permissions?.is_host && !participant.permissions?.is_moderator) {
                    socket.emit("error", {
                        event: "recording:stop",
                        message: "Only hosts and moderators can stop recording",
                        code: "UNAUTHORIZED_RECORDING"
                    });
                    return;
                }

                log(`⏹️ ${userName} stopped recording meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Update recording record
                const activeRecording = await MeetingRecording.findOne({
                    meeting_id: meetingId,
                    ended_at: null
                });

                if (activeRecording) {
                    await MeetingRecording.updateById(activeRecording.id, {
                        ended_at: new Date(),
                        is_available: true
                    });
                }

                // Notify all participants
                this.io.to(meetingId).emit("recording:stopped", {
                    meetingId,
                    hostName: userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error stopping recording: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "recording:stop",
                    message: "Failed to stop recording",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        socket.on("recording:pause", async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;
                const { userId, userName } = socket.data;

                // ✅ Verify participant exists and has permission
                const participant = await MeetingParticipant.findOne({
                    meeting_id: meetingId,
                    user_id: userId
                });

                if (!participant) {
                    socket.emit("error", {
                        event: "recording:pause",
                        message: "You are not a participant in this meeting",
                        code: "NOT_A_PARTICIPANT"
                    });
                    return;
                }

                if (!participant.permissions?.is_host && !participant.permissions?.is_moderator) {
                    socket.emit("error", {
                        event: "recording:pause",
                        message: "Only hosts and moderators can pause recording",
                        code: "UNAUTHORIZED_RECORDING"
                    });
                    return;
                }

                log(`⏸️ ${userName} paused recording meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // In a full implementation, you would pause the actual recording process here
                // For now, we just notify clients

                this.io.to(meetingId).emit("recording:paused", {
                    meetingId,
                    hostName: userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error pausing recording: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "recording:pause",
                    message: "Failed to pause recording",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        socket.on("recording:resume", async (data: { meetingId: string }) => {
            try {
                const { meetingId } = data;
                const { userId, userName } = socket.data;

                // ✅ Verify participant exists and has permission
                const participant = await MeetingParticipant.findOne({
                    meeting_id: meetingId,
                    user_id: userId
                });

                if (!participant) {
                    socket.emit("error", {
                        event: "recording:resume",
                        message: "You are not a participant in this meeting",
                        code: "NOT_A_PARTICIPANT"
                    });
                    return;
                }

                if (!participant.permissions?.is_host && !participant.permissions?.is_moderator) {
                    socket.emit("error", {
                        event: "recording:resume",
                        message: "Only hosts and moderators can resume recording",
                        code: "UNAUTHORIZED_RECORDING"
                    });
                    return;
                }

                log(`▶️ ${userName} resumed recording meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // In a full implementation, you would resume the actual recording process here
                // For now, we just notify clients

                this.io.to(meetingId).emit("recording:resumed", {
                    meetingId,
                    hostName: userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error resuming recording: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "recording:resume",
                    message: "Failed to resume recording",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // ============================================
        // 🎨 LAYOUT & UI CONTROL EVENTS
        // ============================================

        socket.on("layout:change", async (data: {
            meetingId: string;
            layout: "grid" | "speaker" | "presentation";
        }) => {
            try {
                const { meetingId, layout } = data;
                const { userId, userName } = socket.data;

                log(`🎨 ${userName} changed layout to ${layout} in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Broadcast layout change to all participants
                this.io.to(meetingId).emit("layout:changed", {
                    meetingId,
                    layout,
                    userId,
                    userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error changing layout: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "layout:change",
                    message: "Failed to change layout",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        socket.on("participant:pin", async (data: {
            meetingId: string;
            targetUserId: string;
        }) => {
            try {
                const { meetingId, targetUserId } = data;
                const { userId, userName } = socket.data;

                log(`📌 ${userName} pinned ${targetUserId} in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Broadcast pin action
                this.io.to(meetingId).emit("participant:pinned", {
                    meetingId,
                    targetUserId,
                    pinnedBy: userId,
                    pinnedByName: userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error pinning participant: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "participant:pin",
                    message: "Failed to pin participant",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        socket.on("participant:spotlight", async (data: {
            meetingId: string;
            targetUserId: string;
        }) => {
            try {
                const { meetingId, targetUserId } = data;
                const { userId, userName } = socket.data;

                // Verify host permission
                const participant = await MeetingParticipant.findOne({
                    meeting_id: meetingId,
                    user_id: userId
                });

                if (!participant?.permissions.is_host && !participant?.permissions.is_moderator) {
                    throw new Error("Permission denied - only host can spotlight participants");
                }

                log(`⭐ ${userName} spotlighted ${targetUserId} in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Broadcast spotlight action
                this.io.to(meetingId).emit("participant:spotlighted", {
                    meetingId,
                    targetUserId,
                    spotlightedBy: userId,
                    spotlightedByName: userName,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                log(`Error spotlighting participant: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "participant:spotlight",
                    message: "Failed to spotlight participant",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // ============================================
        // 📊 TELEMETRY & STATS EVENTS
        // ============================================

        socket.on("stats:report", async (data: {
            meetingId: string;
            stats: {
                rtt?: number;
                jitter?: number;
                packetLoss?: number;
                bitrate?: number;
                framesDecoded?: number;
                framesDropped?: number;
            }
        }) => {
            try {
                // ✅ Rate limit: 1 report per 5 seconds (reduce database load)
                if (!this.checkRateLimit(socket.id, "stats:report", 1, 5000)) {
                    return; // Silently drop excessive stats reports
                }
                
                const { meetingId, stats } = data;
                const { userId } = socket.data;

                // Update participant connection quality based on stats
                let connectionQuality: "poor" | "fair" | "good" | "excellent" = "good";
                
                if (stats.packetLoss && stats.packetLoss > 5) {
                    connectionQuality = "poor";
                } else if (stats.packetLoss && stats.packetLoss > 3) {
                    connectionQuality = "fair";
                } else if (stats.rtt && stats.rtt < 100 && (!stats.packetLoss || stats.packetLoss < 1)) {
                    connectionQuality = "excellent";
                }

                await MeetingParticipant.findOneAndUpdate(
                    { meeting_id: meetingId, user_id: userId },
                    {
                        connection_quality: connectionQuality,
                        updated_at: new Date()
                    }
                );

                // Update meeting analytics (average connection quality)
                const participants = await MeetingParticipant.find({ meeting_id: meetingId });
                const qualityMap = { poor: 1, fair: 2, good: 3, excellent: 4 };
                const avgQuality = participants.reduce((sum, p) => sum + qualityMap[p.connection_quality], 0) / participants.length;

                await Meeting.findByIdAndUpdate(meetingId, {
                    "analytics.connection_quality_avg": avgQuality
                });

            } catch (error) {
                log(`Error reporting stats: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                // Don't send error to client for stats (it's frequent)
            }
        });

        // Additional meeting events remain the same...
    }

    /**
     * Register meeting chat events
     */
    private static registerMeetingChatEvents(socket: Socket): void {
        const { userId, userName } = socket.data;

        socket.on(
            "send-message",
            async (data: {
                meetingId: string;
                message: string;
                recipientType: "all" | "private" | "host";
                recipientId?: string;
            }) => {
                try {
                    // ✅ Rate limit: 10 messages per minute (prevent spam)
                    if (!this.checkRateLimit(socket.id, "send-message", 10, 60000)) {
                        socket.emit("error", {
                            message: "Message rate limit exceeded. Please slow down.",
                            code: "RATE_LIMIT_EXCEEDED"
                        });
                        return;
                    }
                    
                    const { meetingId, message, recipientType, recipientId } = data;

                    const rooms = [...socket.rooms];
                    if (!rooms.includes(meetingId)) {
                        socket.emit("error", { message: "Not in meeting" });
                        return;
                    }

                    const chatMessage = await MeetingChat.create({
                        meeting_id: meetingId,
                        sender_id: userId,
                        sender_name: userName,
                        message,
                        message_type: "text",
                        recipient_type: recipientType,
                        recipient_id: recipientId,
                        timestamp: new Date(),
                    });

                    if (recipientType === "all") {
                        this.io.to(meetingId).emit("new-message", chatMessage);
                    } else if (recipientType === "private" && recipientId) {
                        this.emitToUserSockets(recipientId, "new-message", chatMessage);
                        socket.emit("new-message", chatMessage);
                    } else if (recipientType === "host") {
                        const participants = await this.getMeetingParticipants(meetingId);
                        for (const participant of participants) {
                            if (participant.permissions.is_host || participant.permissions.is_moderator) {
                                this.emitToUserSockets(participant.user_id, "new-message", chatMessage);
                            }
                        }
                    }

                    await Meeting.updateById(meetingId, {
                        "analytics.chat_messages_count": { $inc: 1 },
                        updated_at: new Date(),
                    });
                } catch (error) {
                    log(`Error sending chat message: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                    socket.emit("error", { message: "Failed to send message" });
                }
            }
        );

        // 🚀 OPTIMIZED: Typing indicator with Redis cache and rate limiting
        socket.on("typing", async (data: { meetingId: string; typing: boolean }) => {
            // ✅ Rate limit: 1 event per second per socket
            if (!this.checkRateLimit(socket.id, "typing", 1, 1000)) {
                return; // Silently drop excessive typing events
            }
            
            const { meetingId, typing } = data;
            
            if (typing) {
                await ChatCacheService.setTyping(userId, meetingId);
            } else {
                await ChatCacheService.removeTyping(userId, meetingId);
            }
            
            // Broadcast immediately (no DB query)
            socket.to(meetingId).emit("user-typing", {
                userId,
                userName,
                typing,
            });
        });
    }

    /**
     * 🚀 OPTIMIZED: Register general chat system events with performance improvements
     */
    private static registerGeneralChatEventsOptimized(socket: Socket): void {
        const { userId, userName, campusId } = socket.data;

        // Join chat rooms
        socket.on("join-chat-rooms", async (data: { roomIds: string[] }) => {
            try {
                const { roomIds } = data;
                
                for (const roomId of roomIds) {
                    await socket.join(`chat_room_${roomId}`);
                    
                    // 🚀 OPTIMIZATION: Track user in room's online set (Redis)
                    await ChatCacheService.addUserToRoomOnline(roomId, userId);
                }
                
                // Cache user's rooms list
                await ChatCacheService.cacheUserRooms(userId, roomIds);
                
                socket.emit("chat-rooms-joined", { 
                    success: true, 
                    rooms: roomIds,
                    message: "Successfully joined chat rooms" 
                });
                
                // Broadcast online status to room members
                for (const roomId of roomIds) {
                    socket.to(`chat_room_${roomId}`).emit("user-online", {
                        userId,
                        userName,
                        roomId,
                        timestamp: new Date().toISOString()
                    });
                }
                
                log(`✅ ${userName} joined ${roomIds.length} chat rooms`, LogTypes.LOGS, "SOCKET_SERVICE");
            } catch (error) {
                log(`Error joining chat rooms: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("chat-rooms-joined", { 
                    success: false, 
                    error: "Failed to join chat rooms" 
                });
            }
        });

        // Leave chat room
        socket.on("leave-chat-room", async (data: { roomId: string }) => {
            try {
                const { roomId } = data;
                await socket.leave(`chat_room_${roomId}`);
                
                // 🚀 OPTIMIZATION: Remove from room's online set
                await ChatCacheService.removeUserFromRoomOnline(roomId, userId);
                
                // Broadcast offline status
                socket.to(`chat_room_${roomId}`).emit("user-offline", {
                    userId,
                    roomId,
                    timestamp: new Date().toISOString()
                });
                
                socket.emit("chat-room-left", { 
                    success: true, 
                    roomId 
                });
                
                log(`👋 ${userName} left chat room ${roomId}`, LogTypes.LOGS, "SOCKET_SERVICE");
            } catch (error) {
                log(`Error leaving chat room: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            }
        });

        // 🚀 OPTIMIZED: Typing indicator with Redis cache (3s TTL)
        socket.on("chat-typing", async (data: { roomId: string; isTyping: boolean }) => {
            const { roomId, isTyping } = data;
            
            if (isTyping) {
                // Set typing in Redis with 3s TTL
                await ChatCacheService.setTyping(userId, roomId);
            } else {
                // Remove typing immediately
                await ChatCacheService.removeTyping(userId, roomId);
            }
            
            // Broadcast immediately (no DB operation)
            socket.to(`chat_room_${roomId}`).emit("chat-user-typing", {
                userId,
                userName,
                roomId,
                isTyping,
                timestamp: new Date().toISOString()
            });
        });

        // 🚀 OPTIMIZED: Mark messages as seen with batch update and unread count reset
        // 🚀 OPTIMIZED: Mark messages as seen with batch update and unread count reset
        socket.on("mark-messages-seen", async (data: { roomId: string; messageIds: string[] }) => {
            try {
                const { roomId, messageIds } = data;
                
                if (!messageIds || messageIds.length === 0) {
                    return;
                }

                // 🚀 OPTIMIZATION: Reset unread count in cache immediately
                await ChatCacheService.resetUnreadCount(userId, roomId);
                
                // 🚀 NEW: Update user_chat_preferences with last_read_message_id
                try {
                    const { UserChatPreferences } = await import("../models/user_chat_preferences.model");
                    const { ChatMessage } = await import("../models/chat_message.model");
                    
                    // Get the latest message from the list
                    let latestMessageId = messageIds[messageIds.length - 1];
                    let latestTimestamp = new Date();

                    // Try to get the actual latest message by timestamp
                    for (const msgId of messageIds) {
                        try {
                            const msg = await ChatMessage.findById(msgId);
                            if (msg && msg.created_at > latestTimestamp) {
                                latestMessageId = msgId;
                                latestTimestamp = msg.created_at;
                            }
                        } catch {
                            // Skip if message not found
                        }
                    }

                    // Update or create user_chat_preferences
                    const existingPrefs = await UserChatPreferences.find({
                        user_id: userId,
                        room_id: roomId
                    });

                    const prefs = existingPrefs.rows?.[0];

                    if (prefs) {
                        await UserChatPreferences.updateById(prefs.id, {
                            last_read_message_id: latestMessageId,
                            last_read_at: new Date(),
                            manually_marked_unread: false,
                            updated_at: new Date()
                        });
                    } else {
                        await UserChatPreferences.create({
                            user_id: userId,
                            room_id: roomId,
                            last_read_message_id: latestMessageId,
                            last_read_at: new Date(),
                            manually_marked_unread: false,
                            is_archived: false,
                            is_deleted: false,
                            is_muted: false,
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    }
                } catch (error) {
                    log(`Failed to update user_chat_preferences: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                }

                // Get message senders to notify them
                try {
                    const { ChatMessage } = await import("../models/chat_message.model");
                    const senderIds = new Set<string>();

                    for (const msgId of messageIds) {
                        try {
                            const msg = await ChatMessage.findById(msgId);
                            if (msg && msg.sender_id !== userId) {
                                senderIds.add(msg.sender_id);
                            }
                        } catch {
                            // Skip if message not found
                        }
                    }

                    // Broadcast seen receipt to each sender
                    const seenReceipt = {
                        userId,
                        userName,
                        seenAt: new Date().toISOString()
                    };

                    for (const senderId of senderIds) {
                        this.emitToUserSockets(senderId, "messages-seen", {
                            roomId,
                            messageIds,
                            seenBy: seenReceipt
                        });
                    }
                } catch (error) {
                    log(`Failed to notify senders of seen receipts: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                }
                
                // Broadcast to other users in the room (not to self)
                socket.to(`chat_room_${roomId}`).emit("messages-seen", {
                    userId,
                    roomId,
                    messageIds,
                    timestamp: new Date().toISOString()
                });
                
                // Send acknowledgment to the user who marked messages as seen
                socket.emit("messages-seen-acknowledged", { 
                    success: true, 
                    roomId, 
                    messageIds 
                });
                
                // Broadcast updated unread count to the user (now should be 0)
                const newUnreadCount = await ChatCacheService.getUnreadCount(userId, roomId);
                socket.emit("unread-count", { 
                    roomId, 
                    count: newUnreadCount 
                });
                
                log(`✅ User ${userId} marked ${messageIds.length} messages as seen in room ${roomId}`, LogTypes.LOGS, "SOCKET_SERVICE");
            } catch (error) {
                log(`Error marking messages seen: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            }
        });

        // 🚀 OPTIMIZED: User status update (online/away/busy) - Redis only
        socket.on("update-chat-status", async (data: { status: "online" | "away" | "busy" }) => {
            const { status } = data;
            
            // Update status in Redis immediately
            await ChatCacheService.setUserOnline(userId, socket.id);
            
            // Broadcast immediately (no DB operation)
            socket.broadcast.emit("chat-user-status-changed", {
                userId,
                status,
                timestamp: new Date().toISOString()
            });
        });

        // 🚀 OPTIMIZED: Get online users from Redis cache
        socket.on("get-room-online-users", async (data: { roomId: string }) => {
            try {
                const { roomId } = data;
                
                // 🚀 OPTIMIZATION: Get from Redis cache first
                const cachedOnlineUsers = await ChatCacheService.getRoomOnlineUsers(roomId);
                
                if (cachedOnlineUsers.length > 0) {
                    // Use cached data
                    socket.emit("room-online-users", {
                        roomId,
                        users: cachedOnlineUsers,
                        count: cachedOnlineUsers.length,
                        cached: true
                    });
                } else {
                    // Fallback to Socket.IO rooms
                    const roomSockets = await this.io.in(`chat_room_${roomId}`).fetchSockets();
                    
                    const onlineUsers = roomSockets.map(s => ({
                        userId: s.data.userId,
                        userName: s.data.userName,
                        userType: s.data.userType
                    }));
                    
                    socket.emit("room-online-users", {
                        roomId,
                        users: onlineUsers,
                        count: onlineUsers.length,
                        cached: false
                    });
                }
            } catch (error) {
                log(`Error getting online users: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", { message: "Failed to get online users" });
            }
        });

        // 🚀 NEW: Request unread count from cache
        socket.on("get-unread-count", async (data: { roomId?: string }) => {
            try {
                const { roomId } = data;
                
                if (roomId) {
                    // Get for specific room
                    const count = await ChatCacheService.getUnreadCount(userId, roomId);
                    socket.emit("unread-count", { roomId, count });
                } else {
                    // Get total across all rooms
                    const totalCount = await ChatCacheService.getTotalUnreadCount(userId);
                    socket.emit("total-unread-count", { count: totalCount });
                }
            } catch (error) {
                log(`Error getting unread count: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            }
        });

        // 🚀 NEW: Heartbeat ping/pong
        socket.on("ping", async () => {
            // Respond with pong immediately
            socket.emit("pong");
            
            // Update last_seen timestamp in cache
            await ChatCacheService.updateLastSeen(userId);
            
            // Optional: Update user status to ensure they're marked as online
            await ChatCacheService.setUserOnline(userId, socket.id);
        });
    }

    /**
     * Register WebRTC signaling events
     */
    private static registerWebRTCEvents(socket: Socket): void {
        // Create WebRTC transport
        socket.on("create-transport", async (data: { meetingId: string; direction: "send" | "recv" }) => {
            try {
                const { meetingId, direction } = data;
                const participantId = socket.data.userId;

                const { transport, params } = await WebRTCService.createWebRtcTransport(
                    meetingId,
                    participantId,
                    direction
                );

                socket.emit("transport-created", {
                    direction,
                    params,
                });
            } catch (error) {
                log(`Error creating transport: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    message: "Failed to create transport",
                });
            }
        });

        // Connect transport
        socket.on("connect-transport", async (data: { transportId: string; dtlsParameters: any }) => {
            try {
                await WebRTCService.connectTransport(data.transportId, data.dtlsParameters);
                socket.emit("transport-connected", {
                    transportId: data.transportId,
                });
            } catch (error) {
                log(`Error connecting transport: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    message: "Failed to connect transport",
                });
            }
        });

        // Start producing media
        socket.on("produce", async (data: { meetingId: string; kind: "audio" | "video"; rtpParameters: any }) => {
            try {
                const { meetingId, kind, rtpParameters } = data;
                const participantId = socket.data.userId;

                const { id } = await WebRTCService.produce(meetingId, participantId, rtpParameters, kind);

                socket.emit("produced", { kind, producerId: id });

                // Notify other participants
                socket.to(meetingId).emit("new-producer", {
                    participantId,
                    producerId: id,
                    kind,
                });
            } catch (error) {
                log(`Error producing media: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    message: "Failed to produce media",
                });
            }
        });

        // Start consuming media
        socket.on(
            "consume",
            async (data: {
                meetingId: string;
                producerParticipantId: string;
                kind: "audio" | "video";
                rtpCapabilities: any;
            }) => {
                try {
                    const { meetingId, producerParticipantId, kind, rtpCapabilities } = data;
                    const consumerParticipantId = socket.data.userId;

                    const consumerData = await WebRTCService.consume(
                        meetingId,
                        consumerParticipantId,
                        producerParticipantId,
                        rtpCapabilities,
                        kind
                    );

                    socket.emit("consumed", {
                        ...consumerData,
                        kind,
                        producerParticipantId,
                    });
                } catch (error) {
                    log(`Error consuming media: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                    socket.emit("error", {
                        message: "Failed to consume media",
                    });
                }
            }
        );

        // Resume/pause consumer
        socket.on("resume-consumer", async (data: { consumerId: string }) => {
            try {
                await WebRTCService.resumeConsumer(data.consumerId);
                socket.emit("consumer-resumed", {
                    consumerId: data.consumerId,
                });
            } catch (error) {
                log(`Error resuming consumer: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            }
        });

        socket.on("pause-consumer", async (data: { consumerId: string }) => {
            try {
                await WebRTCService.pauseConsumer(data.consumerId);
                socket.emit("consumer-paused", { consumerId: data.consumerId });
            } catch (error) {
                log(`Error pausing consumer: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            }
        });

        // 🎥 Change quality layer for simulcast streams
        socket.on("quality:change", async (data: {
            meetingId: string;
            layer: "low" | "medium" | "high";
        }) => {
            try {
                const { meetingId, layer } = data;
                const { userId } = socket.data;

                // Map layer names to spatial layer numbers
                const layerMap = { low: 0, medium: 1, high: 2 };
                const spatialLayer = layerMap[layer];

                log(`🔀 User ${userId} changing quality to ${layer} (layer ${spatialLayer}) in meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");

                // Find all video consumers for this user in this meeting
                const consumerIds = WebRTCService.getConsumerIdsForUser(meetingId, userId);
                let updatedCount = 0;
                
                // Switch layer for each video consumer
                for (const consumerId of consumerIds) {
                    if (consumerId.endsWith('_video')) {
                        try {
                            await WebRTCService.switchConsumerLayer(consumerId, spatialLayer);
                            updatedCount++;
                        } catch (error) {
                            log(`Failed to switch layer for consumer ${consumerId}: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                        }
                    }
                }

                socket.emit("quality:changed", {
                    meetingId,
                    layer,
                    spatialLayer,
                    consumersUpdated: updatedCount
                });

                log(`✅ Updated ${updatedCount} video consumers to ${layer} quality`, LogTypes.LOGS, "SOCKET_SERVICE");

            } catch (error) {
                log(`Error changing quality: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                socket.emit("error", {
                    event: "quality:change",
                    message: "Failed to change quality",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }

    /**
     * 🚀 OPTIMIZED: Register presence events with Redis
     */
    private static registerPresenceEventsOptimized(socket: Socket): void {
        const { userId, userName } = socket.data;

        // Hand raise/lower
        socket.on("raise-hand", async (data: { meetingId: string; raised: boolean }) => {
            const { meetingId, raised } = data;

            socket.to(meetingId).emit("hand-raised", {
                participantId: userId,
                userName,
                raised,
                timestamp: new Date(),
            });
        });

        // Reactions
        socket.on("send-reaction", async (data: { meetingId: string; reaction: string }) => {
            const { meetingId, reaction } = data;

            this.io.to(meetingId).emit("participant-reaction", {
                participantId: userId,
                userName,
                reaction,
                timestamp: new Date(),
            });
        });

        // Media status updates
        socket.on(
            "media-status-update",
            async (data: { meetingId: string; video: boolean; audio: boolean; screenSharing: boolean }) => {
                try {
                    const { meetingId, video, audio, screenSharing } = data;

                    const participant = await this.getParticipantBySocket(socket.id);
                    if (participant) {
                        await MeetingParticipant.updateById(participant.id, {
                            "media_status.video_enabled": video,
                            "media_status.audio_enabled": audio,
                            "media_status.screen_sharing": screenSharing,
                            updated_at: new Date(),
                        });
                    }

                    socket.to(meetingId).emit("participant-media-updated", {
                        participantId: userId,
                        video,
                        audio,
                        screenSharing,
                    });
                } catch (error) {
                    log(`Error updating media status: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
                }
            }
        );
    }

    /**
     * 🚀 OPTIMIZED: Handle socket disconnection with Redis cleanup
     */
    private static async handleDisconnection(socket: Socket): Promise<void> {
        const { userId, userName } = socket.data;

        log(`👋 User ${userName} (${userId}) disconnected`, LogTypes.LOGS, "SOCKET_SERVICE");

        // Clean up socket mappings
        this.activeSockets.delete(socket.id);
        const remainingSockets = this.removeUserSocket(userId, socket.id);
        this.socketUsers.delete(socket.id);

        const userFullyOffline = remainingSockets === 0;

        // 🚀 OPTIMIZATION: Update online status in Redis only when last socket disconnects
        if (userFullyOffline) {
            await ChatCacheService.setUserOffline(userId);
        }

        // Handle leaving all meetings
        const rooms = [...socket.rooms];
        for (const room of rooms) {
            if (room !== socket.id) {
                // Check if it's a chat room
                if (room.startsWith("chat_room_")) {
                    if (userFullyOffline) {
                        const roomId = room.replace("chat_room_", "");
                        await ChatCacheService.removeUserFromRoomOnline(roomId, userId);
                    }
                } else {
                    // Meeting room
                    await this.handleLeaveMeeting(socket, room);
                }
            }
        }
    }

    /**
     * ✅ Handle leaving a meeting with improved error handling
     */
    private static async handleLeaveMeeting(socket: Socket, meetingId: string): Promise<void> {
        const { userId, userName } = socket.data;
        let participantId = userId;
        
        try {
            const participant = await MeetingParticipant.findOne({
                meeting_id: meetingId,
                socket_id: socket.id,
            });
            
            participantId = participant?.peer_connection_id || userId;

            await socket.leave(meetingId);

            // ✅ Always clean up from meetingParticipants Map
            this.meetingParticipants.get(meetingId)?.delete(socket.id);

            await WebRTCService.handleParticipantDisconnect(meetingId, userId);

            socket.to(meetingId).emit("participant-left", {
                participantId: participantId,
                userName,
            });

            const remainingParticipants = this.meetingParticipants.get(meetingId)?.size || 0;
            if (remainingParticipants === 0) {
                await WebRTCService.closeMeetingRoom(meetingId);
                this.meetingParticipants.delete(meetingId);
            }

            log(`👋 ${userName} left meeting ${meetingId}`, LogTypes.LOGS, "SOCKET_SERVICE");
        } catch (error) {
            log(`Error leaving meeting: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            
            // ✅ Ensure cleanup even on error to prevent memory leaks
            try {
                this.meetingParticipants.get(meetingId)?.delete(socket.id);
                
                // If no participants left, force cleanup
                const remainingParticipants = this.meetingParticipants.get(meetingId)?.size || 0;
                if (remainingParticipants === 0) {
                    this.meetingParticipants.delete(meetingId);
                    
                    // Best-effort WebRTC cleanup
                    await WebRTCService.closeMeetingRoom(meetingId).catch(err => {
                        log(`Failed to close WebRTC room during error recovery: ${err}`, LogTypes.ERROR, "SOCKET_SERVICE");
                    });
                }
                
                // Best-effort participant notification
                try {
                    socket.to(meetingId).emit("participant-left", {
                        participantId,
                        userName,
                    });
                } catch {
                    // Silently fail broadcast on error
                }
            } catch (cleanupError) {
                log(`Critical error in cleanup fallback: ${cleanupError}`, LogTypes.ERROR, "SOCKET_SERVICE");
            }
        }
    }

    /**
     * Get participant by socket ID
     */
    private static async getParticipantBySocket(socketId: string): Promise<any> {
        const userId = this.socketUsers.get(socketId);
        if (!userId) {
            return null;
        }

        const participants = await MeetingParticipant.find({ user_id: userId });
        return participants.rows?.[0] || null;
    }

    /**
     * Get all participants in a meeting
     */
    private static async getMeetingParticipants(meetingId: string): Promise<any[]> {
        const participants = await MeetingParticipant.find({
            meeting_id: meetingId,
            connection_status: "connected",
        });
        
        return (participants.rows || []).map((p: any) => ({
            participantId: p.peer_connection_id || p.id,
            userId: p.user_id,
            userName: p.participant_name,
            audio: p.media_status?.audio_enabled ?? true,
            video: p.media_status?.video_enabled ?? true,
            screen: p.media_status?.screen_sharing ?? false,
            permissions: p.permissions,
        }));
    }

    // ========================================
    // PUBLIC API METHODS
    // ========================================

    /**
     * Send message to specific user
     */
    public static sendToUser(userId: string, event: string, data: any): void {
        this.emitToUserSockets(userId, event, data);
    }

    /**
     * Send message to all participants in a meeting
     */
    public static sendToMeeting(meetingId: string, event: string, data: any): void {
        this.io.to(meetingId).emit(event, data);
    }

    /**
     * 🚀 OPTIMIZED: Broadcast to chat room with acknowledgment
     */
    public static broadcastToChatRoom(roomId: string, event: string, data: any): void {
        this.io.to(`chat_room_${roomId}`).emit(event, data);
    }

    /**
     * 🚀 OPTIMIZED: Broadcast new chat message with instant sender confirmation
     */
    public static broadcastChatMessage(roomId: string, message: any, senderId: string): void {
        const messageData = {
            type: "new_message",
            data: message,
            timestamp: new Date().toISOString()
        };
        
        // 🚀 OPTIMIZATION: Emit to all sender devices for instant feedback
        this.emitToUserSockets(senderId, "new-chat-message", messageData);
        
        // Get room members and check who's online
        this.broadcastOrQueueMessage(roomId, messageData, senderId).catch(err =>
            log(`Failed to broadcast/queue message: ${err}`, LogTypes.ERROR, "SOCKET_SERVICE")
        );
    }

    /**
     * 🚀 NEW: Broadcast message to online users and queue for offline users
     */
    private static async broadcastOrQueueMessage(roomId: string, messageData: any, senderId: string): Promise<void> {
        try {
            // Get all room members from cache
            const allMembers = await ChatCacheService.getCachedRoomMembers(roomId);
            if (!allMembers) {
                // Fallback: just broadcast to room
                this.io.to(`chat_room_${roomId}`).emit("new-chat-message", messageData);
                return;
            }

            // Get online users in room from cache
            const onlineUsers = await ChatCacheService.getRoomOnlineUsers(roomId);
            
            let onlineCount = 0;
            let queuedCount = 0;

            for (const memberId of allMembers) {
                if (memberId === senderId) continue; // Skip sender

                if (onlineUsers.includes(memberId)) {
                    // User is online, message already broadcast via room
                    onlineCount++;
                } else {
                    // User is offline, queue message
                    this.queueMessageForOfflineUser(memberId, roomId, messageData.data);
                    await ChatCacheService.incrementUnreadCount(memberId, roomId, 1);
                    queuedCount++;
                }
            }

            // Broadcast to room (for online users)
            this.io.to(`chat_room_${roomId}`).emit("new-chat-message", messageData);

            log(
                `📨 Message broadcast to ${onlineCount} online users, queued for ${queuedCount} offline users in room ${roomId}`,
                LogTypes.LOGS,
                "SOCKET_SERVICE"
            );
        } catch (error) {
            log(`Error in broadcastOrQueueMessage: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            // Fallback: just broadcast
            this.io.to(`chat_room_${roomId}`).emit("new-chat-message", messageData);
        }
    }

    /**
     * 🚀 NEW: Queue message for offline user
     */
    private static queueMessageForOfflineUser(userId: string, roomId: string, message: any): void {
        if (!this.pendingMessages.has(userId)) {
            this.pendingMessages.set(userId, []);
        }

        const userQueue = this.pendingMessages.get(userId)!;
        userQueue.push({
            message,
            roomId,
            queuedAt: new Date()
        });

        // Limit queue size to prevent memory issues (max 100 messages per user)
        if (userQueue.length > 100) {
            userQueue.shift(); // Remove oldest message
        }

        log(`📥 Queued message for offline user ${userId} (queue size: ${userQueue.length})`, LogTypes.LOGS, "SOCKET_SERVICE");
    }

    /**
     * 🚀 NEW: Send all pending messages to a user when they connect
     */
    private static async sendPendingMessages(userId: string, socket: Socket): Promise<void> {
        const userQueue = this.pendingMessages.get(userId);
        
        if (!userQueue || userQueue.length === 0) {
            return;
        }

        const count = userQueue.length;
        log(`📬 Delivering ${count} pending messages to user ${userId}`, LogTypes.LOGS, "SOCKET_SERVICE");

        // Send all pending messages
        for (const item of userQueue) {
            socket.emit("new-chat-message", {
                type: "new_message",
                data: item.message,
                timestamp: item.queuedAt.toISOString(),
                queued: true // Flag to indicate this was queued
            });
        }

        // Clear the queue
        this.pendingMessages.delete(userId);

        log(`✅ Delivered ${count} pending messages to user ${userId}`, LogTypes.LOGS, "SOCKET_SERVICE");
    }

    /**
     * 🚀 OPTIMIZATION: Update unread counts for users not in room
     */
    private static async updateUnreadCountsForMessage(roomId: string, senderId: string, messageId: string): Promise<void> {
        try {
            // Get online users in room from cache
            const onlineUsers = await ChatCacheService.getRoomOnlineUsers(roomId);
            
            // Get all room members from cache
            const allMembers = await ChatCacheService.getCachedRoomMembers(roomId);
            
            if (!allMembers) return;
            
            // Increment unread count for members not currently online in room
            for (const memberId of allMembers) {
                if (memberId !== senderId && !onlineUsers.includes(memberId)) {
                    await ChatCacheService.incrementUnreadCount(memberId, roomId, 1);
                }
            }
        } catch (error) {
            log(`Error updating unread counts: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
        }
    }

    /**
     * Broadcast message deletion to room members
     */
    public static broadcastMessageDeleted(roomId: string, messageId: string, deletedBy: string): void {
        this.io.to(`chat_room_${roomId}`).emit("chat-message-deleted", {
            type: "message_deleted",
            data: {
                messageId,
                deletedBy,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Broadcast message seen status to room members
     */
    public static broadcastMessageSeen(roomId: string, messageId: string, seenBy: string): void {
        this.io.to(`chat_room_${roomId}`).emit("chat-message-seen", {
            type: "message_seen",
            data: {
                messageId,
                seenBy,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Broadcast message edited to room members
     */
    public static broadcastMessageEdited(roomId: string, messageId: string, newContent: string, editedBy: string): void {
        this.io.to(`chat_room_${roomId}`).emit("chat-message-edited", {
            type: "message_edited",
            data: {
                messageId,
                newContent,
                editedBy,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Broadcast message reaction to room members
     */
    public static broadcastMessageReaction(roomId: string, messageId: string, emoji: string, userId: string, action: 'add' | 'remove'): void {
        this.io.to(`chat_room_${roomId}`).emit("chat-message-reaction", {
            type: "message_reaction",
            data: {
                messageId,
                emoji,
                userId,
                action,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Broadcast message delivered status to room members
     */
    public static broadcastMessageDelivered(roomId: string, messageId: string, deliveredTo: string): void {
        this.io.to(`chat_room_${roomId}`).emit("chat-message-delivered", {
            type: "message_delivered",
            data: {
                messageId,
                deliveredTo,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * 🚀 OPTIMIZED: Broadcast user status from Redis cache to all relevant chat rooms
     * FIX: Now broadcasts to specific rooms where user is a member for two-way online status
     */
    public static async broadcastUserStatus(userId: string, status: {
        isOnline?: boolean;
        lastSeen?: Date;
        typingInRoom?: string;
        statusMessage?: string;
    }): Promise<void> {
        // Get user's rooms from cache
        const userRooms = await ChatCacheService.getCachedUserRooms(userId);
        
        if (userRooms && userRooms.length > 0) {
            // Broadcast to each room the user is in
            for (const roomId of userRooms) {
                this.io.to(`chat_room_${roomId}`).emit("chat-user-status-update", {
                    userId,
                    ...status,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Also send to the user's own socket for consistency
        this.emitToUserSockets(userId, "chat-user-status-update", {
            userId,
            ...status,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send notification to specific user
     */
    public static notifyChatUser(userId: string, notification: {
        type: "new_chat" | "new_message" | "mention" | "room_created" | "room_deleted" | "room_archived" | "room_messages_cleared";
        data: any;
    }): void {
        this.emitToUserSockets(userId, "chat-notification", {
            ...notification,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Notify all participants in a meeting (like Microsoft Teams notifications)
     */
    public static async notifyMeetingParticipants(
        meetingId: string,
        notification: {
            type: string;
            data: any;
            exclude?: string[];
        }
    ): Promise<void> {
        try {
            const participantSockets = this.meetingParticipants.get(meetingId);
            if (participantSockets) {
                for (const socketId of participantSockets) {
                    const socket = this.activeSockets.get(socketId);
                    if (socket && (!notification.exclude || !notification.exclude.includes(socket.data.userId))) {
                        socket.emit("meeting_notification", notification);
                    }
                }
            }
        } catch (error) {
            log(`Error notifying meeting participants: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
        }
    }

    /**
     * Notify specific participants by their IDs
     */
    public static async notifySpecificParticipants(
        participantIds: string[],
        notification: {
            type: string;
            data: any;
        }
    ): Promise<void> {
        try {
            for (const userId of participantIds) {
                this.emitToUserSockets(userId, "participant_notification", notification);
            }
        } catch (error) {
            log(`Error notifying specific participants: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
        }
    }

    /**
     * 🚀 OPTIMIZED: Get online users from Redis cache
     */
    public static async getChatRoomOnlineUsers(roomId: string): Promise<Array<{
        userId: string;
        userName: string;
        userType: string;
    }>> {
        try {
            // Try cache first
            const cachedUserIds = await ChatCacheService.getRoomOnlineUsers(roomId);
            
            if (cachedUserIds.length > 0) {
                // Map user IDs to full user data
                return cachedUserIds.map(userId => {
                    const socket = this.getFirstActiveSocket(userId);
                    
                    return {
                        userId,
                        userName: socket?.data.userName || "Unknown",
                        userType: socket?.data.userType || "Unknown"
                    };
                });
            }
            
            // Fallback to Socket.IO rooms
            const roomSockets = await this.io.in(`chat_room_${roomId}`).fetchSockets();
            return roomSockets.map(socket => ({
                userId: socket.data.userId,
                userName: socket.data.userName,
                userType: socket.data.userType
            }));
        } catch (error) {
            log(`Error getting chat room online users: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
            return [];
        }
    }

    /**
     * Get list of user IDs who are currently online in a specific chat room
     */
    public static getOnlineUsersInChatRoom(roomId: string): string[] {
        const roomName = `chat_room_${roomId}`;
        const onlineUsers: string[] = [];

        this.io.sockets.sockets.forEach((socket) => {
            if (socket.rooms.has(roomName)) {
                const userId = socket.data?.userId;
                if (userId && !onlineUsers.includes(userId)) {
                    onlineUsers.push(userId);
                }
            }
        });

        return onlineUsers;
    }

    /**
     * Get real-time statistics
     */
    public static getStats(): {
        connectedUsers: number;
        activeMeetings: number;
        totalSockets: number;
        activeChatRooms?: number;
    } {
        return {
            connectedUsers: this.userSockets.size,
            activeMeetings: this.meetingParticipants.size,
            totalSockets: this.activeSockets.size,
            activeChatRooms: 0
        };
    }

    /**
     * Get detailed chat statistics
     */
    public static getChatStats(): {
        totalConnections: number;
        totalUsers: number;
        activeChatRooms: number;
    } {
        return {
            totalConnections: this.activeSockets.size,
            totalUsers: this.userSockets.size,
            activeChatRooms: 0
        };
    }

    /**
     * Cleanup on server shutdown
     */
    public static async cleanup(): Promise<void> {
        try {
            if (this.pubClient) {
                await this.pubClient.quit();
            }
            if (this.subClient) {
                await this.subClient.quit();
            }
            log("✅ Socket service cleanup completed", LogTypes.LOGS, "SOCKET_SERVICE");
        } catch (error) {
            log(`❌ Error during cleanup: ${error}`, LogTypes.ERROR, "SOCKET_SERVICE");
        }
    }
}
