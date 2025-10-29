import { Context } from "hono";

import { IMeetingData } from "@/models/meeting.model";
import { MeetingService } from "@/services/meeting.service";
import { SocketServiceOptimized as SocketService } from "@/services/socket.service.optimized";
import { WebRTCService } from "@/services/webrtc.service";

/**
 * 🎪 Enhanced Meeting Controller for Real-time Video Conferencing
 *
 * Provides REST API endpoints for:
 * - Advanced meeting management
 * - Real-time WebRTC coordination
 * - Meeting analytics and reporting
 * - System health monitoring
 */
export class MeetingController {
    /**
     * Create a new meeting with enhanced real-time features
     */
    public static readonly createMeeting = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const creator_id = ctx.get("user_id");

            const {
                meeting_description,
                meeting_end_time,
                meeting_location,
                meeting_meta_data,
                meeting_name,
                meeting_start_time,
                participants,
                // Enhanced options
                meeting_type = "scheduled",
                max_participants = 100,
                waiting_room_enabled = false,
                require_host_approval = false,
                features,
                recording_config,
            }: {
                participants: string[];
                meeting_name: string;
                meeting_description: string;
                meeting_start_time: string;
                meeting_end_time: string;
                meeting_location: string;
                meeting_meta_data: object;
                meeting_type?: "scheduled" | "instant" | "recurring";
                max_participants?: number;
                waiting_room_enabled?: boolean;
                require_host_approval?: boolean;
                features?: {
                    video_enabled?: boolean;
                    audio_enabled?: boolean;
                    screen_sharing_enabled?: boolean;
                    chat_enabled?: boolean;
                    recording_enabled?: boolean;
                    breakout_rooms_enabled?: boolean;
                    whiteboard_enabled?: boolean;
                    hand_raise_enabled?: boolean;
                };
                recording_config?: {
                    auto_record?: boolean;
                    record_video?: boolean;
                    record_audio?: boolean;
                    record_chat?: boolean;
                    storage_location?: "local" | "cloud";
                    retention_days?: number;
                };
            } = await ctx.req.json();

            const meeting = await MeetingService.createMeeting(campus_id, creator_id, {
                meeting_description,
                meeting_end_time: new Date(meeting_end_time),
                meeting_location,
                meeting_meta_data,
                meeting_name,
                meeting_start_time: new Date(meeting_start_time),
                participants,
                meeting_type,
                max_participants,
                waiting_room_enabled,
                require_host_approval,
                features,
                recording_config,
            });

