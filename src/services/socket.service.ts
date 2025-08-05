import { Server as HTTPServer } from "node:http";

import { verify } from "hono/jwt";
import { Server as SocketIOServer, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

import {
    type IMeetingParticipant,
    Meeting,
    MeetingChat,
    MeetingParticipant,
} from "@/models/meeting.model";
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
                    socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.replace(
                        "Bearer ",
                        ""
                    );

                if (!token) {
                    return next(new Error("Authentication token missing"));
                }

                const tokenData = await verify(
                    token,
                    config.JWT_SECRET,
                    "HS512"
                );
                if (tokenData instanceof Error) {
                    return next(new Error("Invalid token"));
                }

                const { user_id, user_type, campus_id } =
                    tokenData.payload as any;

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

        console.log(
            "🔌 Socket.IO server initialized for real-time meeting communication"
        );
    }

    /**
     * Handle new socket connection
     */
    private static handleConnection(socket: Socket): void {
        const { userId, userName } = socket.data;

        console.log(
            `👤 User ${userName} (${userId}) connected with socket ${socket.id}`
        );

        // Store socket mappings
        this.activeSockets.set(socket.id, socket);
        this.userSockets.set(userId, socket.id);
        this.socketUsers.set(socket.id, userId);

        // Register event handlers
        this.registerMeetingEvents(socket);
        this.registerChatEvents(socket);
        this.registerWebRTCEvents(socket);
        this.registerPresenceEvents(socket);

        // Handle disconnection
        socket.on("disconnect", () => this.handleDisconnection(socket));
    }

    /**
     * Register meeting-related events
     */
    private static registerMeetingEvents(socket: Socket): void {
        const { userId, userName, campusId } = socket.data;

        // Join meeting room
        socket.on(
            "join-meeting",
            async (data: { meetingId: string; meeting_password?: string }) => {
                try {
                    const { meetingId, meeting_password } = data;

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

                    // Check password if required
                    if (
                        meeting.meeting_password &&
                        meeting.meeting_password !== meeting_password
                    ) {
                        socket.emit("error", {
                            message: "Invalid meeting password",
                        });
                        return;
                    }

                    // Check if meeting is active
                    if (
                        meeting.meeting_status === "ended" ||
                        meeting.meeting_status === "cancelled"
                    ) {
                        socket.emit("error", { message: "Meeting has ended" });
                        return;
                    }

                    // Check participant limit
                    const currentParticipants =
                        this.meetingParticipants.get(meetingId)?.size || 0;
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

                    // Create/update participant record
                    const participantData: Partial<IMeetingParticipant> = {
                        meeting_id: meetingId,
                        user_id: userId,
                        participant_name: userName,
                        participant_email: socket.data.userEmail,
                        connection_status: "connected",
                        joined_at: new Date(),
                        peer_connection_id: uuidv4(),
                        socket_id: socket.id,
                        ip_address: socket.handshake.address,
                        user_agent:
                            socket.handshake.headers["user-agent"] || "",
                        permissions: {
                            can_share_screen: true,
                            can_use_chat: true,
                            can_use_whiteboard: true,
                            is_moderator: meeting.creator_id === userId,
                            is_host: meeting.creator_id === userId,
                        },
                    };

                    const participant =
                        await MeetingParticipant.create(participantData);

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

                    // Notify existing participants
                    socket.to(meetingId).emit("participant-joined", {
                        participantId: participant.id,
                        userName,
                        userId,
                        permissions: participantData.permissions,
                    });

                    // Send meeting info to new participant
                    const existingParticipants =
                        await this.getMeetingParticipants(meetingId);

                    socket.emit("meeting-joined", {
                        meeting,
                        participantId: participant.id,
                        participants: existingParticipants,
                        webrtcConfig: meeting.webrtc_config,
                    });

                    console.log(`✅ ${userName} joined meeting ${meetingId}`);
                } catch (error) {
                    console.error("Error joining meeting:", error);
                    socket.emit("error", { message: "Failed to join meeting" });
                }
            }
        );

        // Leave meeting
        socket.on("leave-meeting", async (data: { meetingId: string }) => {
            await this.handleLeaveMeeting(socket, data.meetingId);
        });

        // Start/stop recording
        socket.on(
            "toggle-recording",
            async (data: { meetingId: string; start: boolean }) => {
                try {
                    const { meetingId, start } = data;

                    // Verify user is host/moderator
                    const participant = await this.getParticipantBySocket(
                        socket.id
                    );
                    if (
                        !participant?.permissions.is_host &&
                        !participant?.permissions.is_moderator
                    ) {
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
                    this.io
                        .to(meetingId)
                        .emit("recording-status-changed", { recording: start });

                    console.log(
                        `🎥 Recording ${start ? "started" : "stopped"} for meeting ${meetingId}`
                    );
                } catch (error) {
                    console.error("Error toggling recording:", error);
                    socket.emit("error", {
                        message: "Failed to toggle recording",
                    });
                }
            }
        );

        // Mute/unmute participant
        socket.on(
            "mute-participant",
            async (data: {
                meetingId: string;
                participantId: string;
                mute: boolean;
            }) => {
                try {
                    const { meetingId, participantId, mute } = data;

                    // Verify user is host/moderator
                    const requester = await this.getParticipantBySocket(
                        socket.id
                    );
                    if (
                        !requester?.permissions.is_host &&
                        !requester?.permissions.is_moderator
                    ) {
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
                    const targetParticipant =
                        await MeetingParticipant.findById(participantId);
                    if (targetParticipant) {
                        const targetSocketId = this.userSockets.get(
                            targetParticipant.user_id
                        );
                        if (targetSocketId) {
                            this.io
                                .to(targetSocketId)
                                .emit("muted-by-host", { muted: mute });
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
            }
        );
    }

    /**
     * Register chat events
     */
    private static registerChatEvents(socket: Socket): void {
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
                    const { meetingId, message, recipientType, recipientId } =
                        data;

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
                        const recipientSocketId =
                            this.userSockets.get(recipientId);
                        if (recipientSocketId) {
                            this.io
                                .to(recipientSocketId)
                                .emit("new-message", chatMessage);
                            socket.emit("new-message", chatMessage); // Send to sender too
                        }
                    } else if (recipientType === "host") {
                        // Send to all hosts/moderators
                        const participants =
                            await this.getMeetingParticipants(meetingId);
                        for (const participant of participants) {
                            if (
                                participant.permissions.is_host ||
                                participant.permissions.is_moderator
                            ) {
                                const socketId = this.userSockets.get(
                                    participant.user_id
                                );
                                if (socketId) {
                                    this.io
                                        .to(socketId)
                                        .emit("new-message", chatMessage);
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
     * Register WebRTC signaling events
     */
    private static registerWebRTCEvents(socket: Socket): void {
        // Create WebRTC transport
        socket.on(
            "create-transport",
            async (data: { meetingId: string; direction: "send" | "recv" }) => {
                try {
                    const { meetingId, direction } = data;
                    const participantId = socket.data.userId;

                    const { transport, params } =
                        await WebRTCService.createWebRtcTransport(
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
            }
        );

        // Connect transport
        socket.on(
            "connect-transport",
            async (data: { transportId: string; dtlsParameters: any }) => {
                try {
                    await WebRTCService.connectTransport(
                        data.transportId,
                        data.dtlsParameters
                    );
                    socket.emit("transport-connected", {
                        transportId: data.transportId,
                    });
                } catch (error) {
                    console.error("Error connecting transport:", error);
                    socket.emit("error", {
                        message: "Failed to connect transport",
                    });
                }
            }
        );

        // Start producing media
        socket.on(
            "produce",
            async (data: {
                meetingId: string;
                kind: "audio" | "video";
                rtpParameters: any;
            }) => {
                try {
                    const { meetingId, kind, rtpParameters } = data;
                    const participantId = socket.data.userId;

                    const { id } = await WebRTCService.produce(
                        meetingId,
                        participantId,
                        rtpParameters,
                        kind
                    );

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
            }
        );

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
                    const {
                        meetingId,
                        producerParticipantId,
                        kind,
                        rtpCapabilities,
                    } = data;
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
        socket.on(
            "raise-hand",
            async (data: { meetingId: string; raised: boolean }) => {
                const { meetingId, raised } = data;

                socket.to(meetingId).emit("hand-raised", {
                    participantId: userId,
                    userName,
                    raised,
                    timestamp: new Date(),
                });
            }
        );

        // Reactions (👍, 👏, ❤️, etc.)
        socket.on(
            "send-reaction",
            async (data: { meetingId: string; reaction: string }) => {
                const { meetingId, reaction } = data;

                this.io.to(meetingId).emit("participant-reaction", {
                    participantId: userId,
                    userName,
                    reaction,
                    timestamp: new Date(),
                });
            }
        );

        // Media status updates
        socket.on(
            "media-status-update",
            async (data: {
                meetingId: string;
                video: boolean;
                audio: boolean;
                screenSharing: boolean;
            }) => {
                try {
                    const { meetingId, video, audio, screenSharing } = data;

                    // Update participant record
                    const participant = await this.getParticipantBySocket(
                        socket.id
                    );
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
    private static async handleLeaveMeeting(
        socket: Socket,
        meetingId: string
    ): Promise<void> {
        try {
            const { userId, userName } = socket.data;

            // Remove from socket room
            await socket.leave(meetingId);

            // Remove from meeting participants
            this.meetingParticipants.get(meetingId)?.delete(socket.id);

            // Handle WebRTC cleanup
            await WebRTCService.handleParticipantDisconnect(meetingId, userId);

            // Notify other participants
            socket.to(meetingId).emit("participant-left", {
                participantId: userId,
                userName,
            });

            // Check if meeting should be ended (no participants left)
            const remainingParticipants =
                this.meetingParticipants.get(meetingId)?.size || 0;
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
    private static async getParticipantBySocket(
        socketId: string
    ): Promise<any> {
        const userId = this.socketUsers.get(socketId);
        if (!userId) return null;

        const participants = await MeetingParticipant.find({ user_id: userId });
        return participants.rows?.[0] || null;
    }

    /**
     * Get all participants in a meeting
     */
    private static async getMeetingParticipants(
        meetingId: string
    ): Promise<any[]> {
        const participants = await MeetingParticipant.find({
            meeting_id: meetingId,
            connection_status: "connected",
        });
        return participants.rows || [];
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
    public static sendToMeeting(
        meetingId: string,
        event: string,
        data: any
    ): void {
        this.io.to(meetingId).emit(event, data);
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
                    if (
                        socket &&
                        (!notification.exclude ||
                            !notification.exclude.includes(socket.data.userId))
                    ) {
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
     * Get real-time statistics
     */
    public static getStats(): {
        connectedUsers: number;
        activeMeetings: number;
        totalSockets: number;
    } {
        return {
            connectedUsers: this.userSockets.size,
            activeMeetings: this.meetingParticipants.size,
            totalSockets: this.activeSockets.size,
        };
    }
}
