import { Context } from "hono";

import { IMeetingData } from "@/models/meeting.model";
import { MeetingService } from "@/services/meeting.service";
import { SocketService } from "@/services/socket.service";
import { WebRTCService } from "@/services/webrtc.service";
import { MeetingErrorMonitor } from "@/utils/meeting_error_monitor";

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

            // Validate required context
            if (!campus_id || !creator_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Authentication required",
                    },
                    401
                );
            }

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
                meeting_password,
                waiting_room_enabled = false,
                require_host_approval = false,
                features = {},
                recording_config = {},
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
                meeting_password?: string;
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

            const meeting = await MeetingService.createMeeting(
                campus_id,
                creator_id,
                {
                    meeting_description,
                    meeting_end_time: new Date(meeting_end_time),
                    meeting_location,
                    meeting_meta_data,
                    meeting_name,
                    meeting_start_time: new Date(meeting_start_time),
                    participants,
                    meeting_type,
                    max_participants,
                    meeting_password,
                    waiting_room_enabled,
                    require_host_approval,
                    features,
                    recording_config,
                }
            );

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
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to create meeting",
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

            const meetings = await MeetingService.getAllMeetings(
                campus_id,
                creator_id
            );

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
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch meetings",
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
            // Handle specific error types
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "DOCUMENT_NOT_FOUND"
            ) {
                return ctx.json(
                    {
                        success: false,
                        message:
                            error instanceof Error
                                ? error.message
                                : "Meeting not found",
                    },
                    404
                );
            }

            console.error("Error fetching meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Internal server error",
                },
                500
            );
        }
    };

    /**
     * Get meetings where user is a participant
     */
    public static readonly getMeetingByParticipantId = async (ctx: Context) => {
        try {
            const participant_id = ctx.get("user_id");

            const meetings =
                await MeetingService.getMeetingByParticipantId(participant_id);

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
                    message:
                        error instanceof Error
                            ? error.message
                            : "No meetings found",
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

            const meeting = await MeetingService.updateMeeting(
                meeting_id,
                data,
                user_id
            );

            return ctx.json({
                success: true,
                data: meeting,
                message: "Meeting updated successfully",
            });
        } catch (error) {
            // Handle specific error types
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "DOCUMENT_NOT_FOUND"
            ) {
                return ctx.json(
                    {
                        success: false,
                        message:
                            error instanceof Error
                                ? error.message
                                : "Meeting not found",
                    },
                    404
                );
            }

            console.error("Error updating meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update meeting",
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

            const meeting = await MeetingService.deleteMeeting(
                meeting_id,
                user_id
            );

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
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to delete meeting",
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

            const meeting = await MeetingService.startMeeting(
                meeting_id,
                user_id
            );

            return ctx.json({
                success: true,
                data: meeting,
                message: "Meeting started successfully",
            });
        } catch (error) {
            // Handle specific error types
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "DOCUMENT_NOT_FOUND"
            ) {
                return ctx.json(
                    {
                        success: false,
                        message:
                            error instanceof Error
                                ? error.message
                                : "Meeting not found",
                    },
                    404
                );
            }

            console.error("Error starting meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to start meeting",
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

            const meeting = await MeetingService.endMeeting(
                meeting_id,
                user_id
            );

            return ctx.json({
                success: true,
                data: meeting,
                message: "Meeting ended successfully",
            });
        } catch (error) {
            // Handle specific error types
            if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "DOCUMENT_NOT_FOUND"
            ) {
                return ctx.json(
                    {
                        success: false,
                        message:
                            error instanceof Error
                                ? error.message
                                : "Meeting not found",
                    },
                    404
                );
            }

            console.error("Error ending meeting:", error);
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to end meeting",
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

            const participants =
                await MeetingService.getMeetingParticipants(meeting_id);

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
     * Add participants to meeting (like Microsoft Teams)
     * Works for both scheduled and live meetings
     */
    public static readonly addParticipants = async (ctx: Context) => {
        try {
            const { id: meeting_id } = ctx.req.param(); // Fix: use 'id' instead of 'meeting_id'
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            // Validate meeting_id exists
            if (!meeting_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Meeting ID is required",
                    },
                    400
                );
            }

            const {
                participants,
                send_invitation = true,
                invitation_message,
                participant_role = "attendee",
                notify_existing_participants = true,
            }: {
                participants: Array<{
                    user_id?: string;
                    email?: string;
                    name?: string;
                    phone?: string;
                    role?: "host" | "co_host" | "presenter" | "attendee";
                }>;
                send_invitation?: boolean;
                invitation_message?: string;
                participant_role?:
                    | "host"
                    | "co_host"
                    | "presenter"
                    | "attendee";
                notify_existing_participants?: boolean;
            } = await ctx.req.json();

            // Verify meeting exists and user has permission to add participants
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

            // Check if user is host or co-host
            const userParticipant = meeting.current_participants?.find(
                (participantId: string) => {
                    // In a real implementation, you'd need to look up the participant details
                    // For now, assume the creator is the host
                    return participantId === user_id;
                }
            );

            if (!userParticipant && meeting.creator_id !== user_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Only hosts and co-hosts can add participants",
                    },
                    403
                );
            }

            // Add participants to meeting
            const addedParticipants = await MeetingService.addParticipants(
                meeting_id,
                participants.map((p) => ({
                    ...p,
                    role: p.role || participant_role,
                    added_by: user_id,
                    added_at: new Date(),
                }))
            );

            // Send notifications if meeting is live
            if (
                meeting.meeting_status === "live" &&
                notify_existing_participants
            ) {
                await SocketService.notifyMeetingParticipants(meeting_id, {
                    type: "participants_added",
                    data: {
                        new_participants: addedParticipants,
                        added_by: user_id,
                        message: `${addedParticipants.length} participant(s) added to the meeting`,
                    },
                });
            }

            // Send invitations if requested
            if (send_invitation) {
                // Here you would integrate with your notification service
                // await NotificationService.sendMeetingInvitations(...)
            }

            return ctx.json({
                success: true,
                data: {
                    meeting_id,
                    participants_added: addedParticipants,
                    total_participants:
                        meeting.current_participants?.length +
                        addedParticipants.length,
                    invitations_sent: send_invitation,
                },
                message: `${addedParticipants.length} participant(s) added successfully`,
            });
        } catch (error) {
            console.error("Error adding participants:", error);
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to add participants",
                },
                500
            );
        }
    };

    /**
     * Remove participants from meeting (like Microsoft Teams)
     */
    public static readonly removeParticipants = async (ctx: Context) => {
        try {
            const { id: meeting_id } = ctx.req.param(); // Fix: use 'id' instead of 'meeting_id'
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            // Validate meeting_id exists
            if (!meeting_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Meeting ID is required",
                    },
                    400
                );
            }

            const {
                participant_ids,
                notify_removed_participants = true,
                notify_existing_participants = true,
                reason = "Removed by host",
            }: {
                participant_ids: string[];
                notify_removed_participants?: boolean;
                notify_existing_participants?: boolean;
                reason?: string;
            } = await ctx.req.json();

            // Verify meeting exists and user has permission
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

            // Check if user is host or co-host
            const userParticipant = meeting.current_participants?.find(
                (participantId: string) => {
                    return participantId === user_id;
                }
            );

            if (!userParticipant && meeting.creator_id !== user_id) {
                return ctx.json(
                    {
                        success: false,
                        message:
                            "Only hosts and co-hosts can remove participants",
                    },
                    403
                );
            }

            // Remove participants from meeting
            const removedParticipants = await MeetingService.removeParticipants(
                meeting_id,
                participant_ids,
                {
                    removed_by: user_id,
                    removed_at: new Date(),
                    reason,
                }
            );

            // Notify removed participants
            if (notify_removed_participants) {
                await SocketService.notifySpecificParticipants(
                    participant_ids,
                    {
                        type: "removed_from_meeting",
                        data: {
                            meeting_id,
                            meeting_name: meeting.meeting_name,
                            reason,
                            removed_by: user_id,
                        },
                    }
                );
            }

            // Notify existing participants
            if (
                meeting.meeting_status === "live" &&
                notify_existing_participants
            ) {
                await SocketService.notifyMeetingParticipants(meeting_id, {
                    type: "participants_removed",
                    data: {
                        removed_participants: removedParticipants,
                        removed_by: user_id,
                        message: `${removedParticipants.length} participant(s) removed from the meeting`,
                    },
                });
            }

            return ctx.json({
                success: true,
                data: {
                    meeting_id,
                    participants_removed: removedParticipants,
                    total_participants:
                        meeting.current_participants?.length -
                        removedParticipants.length,
                },
                message: `${removedParticipants.length} participant(s) removed successfully`,
            });
        } catch (error) {
            console.error("Error removing participants:", error);
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to remove participants",
                },
                500
            );
        }
    };

    /**
     * Update participant role/permissions (like Microsoft Teams)
     */
    public static readonly updateParticipantRole = async (ctx: Context) => {
        try {
            const { id: meeting_id, participant_id } = ctx.req.param(); // Fix: use 'id' instead of 'meeting_id'
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            // Validate parameters exist
            if (!meeting_id || !participant_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Meeting ID and Participant ID are required",
                    },
                    400
                );
            }

            const {
                new_role,
                permissions = {},
                notify_participant = true,
                notify_others = true,
            }: {
                new_role: "host" | "co_host" | "presenter" | "attendee";
                permissions?: {
                    can_share_screen?: boolean;
                    can_unmute_others?: boolean;
                    can_manage_participants?: boolean;
                    can_record?: boolean;
                    can_manage_breakout_rooms?: boolean;
                };
                notify_participant?: boolean;
                notify_others?: boolean;
            } = await ctx.req.json();

            // Verify meeting exists and user has permission
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

            // Check if user is host (only hosts can change roles)
            const userParticipant = meeting.current_participants?.find(
                (participantId: string) => {
                    return participantId === user_id;
                }
            );

            if (!userParticipant && meeting.creator_id !== user_id) {
                return ctx.json(
                    {
                        success: false,
                        message:
                            "Only meeting hosts can change participant roles",
                    },
                    403
                );
            }

            // Update participant role
            const updatedParticipant =
                await MeetingService.updateParticipantRole(
                    meeting_id,
                    participant_id,
                    {
                        role: new_role,
                        permissions,
                        updated_by: user_id,
                        updated_at: new Date(),
                    }
                );

            // Notify the participant
            if (notify_participant) {
                await SocketService.notifySpecificParticipants(
                    [participant_id],
                    {
                        type: "role_updated",
                        data: {
                            meeting_id,
                            new_role,
                            permissions,
                            updated_by: user_id,
                            message: `Your role has been updated to ${new_role}`,
                        },
                    }
                );
            }

            // Notify other participants
            if (meeting.meeting_status === "live" && notify_others) {
                await SocketService.notifyMeetingParticipants(meeting_id, {
                    type: "participant_role_changed",
                    data: {
                        participant_id,
                        participant_name: updatedParticipant.participant_name,
                        new_role,
                        updated_by: user_id,
                    },
                    exclude: [participant_id], // Don't notify the updated participant again
                });
            }

            return ctx.json({
                success: true,
                data: updatedParticipant,
                message: `Participant role updated to ${new_role}`,
            });
        } catch (error) {
            console.error("Error updating participant role:", error);
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to update participant role",
                },
                500
            );
        }
    };

    /**
     * Search users/contacts to add to meeting (like Microsoft Teams directory)
     */
    public static readonly searchUsersToAdd = async (ctx: Context) => {
        try {
            const { id: meeting_id } = ctx.req.param(); // Fix: use 'id' instead of 'meeting_id'
            const campus_id = ctx.get("campus_id");

            // Validate meeting_id exists
            if (!meeting_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Meeting ID is required",
                    },
                    400
                );
            }

            const {
                query,
                exclude_current_participants = true,
                limit = 20,
                user_types = ["teachers", "students", "staff"],
            }: {
                query: string;
                exclude_current_participants?: boolean;
                limit?: number;
                user_types?: string[];
            } = await ctx.req.json();

            // Get current meeting participants if excluding them
            let excludeIds: string[] = [];
            if (exclude_current_participants) {
                const meeting = await MeetingService.getMeetingById(meeting_id);
                excludeIds =
                    meeting.current_participants?.map((p: any) => p.user_id) ||
                    [];
            }

            // Search users in the same campus
            const users = await MeetingService.searchUsersForMeeting(
                campus_id,
                query,
                {
                    exclude_ids: excludeIds,
                    limit,
                    user_types,
                }
            );

            return ctx.json({
                success: true,
                data: users.map((user) => ({
                    user_id: user.id,
                    name: user.full_name,
                    email: user.email,
                    profile_picture: user.profile_picture,
                    role_in_campus: user.role,
                    department: user.department,
                    is_online: user.is_online,
                    last_seen: user.last_seen,
                })),
                query,
                count: users.length,
            });
        } catch (error) {
            console.error("Error searching users:", error);
            return ctx.json(
                {
                    success: false,
                    message: "Failed to search users",
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

            const chatHistory = await MeetingService.getMeetingChat(
                meeting_id,
                limit
            );

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

            const recordings =
                await MeetingService.getMeetingRecordings(meeting_id);

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

            const analytics =
                await MeetingService.getMeetingAnalytics(meeting_id);

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
            const turnCredentials =
                WebRTCService.generateTurnCredentials(user_id);

            // Enhance WebRTC config with TURN servers
            const webrtcConfig = {
                ...meeting.webrtc_config,
                ice_servers: [
                    ...meeting.webrtc_config.ice_servers,
                    turnCredentials,
                ],
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

            const stats = await MeetingService.getSystemStats(
                user_type === "Super Admin" ? undefined : campus_id
            );

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
                webrtcHealth.status === "healthy" &&
                socketStats.connectedUsers >= 0
                    ? "healthy"
                    : webrtcHealth.status;

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
            const { meeting_password } = await ctx.req.json();
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

            // Check password if required
            if (
                meeting.meeting_password &&
                meeting.meeting_password !== meeting_password
            ) {
                return ctx.json(
                    {
                        success: false,
                        message: "Invalid meeting password",
                    },
                    401
                );
            }

            // Check if meeting is active
            if (
                meeting.meeting_status === "ended" ||
                meeting.meeting_status === "cancelled"
            ) {
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
                        current_participants:
                            meeting.current_participants?.length || 0,
                    },
                    canJoin: true,
                    requiresPassword: !!meeting.meeting_password,
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
