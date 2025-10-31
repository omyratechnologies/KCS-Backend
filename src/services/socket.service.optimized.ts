import { Server as HTTPServer } from "node:http";

import { verify } from "hono/jwt";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

import { type IMeetingParticipant, Meeting, MeetingChat, MeetingParticipant } from "@/models/meeting.model";
import { config } from "@/utils/env";

import { UserService } from "./users.service";
import { WebRTCService } from "./webrtc.service";
import { ChatCacheService } from "./chat_cache.service";
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
    private static userSockets: Map<string, string> = new Map(); // userId -> socketId
    private static socketUsers: Map<string, string> = new Map(); // socketId -> userId
    private static meetingParticipants: Map<string, Set<string>> = new Map(); // meetingId -> socketIds
    
    // Redis clients for pub/sub
    private static pubClient: ReturnType<typeof createClient>;
    private static subClient: ReturnType<typeof createClient>;

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
     * Handle new socket connection
     */
    private static handleConnection(socket: Socket): void {
        const { userId, userName } = socket.data;

        console.log(`👤 User ${userName} (${userId}) connected with socket ${socket.id}`);

        // Store socket mappings
        this.activeSockets.set(socket.id, socket);
        this.userSockets.set(userId, socket.id);
        this.socketUsers.set(socket.id, userId);

        // 🚀 OPTIMIZATION: Set user online in Redis immediately (no DB write)
        ChatCacheService.setUserOnline(userId, socket.id).catch(err => 
            log(`Failed to set user online in cache: ${err}`, LogTypes.ERROR, "SOCKET_SERVICE")
        );

        // Register event handlers
        this.registerMeetingEvents(socket);
        this.registerMeetingChatEvents(socket);
        this.registerGeneralChatEventsOptimized(socket); // OPTIMIZED version
        this.registerWebRTCEvents(socket);
        this.registerPresenceEventsOptimized(socket); // OPTIMIZED version

        // Start heartbeat
        this.startHeartbeat(socket);

        // Handle disconnection
        socket.on("disconnect", () => this.handleDisconnection(socket));
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
                console.error("Error joining meeting:", error);
                socket.emit("error", { message: "Failed to join meeting" });
            }
        });

        // Leave meeting
        socket.on("leave-meeting", async (data: { meetingId: string }) => {
            await this.handleLeaveMeeting(socket, data.meetingId);
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
                        const recipientSocketId = this.userSockets.get(recipientId);
                        if (recipientSocketId) {
                            this.io.to(recipientSocketId).emit("new-message", chatMessage);
                            socket.emit("new-message", chatMessage);
                        }
                    } else if (recipientType === "host") {
                        const participants = await this.getMeetingParticipants(meetingId);
                        for (const participant of participants) {
                            if (participant.permissions.is_host || participant.permissions.is_moderator) {
                                const socketId = this.userSockets.get(participant.user_id);
                                if (socketId) {
                                    this.io.to(socketId).emit("new-message", chatMessage);
                                }
                            }
                        }
                    }

                    await Meeting.updateById(meetingId, {
                        "analytics.chat_messages_count": { $inc: 1 },
                        updated_at: new Date(),
                    });
                } catch (error) {
                    console.error("Error sending chat message:", error);
                    socket.emit("error", { message: "Failed to send message" });
                }
            }
        );

        // 🚀 OPTIMIZED: Typing indicator with Redis cache
        socket.on("typing", async (data: { meetingId: string; typing: boolean }) => {
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
        socket.on("mark-messages-seen", async (data: { roomId: string; messageIds: string[] }) => {
            try {
                const { roomId, messageIds } = data;
                
                // 🚀 OPTIMIZATION: Reset unread count in cache immediately
                await ChatCacheService.resetUnreadCount(userId, roomId);
                
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
                console.error("Error creating transport:", error);
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
                console.error("Error connecting transport:", error);
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
                console.error("Error producing media:", error);
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
                    console.error("Error consuming media:", error);
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
                console.error("Error resuming consumer:", error);
            }
        });

        socket.on("pause-consumer", async (data: { consumerId: string }) => {
            try {
                await WebRTCService.pauseConsumer(data.consumerId);
                socket.emit("consumer-paused", { consumerId: data.consumerId });
            } catch (error) {
                console.error("Error pausing consumer:", error);
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
        this.userSockets.delete(userId);
        this.socketUsers.delete(socket.id);

        // 🚀 OPTIMIZATION: Update online status in Redis (no DB write)
        await ChatCacheService.setUserOffline(userId);

        // Handle leaving all meetings
        const rooms = [...socket.rooms];
        for (const room of rooms) {
            if (room !== socket.id) {
                // Check if it's a chat room
                if (room.startsWith("chat_room_")) {
                    const roomId = room.replace("chat_room_", "");
                    await ChatCacheService.removeUserFromRoomOnline(roomId, userId);
                } else {
                    // Meeting room
                    await this.handleLeaveMeeting(socket, room);
                }
            }
        }
    }

    /**
     * Handle leaving a meeting
     */
    private static async handleLeaveMeeting(socket: Socket, meetingId: string): Promise<void> {
        try {
            const { userId, userName } = socket.data;

            const participant = await MeetingParticipant.findOne({
                meeting_id: meetingId,
                socket_id: socket.id,
            });
            
            const participantId = participant?.peer_connection_id || userId;

            await socket.leave(meetingId);

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
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            const socket = this.activeSockets.get(socketId);
            if (socket) {
                socket.emit(event, data);
            }
        }
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
        
        // 🚀 OPTIMIZATION: Emit to sender first for instant feedback
        const senderSocketId = this.userSockets.get(senderId);
        if (senderSocketId) {
            const socket = this.activeSockets.get(senderSocketId);
            if (socket) {
                socket.emit("new-chat-message", messageData);
            }
        }
        
        // Then broadcast to room (sender will receive again but client can dedupe)
        this.io.to(`chat_room_${roomId}`).emit("new-chat-message", messageData);
        
        // 🚀 OPTIMIZATION: Update unread counts in cache for offline users
        this.updateUnreadCountsForMessage(roomId, senderId, message.id).catch(err =>
            log(`Failed to update unread counts: ${err}`, LogTypes.ERROR, "SOCKET_SERVICE")
        );
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
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            const socket = this.activeSockets.get(socketId);
            if (socket) {
                socket.emit("chat-user-status-update", {
                    userId,
                    ...status,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * Send notification to specific user
     */
    public static notifyChatUser(userId: string, notification: {
        type: "new_chat" | "new_message" | "mention" | "room_created";
        data: any;
    }): void {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            const socket = this.activeSockets.get(socketId);
            if (socket) {
                socket.emit("chat-notification", {
                    ...notification,
                    timestamp: new Date().toISOString()
                });
            }
        }
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
                const socketId = this.userSockets.get(userId);
                if (socketId) {
                    const socket = this.activeSockets.get(socketId);
                    if (socket) {
                        socket.emit("participant_notification", notification);
                    }
                }
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
                    const socketId = this.userSockets.get(userId);
                    const socket = socketId ? this.activeSockets.get(socketId) : null;
                    
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