            return ctx.json({
                success: true,
                data: meeting,
                message: `${meeting_type === "instant" ? "Instant" : "Scheduled"} meeting created successfully`,
            });
        } catch (error) {
            console.error("Error creating meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to create meeting",
                },
                500
            );
        }
    };

    /**
     * Get all meetings with real-time status
     */
    public static readonly getAllMeetings = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const creator_id = ctx.get("user_id");

            const meetings = await MeetingService.getAllMeetings(campus_id, creator_id);

            return ctx.json({
                success: true,
                data: meetings,
                count: meetings.length,
            });
        } catch (error) {
            console.error("Error fetching meetings:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch meetings",
                },
                500
            );
        }
    };

    /**
     * Get meeting by ID with full details
     */
    public static readonly getMeetingById = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();

            const meeting = await MeetingService.getMeetingById(meeting_id);

            // Add real-time statistics if meeting is live
            let liveStats: any = null;
            if (meeting.meeting_status === "live") {
                try {
                    liveStats = await WebRTCService.getMeetingStats(meeting_id);
                } catch (error) {
                    console.warn("Failed to get live stats:", error);
                }
            }

            return ctx.json({
                success: true,
                data: {
                    ...meeting,
                    liveStats,
                },
            });
        } catch (error) {
            console.error("Error fetching meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Meeting not found",
                },
                404
            );
        }
    };

    /**
     * Get meetings where user is a participant
     */
    public static readonly getMeetingByParticipantId = async (ctx: Context) => {
        try {
            const participant_id = ctx.get("user_id");

            const meetings = await MeetingService.getMeetingByParticipantId(participant_id);

            return ctx.json({
                success: true,
                data: meetings,
                count: meetings.length,
            });
        } catch (error) {
            console.error("Error fetching participant meetings:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "No meetings found",
                },
                404
            );
        }
    };

    /**
     * Update meeting with audit trail
     */
    public static readonly updateMeeting = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const data: Partial<IMeetingData> = await ctx.req.json();

            const meeting = await MeetingService.updateMeeting(meeting_id, data, user_id);

            return ctx.json({
                success: true,
                data: meeting,
                message: "Meeting updated successfully",
            });
        } catch (error) {
            console.error("Error updating meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to update meeting",
                },
                500
            );
        }
    };

    /**
     * Delete meeting (soft delete)
     */
    public static readonly deleteMeeting = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const user_id = ctx.get("user_id");

            const meeting = await MeetingService.deleteMeeting(meeting_id, user_id);

            return ctx.json({
                success: true,
                data: meeting,
                message: "Meeting deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to delete meeting",
                },
                500
            );
        }
    };

    /**
     * Start a scheduled meeting
     */
    public static readonly startMeeting = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const user_id = ctx.get("user_id");

            const meeting = await MeetingService.startMeeting(meeting_id, user_id);

            return ctx.json({
                success: true,
                data: meeting,
                message: "Meeting started successfully",
            });
        } catch (error) {
            console.error("Error starting meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to start meeting",
                },
                500
            );
        }
    };

    /**
     * End a live meeting
     */
    public static readonly endMeeting = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const user_id = ctx.get("user_id");

            const meeting = await MeetingService.endMeeting(meeting_id, user_id);

            return ctx.json({
                success: true,
                data: meeting,
                message: "Meeting ended successfully",
            });
        } catch (error) {
            console.error("Error ending meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to end meeting",
                },
                500
            );
        }
    };

    /**
     * Get meeting participants with real-time status
     */
    public static readonly getMeetingParticipants = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();

            const participants = await MeetingService.getMeetingParticipants(meeting_id);

            return ctx.json({
                success: true,
                data: participants,
                count: participants.length,
            });
        } catch (error) {
            console.error("Error fetching participants:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch participants",
                },
                500
            );
        }
    };

    /**
     * Get meeting chat history
     */
    public static readonly getMeetingChat = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const limit = Number(ctx.req.query("limit")) || 100;

            const chatHistory = await MeetingService.getMeetingChat(meeting_id, limit);

            return ctx.json({
                success: true,
                data: chatHistory,
                count: chatHistory.length,
            });
        } catch (error) {
            console.error("Error fetching chat history:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch chat history",
                },
                500
            );
        }
    };

    /**
     * Get meeting recordings
     */
    public static readonly getMeetingRecordings = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();

            const recordings = await MeetingService.getMeetingRecordings(meeting_id);

            return ctx.json({
                success: true,
                data: recordings,
                count: recordings.length,
            });
        } catch (error) {
            console.error("Error fetching recordings:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch recordings",
                },
                500
            );
        }
    };

    /**
     * Get detailed meeting analytics
     */
    public static readonly getMeetingAnalytics = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();

            const analytics = await MeetingService.getMeetingAnalytics(meeting_id);

            return ctx.json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            console.error("Error fetching analytics:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch analytics",
                },
                500
            );
        }
    };

    /**
     * Get WebRTC configuration for a meeting
     */
    public static readonly getWebRTCConfig = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const user_id = ctx.get("user_id");

            const meeting = await MeetingService.getMeetingById(meeting_id);

            // Generate TURN credentials for this user
            const turnCredentials = WebRTCService.generateTurnCredentials(user_id);

            // Enhance WebRTC config with TURN servers
            const webrtcConfig = {
                ...meeting.webrtc_config,
                ice_servers: [...meeting.webrtc_config.ice_servers, turnCredentials],
            };

            return ctx.json({
                success: true,
                data: {
                    webrtcConfig,
                    meetingFeatures: meeting.features,
                    maxParticipants: meeting.max_participants,
                },
            });
        } catch (error) {
            console.error("Error fetching WebRTC config:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to get WebRTC configuration",
                },
                500
            );
        }
    };

    /**
     * Get real-time meeting statistics
     */
    public static readonly getLiveMeetingStats = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();

            const stats = await WebRTCService.getMeetingStats(meeting_id);

            return ctx.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error("Error fetching live stats:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch live statistics",
                },
                500
            );
        }
    };

    /**
     * Get system-wide meeting statistics (Admin only)
     */
    public static readonly getSystemStats = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");
            const campus_id = ctx.get("campus_id");

            // Only admins can view system stats
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        message: "Access denied",
                    },
                    403
                );
            }

            const stats = await MeetingService.getSystemStats(user_type === "Super Admin" ? undefined : campus_id);

            return ctx.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            console.error("Error fetching system stats:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch system statistics",
                },
                500
            );
        }
    };

    /**
     * Health check for meeting infrastructure
     */
    public static readonly getHealthCheck = async (ctx: Context) => {
        try {
            const webrtcHealth = WebRTCService.getHealthStatus();
            const socketStats = SocketService.getStats();

            const overallStatus =
                webrtcHealth.status === "healthy" && socketStats.connectedUsers >= 0 ? "healthy" : webrtcHealth.status;

            return ctx.json({
                success: true,
                status: overallStatus,
                data: {
                    webrtc: webrtcHealth,
                    sockets: socketStats,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            console.error("Error in health check:", error);
            return ctx.json(
                {
                    success: false,
                    status: "unhealthy",
                    message: "Health check failed",
                },
                500
            );
        }
    };

    /**
     * Join meeting with validation
     */
    public static readonly joinMeeting = async (ctx: Context) => {
        try {
            const { meeting_id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            // Verify meeting exists and user has access
            const meeting = await MeetingService.getMeetingById(meeting_id);

            if (meeting.campus_id !== campus_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Access denied",
                    },
                    403
                );
            }

            // Check if meeting is active
            if (meeting.meeting_status === "ended" || meeting.meeting_status === "cancelled") {
                return ctx.json(
                    {
                        success: false,
                        message: "Meeting has ended",
                    },
                    410
                );
            }

            // Return join information
            return ctx.json({
                success: true,
                data: {
                    meeting: {
                        id: meeting.id,
                        name: meeting.meeting_name,
                        status: meeting.meeting_status,
                        features: meeting.features,
                        max_participants: meeting.max_participants,
                        current_participants: meeting.current_participants?.length || 0,
                    },
                    canJoin: true,
                    waitingRoomEnabled: meeting.waiting_room_enabled,
                },
            });
        } catch (error) {
            console.error("Error joining meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to join meeting",
                },
                500
            );
        }
    };
}
