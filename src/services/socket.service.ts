import { Server as HTTPServer } from "node:http";

import { verify } from "hono/jwt";
import { Server as SocketIOServer, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

import { type IMeetingParticipant, Meeting, MeetingChat, MeetingParticipant } from "@/models/meeting.model";
import { config } from "@/utils/env";

import { UserService } from "./users.service";
import { WebRTCService } from "./webrtc.service";

/**
 * 🔄 Socket.IO Service for Real-time Meeting Communication
 *
 * Handles:
 * - Real-time signaling for WebRTC
 * - Live chat during meetings
 * - Participant presence updates
 * - Meeting events and notifications
 * - Screen sharing coordination
 * - Hand raising and reactions
 */
export class SocketService {
    private static io: SocketIOServer;
    private static activeSockets: Map<string, Socket> = new Map();
    private static userSockets: Map<string, string> = new Map(); // userId -> socketId
    private static socketUsers: Map<string, string> = new Map(); // socketId -> userId
    private static meetingParticipants: Map<string, Set<string>> = new Map(); // meetingId -> socketIds

    /**
     * Initialize Socket.IO server
     */
    public static initialize(httpServer: HTTPServer): void {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: "*", // Allow all origins for development
                methods: ["GET", "POST"],
                credentials: false, // Note: credentials must be false when origin is "*"
            },
            transports: ["websocket", "polling"],
            pingTimeout: 60_000,
            pingInterval: 25_000,
        });

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

        console.log("🔌 Socket.IO server initialized for real-time meeting communication");
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

        // Register event handlers
        this.registerMeetingEvents(socket);
        this.registerMeetingChatEvents(socket); // Renamed from registerChatEvents
        this.registerGeneralChatEvents(socket); // NEW: General chat system
        this.registerWebRTCEvents(socket);
        this.registerPresenceEvents(socket);

        // Handle disconnection
        socket.on("disconnect", () => this.handleDisconnection(socket));
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
                
                // Use provided userId/userName from payload, fallback to auth data
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

                // Check if meeting is active
                if (meeting.meeting_status === "ended" || meeting.meeting_status === "cancelled") {
                    socket.emit("error", { message: "Meeting has ended" });
                    return;
                }

                // Check participant limit
                const currentParticipants = this.meetingParticipants.get(meetingId)?.size || 0;
                if (currentParticipants >= meeting.max_participants) {
                    socket.emit("error", { message: "Meeting is full" });
                    return;
                }

                // Join socket room
                await socket.join(meetingId);

                // Add to meeting participants
                if (!this.meetingParticipants.has(meetingId)) {
                    this.meetingParticipants.set(meetingId, new Set());
                }
                this.meetingParticipants.get(meetingId)!.add(socket.id);

                // Generate unique session-based participantId
                const participantId = `${meetingId}_${userId}_${Date.now()}`;

                // Create/update participant record
                const participantData: Partial<IMeetingParticipant> = {
                    meeting_id: meetingId,
                    user_id: userId,
                    participant_name: userName,
                    participant_email: socket.data.userEmail,
                    connection_status: "connected",
                    joined_at: new Date(),
                    peer_connection_id: participantId, // Use session-based ID
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

                // Update meeting status to live if not already
                if (meeting.meeting_status === "scheduled") {
                    await Meeting.updateById(meetingId, {
                        meeting_status: "live",
                        updated_at: new Date(),
                    });
                }

                // Create WebRTC router if this is the first participant
                if (currentParticipants === 0) {
                    await WebRTCService.createMeetingRouter(meetingId);
                }

                // Get existing participants before notifying
                const existingParticipants = await this.getMeetingParticipants(meetingId);

                // Get router RTP capabilities for WebRTC initialization
                const rtpCapabilities = WebRTCService.getMeetingRouterRtpCapabilities(meetingId);

                // Notify existing participants about the new joiner
                socket.to(meetingId).emit("participant-joined", {
                    participantId: participantId,
                    userName,
                    userId,
                    audio: true,
                    video: true,
                    screen: false,
                    permissions: participantData.permissions,
                });

                // Send meeting info to new participant
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

        // Start/stop recording
        socket.on("toggle-recording", async (data: { meetingId: string; start: boolean }) => {
            try {
                const { meetingId, start } = data;

                // Verify user is host/moderator
                const participant = await this.getParticipantBySocket(socket.id);
                if (!participant?.permissions.is_host && !participant?.permissions.is_moderator) {
                    socket.emit("error", {
                        message: "Only hosts can control recording",
                    });
                    return;
                }

                // Update meeting recording status
                await Meeting.updateById(meetingId, {
                    "recording_config.auto_record": start,
                    updated_at: new Date(),
                });

                // Notify all participants
                this.io.to(meetingId).emit("recording-status-changed", { recording: start });

                console.log(`🎥 Recording ${start ? "started" : "stopped"} for meeting ${meetingId}`);
            } catch (error) {
                console.error("Error toggling recording:", error);
                socket.emit("error", {
                    message: "Failed to toggle recording",
                });
            }
        });

        // Mute/unmute participant
        socket.on("mute-participant", async (data: { meetingId: string; participantId: string; mute: boolean }) => {
            try {
                const { meetingId, participantId, mute } = data;

                // Verify user is host/moderator
                const requester = await this.getParticipantBySocket(socket.id);
                if (!requester?.permissions.is_host && !requester?.permissions.is_moderator) {
                    socket.emit("error", {
                        message: "Only hosts can mute participants",
                    });
                    return;
                }

                // Update participant media status
                await MeetingParticipant.updateById(participantId, {
                    "media_status.is_muted_by_host": mute,
                    updated_at: new Date(),
                });

                // Notify the participant
                const targetParticipant = await MeetingParticipant.findById(participantId);
                if (targetParticipant) {
                    const targetSocketId = this.userSockets.get(targetParticipant.user_id);
                    if (targetSocketId) {
                        this.io.to(targetSocketId).emit("muted-by-host", { muted: mute });
                    }
                }

                // Notify all participants
                this.io.to(meetingId).emit("participant-muted", {
                    participantId,
                    muted: mute,
                });
            } catch (error) {
                console.error("Error muting participant:", error);
                socket.emit("error", {
                    message: "Failed to mute participant",
                });
            }
        });
    }

    /**
     * Register meeting chat events (chat within meetings)
     */
    private static registerMeetingChatEvents(socket: Socket): void {
        const { userId, userName } = socket.data;

        // Send chat message
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

                    // Verify user is in the meeting
                    const rooms = [...socket.rooms];
                    if (!rooms.includes(meetingId)) {
                        socket.emit("error", { message: "Not in meeting" });
                        return;
                    }

                    // Create chat message
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

                    // Send to appropriate recipients
                    if (recipientType === "all") {
                        this.io.to(meetingId).emit("new-message", chatMessage);
                    } else if (recipientType === "private" && recipientId) {
                        const recipientSocketId = this.userSockets.get(recipientId);
                        if (recipientSocketId) {
                            this.io.to(recipientSocketId).emit("new-message", chatMessage);
                            socket.emit("new-message", chatMessage); // Send to sender too
                        }
                    } else if (recipientType === "host") {
                        // Send to all hosts/moderators
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

                    // Update meeting analytics
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

        // Typing indicator
        socket.on("typing", (data: { meetingId: string; typing: boolean }) => {
            const { meetingId, typing } = data;
            socket.to(meetingId).emit("user-typing", {
                userId: socket.data.userId,
                userName: socket.data.userName,
                typing,
            });
        });
    }

    /**
     * Register general chat system events (separate from meeting chat)
     */
    private static registerGeneralChatEvents(socket: Socket): void {
        const { userId, userName, campusId } = socket.data;

        // Join chat rooms
        socket.on("join-chat-rooms", async (data: { roomIds: string[] }) => {
            try {
                const { roomIds } = data;
                
                // Join all specified rooms
                for (const roomId of roomIds) {
                    await socket.join(`chat_room_${roomId}`);
                }
                
                socket.emit("chat-rooms-joined", { 
                    success: true, 
                    rooms: roomIds,
                    message: "Successfully joined chat rooms" 
                });
                
                console.log(`✅ ${userName} joined ${roomIds.length} chat rooms`);
            } catch (error) {
                console.error("Error joining chat rooms:", error);
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
                
                socket.emit("chat-room-left", { 
                    success: true, 
                    roomId 
                });
                
                console.log(`👋 ${userName} left chat room ${roomId}`);
            } catch (error) {
                console.error("Error leaving chat room:", error);
            }
        });

        // Send chat message (will be called from ChatService, this is for direct WebSocket messages)
        socket.on("send-chat-message", async (data: { 
            roomId: string; 
            content: string; 
            messageType?: string;
            replyTo?: string;
            tempId?: string;
        }) => {
            try {
                const { roomId, content, messageType = 'text', replyTo, tempId } = data;
                
                // Verify user is in the room (this should be validated by ChatService)
                const rooms = [...socket.rooms];
                if (!rooms.includes(`chat_room_${roomId}`)) {
                    socket.emit("error", { message: "Not in chat room" });
                    return;
                }

                // Emit acknowledgment (actual message saving is done via REST API + ChatService)
                socket.emit("chat-message-acknowledged", { 
                    success: true, 
                    roomId,
                    tempId: tempId || null
                });
                
            } catch (error) {
                console.error("Error with chat message:", error);
                socket.emit("error", { message: "Failed to process chat message" });
            }
        });

        // Typing indicator for chat
        socket.on("chat-typing", (data: { roomId: string; isTyping: boolean }) => {
            const { roomId, isTyping } = data;
            
            socket.to(`chat_room_${roomId}`).emit("chat-user-typing", {
                userId,
                userName,
                roomId,
                isTyping,
                timestamp: new Date().toISOString()
            });
        });

        // Mark messages as seen with unread count reset
        socket.on("mark-messages-seen", async (data: { roomId: string; messageIds: string[] }) => {
            try {
                const { roomId, messageIds } = data;
                
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
                
                console.log(`✅ User ${userId} marked ${messageIds.length} messages as seen in room ${roomId}`);
            } catch (error) {
                console.error("Error marking messages seen:", error);
            }
        });

        // User status update (online/away/busy)
        socket.on("update-chat-status", (data: { status: "online" | "away" | "busy" }) => {
            const { status } = data;
            
            // Broadcast status to all users who have chats with this user
            socket.broadcast.emit("chat-user-status-changed", {
                userId,
                status,
                timestamp: new Date().toISOString()
            });
        });

        // Request online users in a room
        socket.on("get-room-online-users", async (data: { roomId: string }) => {
            try {
                const { roomId } = data;
                const roomSockets = await this.io.in(`chat_room_${roomId}`).fetchSockets();
                
                const onlineUsers = roomSockets.map(s => ({
                    userId: s.data.userId,
                    userName: s.data.userName,
                    userType: s.data.userType
                }));
                
                socket.emit("room-online-users", {
                    roomId,
                    users: onlineUsers,
                    count: onlineUsers.length
                });
            } catch (error) {
                console.error("Error getting online users:", error);
                socket.emit("error", { message: "Failed to get online users" });
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
     * Register presence and interaction events
     */
    private static registerPresenceEvents(socket: Socket): void {
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

        // Reactions (👍, 👏, ❤️, etc.)
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

                    // Update participant record
                    const participant = await this.getParticipantBySocket(socket.id);
                    if (participant) {
                        await MeetingParticipant.updateById(participant.id, {
                            "media_status.video_enabled": video,
                            "media_status.audio_enabled": audio,
                            "media_status.screen_sharing": screenSharing,
                            updated_at: new Date(),
                        });
                    }

                    // Notify other participants
                    socket.to(meetingId).emit("participant-media-updated", {
                        participantId: userId,
                        video,
                        audio,
                        screenSharing,
                    });
                } catch (error) {
                    console.error("Error updating media status:", error);
                }
            }
        );
    }

    /**
     * Handle socket disconnection
     */
    private static async handleDisconnection(socket: Socket): Promise<void> {
        const { userId, userName } = socket.data;

        console.log(`👋 User ${userName} (${userId}) disconnected`);

        // Clean up socket mappings
        this.activeSockets.delete(socket.id);
        this.userSockets.delete(userId);
        this.socketUsers.delete(socket.id);

        // Handle leaving all meetings
        const rooms = [...socket.rooms];
        for (const room of rooms) {
            if (room !== socket.id) {
                // Skip socket's own room
                await this.handleLeaveMeeting(socket, room);
            }
        }
    }

    /**
     * Handle leaving a meeting
     */
    private static async handleLeaveMeeting(socket: Socket, meetingId: string): Promise<void> {
        try {
            const { userId, userName } = socket.data;

            // Get participant record to retrieve the session-based participantId
            const participant = await MeetingParticipant.findOne({
                meeting_id: meetingId,
                socket_id: socket.id,
            });
            
            const participantId = participant?.peer_connection_id || userId;

            // Remove from socket room
            await socket.leave(meetingId);

            // Remove from meeting participants
            this.meetingParticipants.get(meetingId)?.delete(socket.id);

            // Handle WebRTC cleanup
            await WebRTCService.handleParticipantDisconnect(meetingId, userId);

            // Notify other participants with session-based participantId
            socket.to(meetingId).emit("participant-left", {
                participantId: participantId,
                userName,
            });

            // Check if meeting should be ended (no participants left)
            const remainingParticipants = this.meetingParticipants.get(meetingId)?.size || 0;
            if (remainingParticipants === 0) {
                await WebRTCService.closeMeetingRoom(meetingId);
                this.meetingParticipants.delete(meetingId);
            }

            console.log(`👋 ${userName} left meeting ${meetingId}`);
        } catch (error) {
            console.error("Error leaving meeting:", error);
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
        
        // Format participants to include media status and session-based participantId
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
     * Broadcast message to a chat room
     */
    public static broadcastToChatRoom(roomId: string, event: string, data: any): void {
        this.io.to(`chat_room_${roomId}`).emit(event, data);
    }

    /**
     * Broadcast new chat message to room members
     */
    public static broadcastChatMessage(roomId: string, message: any): void {
        this.io.to(`chat_room_${roomId}`).emit("new-chat-message", {
            type: "new_message",
            data: message,
            timestamp: new Date().toISOString()
        });
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
     * Broadcast user status change (online/offline/typing) to all relevant chat rooms
     * FIX: Now broadcasts to specific rooms where user is a member for two-way online status
     */
    public static broadcastUserStatus(userId: string, status: {
        isOnline?: boolean;
        lastSeen?: Date;
        typingInRoom?: string;
        statusMessage?: string;
    }): void {
        // Get all chat rooms and broadcast to rooms where user is a member
        this.io.sockets.sockets.forEach((socket) => {
            const socketRooms = [...socket.rooms];
            for (const room of socketRooms) {
                if (room.startsWith('chat_room_')) {
                    // Broadcast to this room
                    this.io.to(room).emit("chat-user-status-update", {
                        userId,
                        ...status,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        
        // Also broadcast globally for users not in specific rooms
        this.io.emit("chat-user-status-update", {
            userId,
            ...status,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Send notification to specific user (for new chat, mentions, etc.)
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
     * Get online users in a specific chat room
     */
    public static async getChatRoomOnlineUsers(roomId: string): Promise<Array<{
        userId: string;
        userName: string;
        userType: string;
    }>> {
        try {
            const roomSockets = await this.io.in(`chat_room_${roomId}`).fetchSockets();
            return roomSockets.map(socket => ({
                userId: socket.data.userId,
                userName: socket.data.userName,
                userType: socket.data.userType
            }));
        } catch (error) {
            console.error("Error getting chat room online users:", error);
            return [];
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
            console.error("Error notifying meeting participants:", error);
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
            console.error("Error notifying specific participants:", error);
        }
    }

    /**
     * Get real-time statistics (including chat)
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
            activeChatRooms: 0 // Will be calculated dynamically if needed
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
            activeChatRooms: 0 // Can be enhanced to track active chat rooms
        };
    }

    /**
     * Get list of user IDs who are currently online in a specific chat room
     * A user is considered "in room" if they have an active WebSocket connection
     * and are joined to the room
     */
    public static getOnlineUsersInChatRoom(roomId: string): string[] {
        const roomName = `chat_room_${roomId}`;
        const onlineUsers: string[] = [];

        // Iterate through all connected sockets to find users in this room
        this.io.sockets.sockets.forEach((socket) => {
            // Check if socket is in the room
            if (socket.rooms.has(roomName)) {
                const userId = socket.data?.user_id;
                if (userId && !onlineUsers.includes(userId)) {
                    onlineUsers.push(userId);
                }
            }
        });

        return onlineUsers;
    }
}
