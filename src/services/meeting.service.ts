import crypto from "node:crypto";

import { v4 as uuidv4 } from "uuid";

import {
    type IMeetingChat,
    IMeetingData,
    type IMeetingParticipant,
    type IMeetingRecording,
    Meeting,
    MeetingChat,
    MeetingParticipant,
    MeetingRecording,
} from "@/models/meeting.model";
import { User } from "@/models/user.model";
import { MeetingErrorMonitor } from "@/utils/meeting_error_monitor";

import { SocketServiceOptimized as SocketService } from "./socket.service.optimized";
import { WebRTCService } from "./webrtc.service";
import { PushNotificationService } from "./push_notification.service";

// Import email functions
import {
    sendMeetingInvitation,
    sendMeetingReminder,
    sendMeetingCancellation,
    sendMeetingUpdate,
    type MeetingInvitationEmailData,
    type MeetingReminderEmailData,
    type MeetingCancellationEmailData,
    type MeetingUpdateEmailData,
} from "@/libs/mailer";

/**
 * Handle Couchbase DocumentNotFoundError consistently
 */
const handleDocumentNotFoundError = (error: any, context: string, additionalContext?: any): Error => {
    if (error && typeof error === "object" && "name" in error && error.name === "DocumentNotFoundError") {
        MeetingErrorMonitor.logError(`${context}:documentNotFound`, error as Error, additionalContext);
        const notFoundError = new Error("document not found");
        (notFoundError as any).code = "DOCUMENT_NOT_FOUND";
        return notFoundError;
    }
    return error;
};

/**
 * Helper function to send meeting invitations to participants
 */
const sendMeetingInvitations = async (
    meeting: IMeetingData,
    host: any,
    participants: string[],
    meeting_url: string
): Promise<void> => {
    try {
        // Validate email addresses and prepare invitation data
        const validParticipants = participants.map((participantIdentifier) => {
            const isEmail = participantIdentifier.includes('@');
            
            if (isEmail) {
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(participantIdentifier)) {
                    return {
                        email: participantIdentifier,
                        name: participantIdentifier.split('@')[0], // Use email prefix as default name
                        isRegisteredUser: false // We'll try to find if they're registered
                    };
                }
            } else {
                // If it's a user ID, we still need to get their email
                return {
                    userId: participantIdentifier,
                    email: null,
                    name: null,
                    isRegisteredUser: true
                };
            }
            return null;
        }).filter(Boolean);

        // For user IDs, get their email addresses
        const participantData = await Promise.all(
            validParticipants.map(async (participant) => {
                if (!participant) return null;
                
                if (participant.userId) {
                    try {
                        const user = await User.findById(participant.userId);
                        if (user && user.email) {
                            return {
                                email: user.email,
                                name: `${user.first_name} ${user.last_name}`,
                                isRegisteredUser: true
                            };
                        }
                    } catch (error) {
                        MeetingErrorMonitor.logError("sendInvitations:userLookupFailed", error as Error, {
                            meeting_id: meeting.id,
                            participant_id: participant.userId,
                        });
                    }
                } else if (participant.email) {
                    // Try to find if this email belongs to a registered user for better name
                    try {
                        const userResult = await User.find({ email: participant.email });
                        if (userResult.rows && userResult.rows.length > 0) {
                            const user = userResult.rows[0];
                            return {
                                email: participant.email,
                                name: `${user.first_name} ${user.last_name}`,
                                isRegisteredUser: true
                            };
                        }
                    } catch {
                        // Ignore error, use email as is
                    }
                    return participant;
                }
                return null;
            })
        );

        // Send invitations to all valid email addresses
        await Promise.all(
            participantData.filter(Boolean).map(async (participant) => {
                if (!participant || !participant.email) return;

                try {
                    const invitationData: MeetingInvitationEmailData = {
                        participant_name: participant.name || participant.email.split('@')[0],
                        meeting_name: meeting.meeting_name,
                        meeting_description: meeting.meeting_description,
                        meeting_date: meeting.meeting_start_time.toLocaleDateString("en-IN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }),
                        meeting_time: meeting.meeting_start_time.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                        }),
                        meeting_duration: `${Math.ceil(
                            (meeting.meeting_end_time.getTime() - meeting.meeting_start_time.getTime()) / (1000 * 60)
                        )} minutes`,
                        meeting_timezone: "IST",
                        host_name: `${host.first_name} ${host.last_name}`,
                        host_email: host.email,
                        host_phone: host.phone_number,
                        meeting_url,
                        meeting_id: meeting.meeting_room_id,
                        agenda: (meeting.meeting_meta_data as any)?.agenda || "",
                        participants_count: participants.length,
                        email: participant.email,
                    };

                    await sendMeetingInvitation(participant.email, invitationData);
                } catch (emailError) {
                    MeetingErrorMonitor.logError("sendInvitations:emailFailed", emailError as Error, {
                        meeting_id: meeting.id,
                        participant_email: participant.email,
                        is_registered_user: participant.isRegisteredUser,
                    });
                    // Continue with other invitations
                }
            })
        );
    } catch (error) {
        MeetingErrorMonitor.logError("sendInvitations", error as Error, {
            meeting_id: meeting.id,
            participants_count: participants.length,
        });
        // Don't throw error - invitations are non-critical
    }
};

/**
 * Helper function to send meeting cancellation notifications
 */
const sendMeetingCancellations = async (
    meeting: IMeetingData,
    host: any,
    participants: string[],
    cancellation_reason?: string
): Promise<void> => {
    try {
        // Validate email addresses and prepare cancellation data
        const validParticipants = participants.map((participantIdentifier) => {
            const isEmail = participantIdentifier.includes('@');
            
            if (isEmail) {
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(participantIdentifier)) {
                    return {
                        email: participantIdentifier,
                        name: participantIdentifier.split('@')[0], // Use email prefix as default name
                        isRegisteredUser: false
                    };
                }
            } else {
                // If it's a user ID, we need to get their email
                return {
                    userId: participantIdentifier,
                    email: null,
                    name: null,
                    isRegisteredUser: true
                };
            }
            return null;
        }).filter(Boolean);

        // For user IDs, get their email addresses
        const participantData = await Promise.all(
            validParticipants.map(async (participant) => {
                if (!participant) return null;
                
                if (participant.userId) {
                    try {
                        const user = await User.findById(participant.userId);
                        if (user && user.email) {
                            return {
                                email: user.email,
                                name: `${user.first_name} ${user.last_name}`,
                                isRegisteredUser: true
                            };
                        }
                    } catch (error) {
                        MeetingErrorMonitor.logError("sendCancellations:userLookupFailed", error as Error, {
                            meeting_id: meeting.id,
                            participant_id: participant.userId,
                        });
                    }
                } else if (participant.email) {
                    // Try to find if this email belongs to a registered user for better name
                    try {
                        const userResult = await User.find({ email: participant.email });
                        if (userResult.rows && userResult.rows.length > 0) {
                            const user = userResult.rows[0];
                            return {
                                email: participant.email,
                                name: `${user.first_name} ${user.last_name}`,
                                isRegisteredUser: true
                            };
                        }
                    } catch {
                        // Ignore error, use email as is
                    }
                    return participant;
                }
                return null;
            })
        );

        const now = new Date();

        // Send cancellation notifications to all valid email addresses
        await Promise.all(
            participantData.filter(Boolean).map(async (participant) => {
                if (!participant || !participant.email) return;

                try {
                    const cancellationData: MeetingCancellationEmailData = {
                        participant_name: participant.name || participant.email.split('@')[0],
                        meeting_name: meeting.meeting_name,
                        meeting_date: meeting.meeting_start_time.toLocaleDateString("en-IN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }),
                        meeting_time: meeting.meeting_start_time.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                        }),
                        meeting_duration: `${Math.ceil(
                            (meeting.meeting_end_time.getTime() - meeting.meeting_start_time.getTime()) / (1000 * 60)
                        )} minutes`,
                        host_name: `${host.first_name} ${host.last_name}`,
                        host_email: host.email,
                        host_phone: host.phone_number,
                        cancellation_reason,
                        cancellation_date: now.toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }),
                        cancellation_time: now.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                        }),
                        reschedule_available: true,
                        reschedule_url: `https://dev.letscatchup-kcs.com/meetings/reschedule/${meeting.id}`,
                        email: participant.email,
                    };

                    await sendMeetingCancellation(participant.email, cancellationData);
                } catch (emailError) {
                    MeetingErrorMonitor.logError("sendCancellations:emailFailed", emailError as Error, {
                        meeting_id: meeting.id,
                        participant_email: participant.email,
                    });
                    // Continue with other notifications
                }
            })
        );
    } catch (error) {
        MeetingErrorMonitor.logError("sendCancellations", error as Error, {
            meeting_id: meeting.id,
            participants_count: participants.length,
        });
        // Don't throw error - notifications are non-critical
    }
};

/**
 * Helper function to send push notifications for meeting events
 */
const sendMeetingPushNotifications = async (
    meeting: IMeetingData,
    participants: string[],
    notificationType: "invitation" | "reminder" | "started" | "cancelled" | "updated" | "ending_soon",
    additionalData?: Record<string, string | number | boolean>
): Promise<void> => {
    try {
        if (participants.length === 0) {
            return;
        }

        // Prepare notification content based on type
        let title = "";
        let message = "";
        let data: Record<string, string | number | boolean> = {
            meeting_id: meeting.id,
            meeting_name: meeting.meeting_name,
            scheduled_time: meeting.meeting_start_time.toISOString(),
            meeting_room_id: meeting.meeting_room_id || "",
            notification_type: "meeting",
            meeting_event: notificationType,
            ...additionalData,
        };

        switch (notificationType) {
            case "invitation":
                title = "📅 New Meeting Invitation";
                message = `You've been invited to "${meeting.meeting_name}"`;
                break;
            case "reminder":
                title = "⏰ Meeting Reminder";
                message = `"${meeting.meeting_name}" starts soon`;
                break;
            case "started":
                title = "🟢 Meeting Started";
                message = `"${meeting.meeting_name}" has started. Join now!`;
                break;
            case "cancelled":
                title = "❌ Meeting Cancelled";
                message = `"${meeting.meeting_name}" has been cancelled`;
                break;
            case "updated":
                title = "✏️ Meeting Updated";
                message = `"${meeting.meeting_name}" details have been updated`;
                break;
            case "ending_soon":
                title = "⏱️ Meeting Ending Soon";
                message = `"${meeting.meeting_name}" will end in 5 minutes`;
                break;
        }

        // Send push notification to specific users
        const result = await PushNotificationService.sendToSpecificUsers({
            title,
            message,
            data,
            notification_type: "meeting",
            campus_id: meeting.campus_id,
            target_users: participants,
        });

        if (!result.success) {
            MeetingErrorMonitor.logError(
                "sendMeetingPushNotifications:failed",
                new Error(`Push notification failed: ${result.details.errors.join(", ")}`),
                {
                    meeting_id: meeting.id,
                    notification_type: notificationType,
                    participants_count: participants.length,
                }
            );
        }
    } catch (error) {
        MeetingErrorMonitor.logError("sendMeetingPushNotifications", error as Error, {
            meeting_id: meeting.id,
            notification_type: notificationType,
        });
        // Don't throw - push notifications are not critical
    }
};

/**
 * 🎪 Enhanced Meeting Service for Real-time Video Conferencing
 *
 * Supports:
 * - Scalable WebRTC-based video/audio calls
 * - Real-time chat and reactions
 * - Advanced meeting controls and permissions
 * - Recording and analytics
 * - Breakout rooms and collaboration features
 */
export class MeetingService {
    /**
     * Create a new meeting with enhanced real-time features
     */
    public static readonly createMeeting = async (
        campus_id: string,
        creator_id: string,
        data: {
            participants: string[];
            meeting_name: string;
            meeting_description: string;
            meeting_start_time: Date;
            meeting_end_time: Date;
            meeting_location: string;
            meeting_meta_data: object;
            // Enhanced options
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
        }
    ): Promise<IMeetingData> => {
        try {
            const meeting_room_id = `room_${uuidv4()}`;

            // Generate WebRTC configuration
            const webrtc_config = {
                ice_servers: [
                    { urls: ["stun:stun.l.google.com:19302"] },
                    { urls: ["stun:stun1.l.google.com:19302"] },
                    // Add TURN servers for better connectivity
                    WebRTCService.generateTurnCredentials(creator_id),
                ],
                media_constraints: {
                    video: {
                        enabled: data.features?.video_enabled ?? true,
                        quality: "medium" as const,
                        frameRate: 30,
                    },
                    audio: {
                        enabled: data.features?.audio_enabled ?? true,
                        noise_suppression: true,
                        echo_cancellation: true,
                    },
                },
            };

            const meeting = await Meeting.create({
                campus_id,
                creator_id,
                participants: data.participants,
                meeting_name: data.meeting_name,
                meeting_description: data.meeting_description,
                meeting_start_time: data.meeting_start_time,
                meeting_end_time: data.meeting_end_time,
                meeting_location: data.meeting_location,
                meeting_meta_data: data.meeting_meta_data,

                // Enhanced real-time features
                meeting_room_id,
                meeting_type: data.meeting_type || "scheduled",
                meeting_status: data.meeting_type === "instant" ? "live" : "scheduled",
                max_participants: data.max_participants || 100,
                current_participants: [],

                // Security & Access Control
                waiting_room_enabled: data.waiting_room_enabled || false,
                require_host_approval: data.require_host_approval || false,
                allow_guests: true,

                // Meeting Features
                features: {
                    video_enabled: data.features?.video_enabled ?? true,
                    audio_enabled: data.features?.audio_enabled ?? true,
                    screen_sharing_enabled: data.features?.screen_sharing_enabled ?? true,
                    chat_enabled: data.features?.chat_enabled ?? true,
                    recording_enabled: data.features?.recording_enabled ?? false,
                    breakout_rooms_enabled: data.features?.breakout_rooms_enabled ?? false,
                    whiteboard_enabled: data.features?.whiteboard_enabled ?? false,
                    hand_raise_enabled: data.features?.hand_raise_enabled ?? true,
                },

                // Recording Configuration
                recording_config: {
                    auto_record: data.recording_config?.auto_record ?? false,
                    record_video: data.recording_config?.record_video ?? true,
                    record_audio: data.recording_config?.record_audio ?? true,
                    record_chat: data.recording_config?.record_chat ?? false,
                    storage_location: data.recording_config?.storage_location || "cloud",
                    retention_days: data.recording_config?.retention_days || 30,
                },

                // WebRTC Configuration
                webrtc_config,

                // Analytics
                analytics: {
                    total_duration_minutes: 0,
                    peak_participants: 0,
                    total_participants_joined: 0,
                    connection_quality_avg: 0,
                    chat_messages_count: 0,
                    screen_shares_count: 0,
                },

                // Audit Trail
                audit_trail: [
                    {
                        timestamp: new Date(),
                        action: "meeting_created",
                        user_id: creator_id,
                        details: {
                            meeting_type: data.meeting_type || "scheduled",
                            max_participants: data.max_participants || 100,
                        },
                    },
                ],

                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });

            if (!meeting) {
                const error = new Error("Meeting not created");
                MeetingErrorMonitor.logError("createMeeting", error, {
                    campus_id,
                    creator_id,
                    meeting_type: data.meeting_type,
                });
                throw error;
            }

            // If instant meeting, initialize WebRTC infrastructure
            if (data.meeting_type === "instant") {
                try {
                    await WebRTCService.createMeetingRouter(meeting.id);
                } catch (webrtcError) {
                    MeetingErrorMonitor.logError("createMeeting:webrtc", webrtcError as Error, {
                        meeting_id: meeting.id,
                    });
                    // Continue without failing the meeting creation
                }
            }

            // Send meeting invitations to participants (for scheduled meetings)
            if (data.meeting_type !== "instant" && data.participants && data.participants.length > 0) {
                try {
                    // Get host user details
                    const host = await User.findById(creator_id);
                    if (host && host.email) {
                        const meeting_url = `https://dev.letscatchup-kcs.com/meeting/${meeting.meeting_room_id}`;
                        await sendMeetingInvitations(meeting, host, data.participants, meeting_url);
                        
                        // 🔔 Send push notifications to invited participants
                        await sendMeetingPushNotifications(meeting, data.participants, "invitation");
                    }
                } catch (emailError) {
                    MeetingErrorMonitor.logError("createMeeting:invitations", emailError as Error, {
                        meeting_id: meeting.id,
                        participants_count: data.participants.length,
                    });
                    // Continue without failing the meeting creation
                }
            }

            return meeting;
        } catch (error) {
            MeetingErrorMonitor.logError("createMeeting", error as Error, {
                campus_id,
                creator_id,
                meeting_name: data.meeting_name,
            });
            throw error;
        }
    };

    /**
     * Get all meetings by campus where user is creator or participant
     */
    public static readonly getAllMeetings = async (campus_id: string, user_id: string): Promise<IMeetingData[]> => {
        try {
            // Get user details to check email
            let userEmail: string | null = null;
            try {
                const user = await User.findById(user_id);
                userEmail = user?.email || null;
            } catch (error) {
                MeetingErrorMonitor.logError("getAllMeetings:userLookup", error as Error, {
                    user_id,
                });
            }

            // Get all meetings in the campus (not deleted)
            const allMeetings = await Meeting.find(
                { campus_id, is_deleted: false },
                {
                    sort: { updated_at: "DESC" },
                }
            );

            // Return empty array if no meetings found
            if (allMeetings.rows.length === 0) {
                return [];
            }

            // Filter meetings where user is creator or participant
            const relevantMeetings = allMeetings.rows.filter((meeting) => {
                // User is the creator
                if (meeting.creator_id === user_id) {
                    return true;
                }

                // User is in the participants list (by user_id)
                if (meeting.participants && meeting.participants.includes(user_id)) {
                    return true;
                }

                // User is in the participants list (by email)
                if (userEmail && meeting.participants && meeting.participants.includes(userEmail)) {
                    return true;
                }

                return false;
            });

            // Enhance with real-time participant counts
            return await Promise.all(
                relevantMeetings.map(async (meeting) => {
                    try {
                        if (meeting.meeting_status === "live") {
                            const liveParticipants = await MeetingParticipant.find({
                                meeting_id: meeting.id,
                                connection_status: "connected",
                            });
                            meeting.current_participants = liveParticipants.rows?.map((p) => p.user_id) || [];
                        }
                        return meeting;
                    } catch (participantError) {
                        MeetingErrorMonitor.logError("getAllMeetings:participants", participantError as Error, {
                            meeting_id: meeting.id,
                        });
                        // Return meeting without live participant data
                        return meeting;
                    }
                })
            );
        } catch (error) {
            MeetingErrorMonitor.logError("getAllMeetings", error as Error, {
                campus_id,
                user_id,
            });
            throw error;
        }
    };

    /**
     * Get meeting by ID with full real-time details
     */
    public static readonly getMeetingById = async (id: string): Promise<IMeetingData> => {
        try {
            const meeting = await Meeting.findById(id);
            if (!meeting) {
                const error = new Error("Meeting not found");
                MeetingErrorMonitor.logError("getMeetingById:notFound", error, {
                    meeting_id: id,
                });
                throw error;
            }

            // Add real-time participant information
            if (meeting.meeting_status === "live") {
                try {
                    const liveParticipants = await MeetingParticipant.find({
                        meeting_id: id,
                        connection_status: "connected",
                    });
                    meeting.current_participants = liveParticipants.rows?.map((p) => p.user_id) || [];
                } catch (participantError) {
                    MeetingErrorMonitor.logError("getMeetingById:participants", participantError as Error, {
                        meeting_id: id,
                    });
                    // Continue without live participant data
                }
            }

            return meeting;
        } catch (error) {
            // Handle Couchbase DocumentNotFoundError specifically
            const handledError = handleDocumentNotFoundError(error, "getMeetingById", { meeting_id: id });
            if (handledError !== error) {
                throw handledError;
            }

            MeetingErrorMonitor.logError("getMeetingById", error as Error, {
                meeting_id: id,
            });
            throw error;
        }
    };

    /**
     * Get meetings where user is a participant
     * @deprecated Use getAllMeetings instead - this method has the same functionality
     * This method is maintained for backward compatibility
     */
    public static readonly getMeetingByParticipantId = async (
        participant_id: string, 
        campus_id?: string
    ): Promise<IMeetingData[]> => {
        // Get user's email for email-based participant matching
        let user_email: string | undefined;
        try {
            const user = await User.findById(participant_id);
            user_email = user?.email;
        } catch (error) {
            console.warn("Failed to fetch user email for participant matching:", error);
        }

        // Fetch all meetings in the campus (or all if no campus specified)
        const query: any = { is_deleted: false };
        if (campus_id) {
            query.campus_id = campus_id;
        }

        const meetings = await Meeting.find(query, {
            sort: { updated_at: "DESC" },
        });

        // Filter meetings where user is creator OR participant (by ID or email)
        const userMeetings = meetings.rows.filter((meeting: any) => {
            const isCreator = meeting.creator_id === participant_id;
            const isParticipantById = meeting.participants?.includes(participant_id);
            const isParticipantByEmail = user_email && meeting.participants?.includes(user_email);
            
            return isCreator || isParticipantById || isParticipantByEmail;
        });

        // ✅ FIXED: Return empty array instead of throwing error for consistency
        return userMeetings;
    };

    /**
     * Update meeting with audit trail
     */
    public static readonly updateMeeting = async (
        id: string,
        data: Partial<IMeetingData>,
        updated_by?: string
    ): Promise<IMeetingData> => {
        try {
            const meeting = await Meeting.findById(id);
            if (!meeting) {
                const error = new Error("Meeting not found");
                MeetingErrorMonitor.logError("updateMeeting:meetingNotFound", error, { meeting_id: id });
                throw error;
            }

            // Add to audit trail
            const auditEntry = {
                timestamp: new Date(),
                action: "meeting_updated",
                user_id: updated_by || "system",
                details: data,
            };

            try {
                const updatedMeeting = await Meeting.updateById(id, {
                    ...data,
                    audit_trail: [...(meeting.audit_trail || []), auditEntry],
                    updated_at: new Date(),
                });

                if (!updatedMeeting) {
                    const error = new Error("Meeting not updated");
                    MeetingErrorMonitor.logError("updateMeeting:updateFailed", error, { meeting_id: id });
                    throw error;
                }

                // Send update notifications via email if meeting time/date changed
                if (
                    (data.meeting_start_time || data.meeting_end_time || data.meeting_name) &&
                    meeting.participants &&
                    meeting.participants.length > 0
                ) {
                    try {
                        const host = await User.findById(meeting.creator_id);
                        if (host && host.email) {
                            // Get participant user details
                            const participantUsers = await Promise.all(
                                meeting.participants.map(async (participantId) => {
                                    try {
                                        return await User.findById(participantId);
                                    } catch (error) {
                                        return null;
                                    }
                                })
                            );

                            // Send update notifications
                            await Promise.all(
                                participantUsers.map(async (participant) => {
                                    if (!participant || !participant.email) return;

                                    try {
                                        const updateData: MeetingUpdateEmailData = {
                                            participant_name: `${participant.first_name} ${participant.last_name}`,
                                            meeting_name: data.meeting_name || meeting.meeting_name,
                                            old_meeting_date: meeting.meeting_start_time.toLocaleDateString("en-IN"),
                                            old_meeting_time: meeting.meeting_start_time.toLocaleTimeString("en-IN"),
                                            new_meeting_date: (data.meeting_start_time || meeting.meeting_start_time).toLocaleDateString("en-IN", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            }),
                                            new_meeting_time: (data.meeting_start_time || meeting.meeting_start_time).toLocaleTimeString("en-IN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                timeZone: "Asia/Kolkata",
                                            }),
                                            meeting_duration: `${Math.ceil(
                                                ((data.meeting_end_time || meeting.meeting_end_time).getTime() - 
                                                 (data.meeting_start_time || meeting.meeting_start_time).getTime()) / (1000 * 60)
                                            )} minutes`,
                                            host_name: `${host.first_name} ${host.last_name}`,
                                            meeting_url: `https://dev.letscatchup-kcs.com/meeting/${meeting.meeting_room_id}`,
                                            update_reason: "Meeting details have been updated",
                                            changes_summary: Object.keys(data),
                                            email: participant.email,
                                        };

                                        await sendMeetingUpdate(participant.email, updateData);
                                    } catch (emailError) {
                                        MeetingErrorMonitor.logError("updateMeeting:emailFailed", emailError as Error, {
                                            meeting_id: id,
                                            participant_email: participant.email,
                                        });
                                        // Continue with other notifications
                                    }
                                })
                            );
                            
                            // 🔔 Send push notifications to all participants
                            try {
                                await sendMeetingPushNotifications(updatedMeeting, meeting.participants, "updated", {
                                    changes_summary: Object.keys(data).join(", ")
                                });
                            } catch (pushError) {
                                MeetingErrorMonitor.logError("updateMeeting:pushNotifications", pushError as Error, {
                                    meeting_id: id,
                                });
                            }
                        }
                    } catch (emailError) {
                        MeetingErrorMonitor.logError("updateMeeting:emailNotifications", emailError as Error, {
                            meeting_id: id,
                            participants_count: meeting.participants.length,
                        });
                        // Continue - email notifications are non-critical
                    }
                }

                // Notify participants if meeting is live
                if (meeting.meeting_status === "live") {
                    try {
                        SocketService.sendToMeeting(id, "meeting-updated", updatedMeeting);
                    } catch (socketError) {
                        MeetingErrorMonitor.logError("updateMeeting:socket", socketError as Error, {
                            meeting_id: id,
                            meeting_status: meeting.meeting_status,
                        });
                        // Don't fail the update if socket notification fails
                    }
                }

                return updatedMeeting;
            } catch (dbError) {
                MeetingErrorMonitor.logError("updateMeeting:database", dbError as Error, {
                    meeting_id: id,
                    updated_by: updated_by || "system",
                    update_fields: Object.keys(data),
                });
                throw dbError;
            }
        } catch (error) {
            // Handle Couchbase DocumentNotFoundError specifically
            const handledError = handleDocumentNotFoundError(error, "updateMeeting", {
                meeting_id: id,
                updated_by: updated_by || "system",
                update_fields: Object.keys(data),
            });
            if (handledError !== error) {
                throw handledError;
            }

            MeetingErrorMonitor.logError("updateMeeting", error as Error, {
                meeting_id: id,
                updated_by: updated_by || "system",
                update_fields: Object.keys(data),
            });
            throw error;
        }
    };

    /**
     * Delete meeting (soft delete)
     */
    public static readonly deleteMeeting = async (id: string, deleted_by?: string): Promise<IMeetingData> => {
        try {
            const meeting = await Meeting.findById(id);
            if (!meeting) {
                const error = new Error("Meeting not found");
                MeetingErrorMonitor.logError("deleteMeeting:meetingNotFound", error, { meeting_id: id });
                throw error;
            }

            // End meeting if it's live
            if (meeting.meeting_status === "live") {
                try {
                    await MeetingService.endMeeting(id, deleted_by || "system");
                } catch (endError) {
                    MeetingErrorMonitor.logError("deleteMeeting:endMeeting", endError as Error, {
                        meeting_id: id,
                        meeting_status: meeting.meeting_status,
                    });
                    // Continue with deletion even if ending fails
                }
            }

            try {
                // Send cancellation emails before deleting (if meeting is scheduled or live)
                if (meeting.meeting_status === "scheduled" || meeting.meeting_status === "live") {
                    try {
                        const host = await User.findById(meeting.creator_id);
                        if (host && host.email && meeting.participants && meeting.participants.length > 0) {
                            await sendMeetingCancellations(
                                meeting,
                                host,
                                meeting.participants,
                                "Meeting has been cancelled by the organizer"
                            );
                            
                            // 🔔 Send push notifications to all participants
                            await sendMeetingPushNotifications(meeting, meeting.participants, "cancelled", {
                                cancellation_reason: "Meeting has been cancelled by the organizer"
                            });
                        }
                    } catch (emailError) {
                        MeetingErrorMonitor.logError("deleteMeeting:cancellationEmails", emailError as Error, {
                            meeting_id: id,
                            participants_count: meeting.participants?.length || 0,
                        });
                        // Continue with deletion even if emails fail
                    }
                }

                // Update the meeting to mark as deleted
                const updateData = {
                    is_deleted: true,
                    meeting_status: "cancelled", // Use cancelled as closest status
                    updated_at: new Date(),
                };

                // Use Ottoman's updateById method
                const deletedMeeting = await Meeting.updateById(id, updateData);

                if (!deletedMeeting) {
                    const error = new Error("Meeting not deleted");
                    MeetingErrorMonitor.logError("deleteMeeting:deleteFailed", error, { meeting_id: id });
                    throw error;
                }

                return deletedMeeting;
            } catch (dbError) {
                MeetingErrorMonitor.logError("deleteMeeting:database", dbError as Error, {
                    meeting_id: id,
                    deleted_by: deleted_by || "system",
                });
                throw dbError;
            }
        } catch (error) {
            MeetingErrorMonitor.logError("deleteMeeting", error as Error, {
                meeting_id: id,
                deleted_by: deleted_by || "system",
            });
            throw error;
        }
    }; /**
     * Start a scheduled meeting
     */
    public static readonly startMeeting = async (meetingId: string, started_by: string): Promise<IMeetingData> => {
        try {
            const meeting = await Meeting.findById(meetingId);
            if (!meeting) {
                const error = new Error("Meeting not found");
                MeetingErrorMonitor.logError("startMeeting:notFound", error, {
                    meeting_id: meetingId,
                    started_by,
                });
                throw error;
            }

            if (meeting.meeting_status !== "scheduled") {
                const error = new Error("Meeting cannot be started");
                MeetingErrorMonitor.logError("startMeeting:invalidStatus", error, {
                    meeting_id: meetingId,
                    current_status: meeting.meeting_status,
                    started_by,
                });
                throw error;
            }

            // Initialize WebRTC infrastructure
            try {
                await WebRTCService.createMeetingRouter(meetingId);
            } catch (webrtcError) {
                MeetingErrorMonitor.logError("startMeeting:webrtc", webrtcError as Error, { meeting_id: meetingId });
                // Continue without failing the meeting start
            }

            // Update meeting status
            const auditEntry = {
                timestamp: new Date(),
                action: "meeting_started",
                user_id: started_by,
                details: { started_at: new Date() },
            };

            const updatedMeeting = await Meeting.updateById(meetingId, {
                meeting_status: "live",
                audit_trail: [...(meeting.audit_trail || []), auditEntry],
                updated_at: new Date(),
            });

            if (!updatedMeeting) {
                const error = new Error("Failed to start meeting");
                MeetingErrorMonitor.logError("startMeeting:updateFailed", error, { meeting_id: meetingId, started_by });
                throw error;
            }

            // Notify participants
            try {
                SocketService.sendToMeeting(meetingId, "meeting-started", updatedMeeting);
                
                // 🔔 Send push notifications to all participants
                if (meeting.participants && meeting.participants.length > 0) {
                    await sendMeetingPushNotifications(updatedMeeting, meeting.participants, "started");
                }
            } catch (socketError) {
                MeetingErrorMonitor.logError("startMeeting:notification", socketError as Error, {
                    meeting_id: meetingId,
                });
                // Continue without failing the meeting start
            }

            return updatedMeeting;
        } catch (error) {
            // Handle Couchbase DocumentNotFoundError specifically
            const handledError = handleDocumentNotFoundError(error, "startMeeting", {
                meeting_id: meetingId,
                started_by,
            });
            if (handledError !== error) {
                throw handledError;
            }

            MeetingErrorMonitor.logError("startMeeting", error as Error, {
                meeting_id: meetingId,
                started_by,
            });
            throw error;
        }
    };

    /**
     * End a live meeting
     */
    public static readonly endMeeting = async (meetingId: string, ended_by?: string): Promise<IMeetingData> => {
        try {
            const meeting = await Meeting.findById(meetingId);
            if (!meeting) {
                const error = new Error("Meeting not found");
                MeetingErrorMonitor.logError("endMeeting:meetingNotFound", error, { meeting_id: meetingId });
                throw error;
            }

            try {
                // Calculate final analytics
                const participants = await MeetingParticipant.find({
                    meeting_id: meetingId,
                });
                const chatMessages = await MeetingChat.find({
                    meeting_id: meetingId,
                });

                const analytics = {
                    ...meeting.analytics,
                    total_participants_joined: participants.rows?.length || 0,
                    chat_messages_count: chatMessages.rows?.length || 0,
                    total_duration_minutes: Math.floor((Date.now() - meeting.created_at.getTime()) / (1000 * 60)),
                };

                // Clean up WebRTC resources
                try {
                    await WebRTCService.closeMeetingRoom(meetingId);
                } catch (webrtcError) {
                    MeetingErrorMonitor.logError("endMeeting:webrtc", webrtcError as Error, {
                        meeting_id: meetingId,
                    });
                    // Continue even if WebRTC cleanup fails
                }

                // Update meeting status
                const auditEntry = {
                    timestamp: new Date(),
                    action: "meeting_ended",
                    user_id: ended_by || "system",
                    details: {
                        ended_at: new Date(),
                        final_analytics: analytics,
                    },
                };

                const updatedMeeting = await Meeting.updateById(meetingId, {
                    meeting_status: "ended",
                    analytics,
                    audit_trail: [...(meeting.audit_trail || []), auditEntry],
                    updated_at: new Date(),
                });

                if (!updatedMeeting) {
                    const error = new Error("Failed to end meeting");
                    MeetingErrorMonitor.logError("endMeeting:updateFailed", error, { meeting_id: meetingId });
                    throw error;
                }

                // Notify participants
                try {
                    SocketService.sendToMeeting(meetingId, "meeting-ended", {
                        message: "Meeting has ended",
                        analytics,
                    });
                } catch (socketError) {
                    MeetingErrorMonitor.logError("endMeeting:socket", socketError as Error, {
                        meeting_id: meetingId,
                    });
                    // Don't fail if notification fails
                }

                return updatedMeeting;
            } catch (processError) {
                MeetingErrorMonitor.logError("endMeeting:process", processError as Error, {
                    meeting_id: meetingId,
                    ended_by: ended_by || "system",
                });
                throw processError;
            }
        } catch (error) {
            // Handle Couchbase DocumentNotFoundError specifically
            const handledError = handleDocumentNotFoundError(error, "endMeeting", {
                meeting_id: meetingId,
                ended_by: ended_by || "system",
            });
            if (handledError !== error) {
                throw handledError;
            }

            MeetingErrorMonitor.logError("endMeeting", error as Error, {
                meeting_id: meetingId,
                ended_by: ended_by || "system",
            });
            throw error;
        }
    };

    /**
     * Get meeting participants with real-time status
     */
    public static readonly getMeetingParticipants = async (meetingId: string): Promise<IMeetingParticipant[]> => {
        const participants = await MeetingParticipant.find({
            meeting_id: meetingId,
        });
        return participants.rows || [];
    };

    /**
     * Get meeting chat history
     */
    public static readonly getMeetingChat = async (meetingId: string, limit = 100): Promise<IMeetingChat[]> => {
        const messages = await MeetingChat.find(
            { meeting_id: meetingId, is_deleted: false },
            {
                sort: { timestamp: "DESC" },
                limit,
            }
        );
        return messages.rows || [];
    };

    /**
     * Get meeting recordings
     */
    public static readonly getMeetingRecordings = async (meetingId: string): Promise<IMeetingRecording[]> => {
        const recordings = await MeetingRecording.find({
            meeting_id: meetingId,
        });
        return recordings.rows || [];
    };

    /**
     * Generate meeting analytics report
     */
    public static readonly getMeetingAnalytics = async (
        meetingId: string
    ): Promise<{
        meeting: IMeetingData;
        participants: any[];
        chatStats: any;
        connectionQuality: any;
        engagementMetrics: any;
    }> => {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) {
            throw new Error("Meeting not found");
        }

        const participants = await MeetingParticipant.find({
            meeting_id: meetingId,
        });
        const chatMessages = await MeetingChat.find({ meeting_id: meetingId });

        // Calculate engagement metrics
        const totalParticipants = participants.rows?.length || 0;
        const averageParticipationTime =
            totalParticipants > 0
                ? participants.rows!.reduce((sum, p) => {
                      const joinTime = p.joined_at.getTime();
                      const leaveTime = p.left_at?.getTime() || Date.now();
                      return sum + (leaveTime - joinTime);
                  }, 0) /
                  totalParticipants /
                  (1000 * 60) // Convert to minutes
                : 0;

        const chatParticipationRate =
            totalParticipants > 0
                ? (new Set(chatMessages.rows?.map((m) => m.sender_id)).size / totalParticipants) * 100
                : 0;

        return {
            meeting,
            participants: participants.rows || [],
            chatStats: {
                totalMessages: chatMessages.rows?.length || 0,
                uniqueParticipants: new Set(chatMessages.rows?.map((m) => m.sender_id)).size,
                participationRate: chatParticipationRate,
            },
            connectionQuality: {
                averageQuality:
                    participants.rows?.reduce((sum, p) => {
                        const qualityScore = { poor: 1, fair: 2, good: 3, excellent: 4 }[p.connection_quality] || 2;
                        return sum + qualityScore;
                    }, 0) / Math.max(totalParticipants, 1),
                distribution: {
                    poor: participants.rows?.filter((p) => p.connection_quality === "poor").length || 0,
                    fair: participants.rows?.filter((p) => p.connection_quality === "fair").length || 0,
                    good: participants.rows?.filter((p) => p.connection_quality === "good").length || 0,
                    excellent: participants.rows?.filter((p) => p.connection_quality === "excellent").length || 0,
                },
            },
            engagementMetrics: {
                averageParticipationTime,
                chatParticipationRate,
                peakParticipants: meeting.analytics?.peak_participants || 0,
                totalDuration: meeting.analytics?.total_duration_minutes || 0,
            },
        };
    };

    /**
     * Get system-wide meeting statistics
     */
    public static readonly getSystemStats = async (
        campus_id?: string
    ): Promise<{
        activeMeetings: number;
        totalParticipants: number;
        averageMeetingDuration: number;
        popularFeatures: any;
        serverHealth: any;
    }> => {
        const query = campus_id ? { campus_id, meeting_status: "live" } : { meeting_status: "live" };

        const activeMeetings = await Meeting.find(query);

        let totalParticipants = 0;
        for (const meeting of activeMeetings.rows || []) {
            const participants = await MeetingParticipant.find({
                meeting_id: meeting.id,
                connection_status: "connected",
            });
            totalParticipants += participants.rows?.length || 0;
        }

        // Get WebRTC service health
        const serverHealth = WebRTCService.getHealthStatus();
        const socketStats = SocketService.getStats();

        return {
            activeMeetings: activeMeetings.rows?.length || 0,
            totalParticipants,
            averageMeetingDuration: 0, // Calculate from historical data
            popularFeatures: {
                screenSharing: 0,
                recording: 0,
                chat: 0,
            },
            serverHealth: {
                ...serverHealth,
                socketConnections: socketStats,
            },
        };
    };

    /**
     * Add participants to an existing meeting (like Microsoft Teams)
     */
    public static readonly addParticipants = async (
        meeting_id: string,
        participants: Array<{
            user_id?: string;
            email?: string;
            name?: string;
            phone?: string;
            role?: "host" | "co_host" | "presenter" | "attendee";
            added_by: string;
            added_at: Date;
        }>
    ): Promise<IMeetingParticipant[]> => {
        try {
            const meeting = await Meeting.findById(meeting_id);
            if (!meeting) {
                const error = new Error("Meeting not found");
                MeetingErrorMonitor.logError("addParticipants:meetingNotFound", error, { meeting_id });
                throw error;
            }

            // Check if adding participants would exceed max limit
            const currentCount = meeting.current_participants?.length || 0;
            if (currentCount + participants.length > meeting.max_participants) {
                const error = new Error(
                    `Adding ${participants.length} participants would exceed maximum limit of ${meeting.max_participants}`
                );
                MeetingErrorMonitor.logError("addParticipants:limitExceeded", error, {
                    meeting_id,
                    current_count: currentCount,
                    trying_to_add: participants.length,
                    max_limit: meeting.max_participants,
                });
                throw error;
            }

            const addedParticipants: IMeetingParticipant[] = [];

            for (const participantData of participants) {
                try {
                    // Check if participant is already in the meeting
                    const existingParticipant = meeting.current_participants?.find(
                        (p: any) => p.user_id === participantData.user_id || p.email === participantData.email
                    );

                    if (existingParticipant) {
                        continue; // Skip if already a participant
                    }

                    // Try to find user by email to get actual user_id
                    let actualUserId = participantData.user_id;
                    if (!actualUserId && participantData.email) {
                        try {
                            const userLookup = await User.find({
                                email: participantData.email,
                            });
                            if (userLookup.rows.length > 0) {
                                actualUserId = userLookup.rows[0].id;
                            }
                        } catch {
                            // Continue without actual user_id - will create as guest
                            console.log(`Could not find user with email: ${participantData.email}`);
                        }
                    }

                    // Generate required IDs for participant
                    const participantId = uuidv4();

                    // Create participant with proper defaults for required fields
                    const participant: IMeetingParticipant = {
                        id: participantId,
                        meeting_id: meeting_id,
                        user_id: actualUserId || `guest_${participantId}`, // Use actual user_id or generate guest ID
                        participant_name: participantData.name || "Guest",
                        participant_email: participantData.email || undefined,
                        connection_status: "disconnected",
                        connection_quality: "fair",
                        joined_at: new Date(),
                        left_at: undefined,
                        media_status: {
                            video_enabled: true,
                            audio_enabled: true,
                            screen_sharing: false,
                            is_speaking: false,
                            is_muted_by_host: false,
                        },
                        permissions: {
                            can_share_screen: participantData.role !== "attendee",
                            can_use_chat: true,
                            can_use_whiteboard: true,
                            is_moderator: ["host", "co_host"].includes(participantData.role || "attendee"),
                            is_host: participantData.role === "host",
                        },
                        peer_connection_id: `peer_${participantId}`, // Generate valid peer connection ID
                        socket_id: `socket_${participantId}`, // Generate valid socket ID
                        ip_address: "",
                        user_agent: "",
                        created_at: new Date(),
                        updated_at: new Date(),
                    };

                    // Create participant record
                    const participantDoc = new MeetingParticipant(participant);
                    await participantDoc.save();

                    // Add to meeting's current_participants array - using Ottoman updateById
                    const currentParticipants = meeting.current_participants || [];
                    currentParticipants.push(participantId);

                    await Meeting.updateById(meeting_id, {
                        current_participants: currentParticipants,
                        updated_at: new Date(),
                    });

                    addedParticipants.push(participant);
                } catch (participantError) {
                    MeetingErrorMonitor.logError("addParticipants:individual", participantError as Error, {
                        meeting_id,
                        participant_email: participantData.email,
                        participant_user_id: participantData.user_id,
                    });
                    // Continue with other participants
                }
            }

            return addedParticipants;
        } catch (error) {
            MeetingErrorMonitor.logError("addParticipants", error as Error, {
                meeting_id,
                participant_count: participants.length,
            });
            throw error;
        }
    };

    /**
     * Remove participants from meeting (like Microsoft Teams)
     */
    public static readonly removeParticipants = async (
        meeting_id: string,
        participant_ids: string[],
        metadata: {
            removed_by: string;
            removed_at: Date;
            reason: string;
        }
    ): Promise<IMeetingParticipant[]> => {
        try {
            const meeting = await Meeting.findById(meeting_id);
            if (!meeting) {
                const error = new Error("Meeting not found");
                MeetingErrorMonitor.logError("removeParticipants:meetingNotFound", error, { meeting_id });
                throw error;
            }

            const removedParticipants: IMeetingParticipant[] = [];

            for (const participantId of participant_ids) {
                try {
                    // Get participant details before removing
                    const participant = await MeetingParticipant.findOne({
                        id: participantId,
                    });
                    if (participant) {
                        // Update participant record with removal info
                        await MeetingParticipant.findOneAndUpdate(
                            { id: participantId },
                            {
                                left_at: metadata.removed_at,
                                connection_status: "disconnected",
                            }
                        );

                        removedParticipants.push(participant);
                    }

                    // Remove from meeting's current_participants array
                    await Meeting.findByIdAndUpdate(meeting_id, {
                        $pull: { current_participants: participantId },
                        $set: { updated_at: new Date() },
                    });

                    // If meeting is live, notify via Socket.IO that participant was removed
                    if (meeting.meeting_status === "live") {
                        try {
                            // SocketService will handle disconnecting the participant
                            console.log(`Participant ${participantId} removed from live meeting ${meeting_id}`);
                        } catch (socketError) {
                            MeetingErrorMonitor.logError("removeParticipants:socket", socketError as Error, {
                                meeting_id,
                                participant_id: participantId,
                            });
                        }
                    }
                } catch (participantError) {
                    MeetingErrorMonitor.logError("removeParticipants:individual", participantError as Error, {
                        meeting_id,
                        participant_id: participantId,
                    });
                    // Continue with other participants
                }
            }

            return removedParticipants;
        } catch (error) {
            MeetingErrorMonitor.logError("removeParticipants", error as Error, {
                meeting_id,
                participant_count: participant_ids.length,
                removed_by: metadata.removed_by,
            });
            throw error;
        }
    };

    /**
     * Update participant role and permissions (like Microsoft Teams)
     */
    public static readonly updateParticipantRole = async (
        meeting_id: string,
        participant_id: string,
        updates: {
            role: "host" | "co_host" | "presenter" | "attendee";
            permissions?: {
                can_share_screen?: boolean;
                can_unmute_others?: boolean;
                can_manage_participants?: boolean;
                can_record?: boolean;
                can_manage_breakout_rooms?: boolean;
            };
            updated_by: string;
            updated_at: Date;
        }
    ): Promise<IMeetingParticipant> => {
        try {
            const meeting = await Meeting.findById(meeting_id);
            if (!meeting) {
                throw new Error("Meeting not found");
            }

            // Set default permissions based on role matching the interface
            const finalPermissions = {
                can_share_screen: updates.role !== "attendee",
                can_use_chat: true,
                can_use_whiteboard: true,
                is_moderator: ["host", "co_host"].includes(updates.role),
                is_host: updates.role === "host",
            };

            // Update participant record
            const updatedParticipant = await MeetingParticipant.findOneAndUpdate(
                { id: participant_id },
                {
                    permissions: finalPermissions,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!updatedParticipant) {
                throw new Error("Participant not found");
            }

            return updatedParticipant;
        } catch (error) {
            console.error("Error updating participant role:", error);
            throw error;
        }
    };

    /**
     * Search users in campus to add to meeting (like Microsoft Teams directory)
     */
    public static readonly searchUsersForMeeting = async (
        campus_id: string,
        query: string,
        options: {
            exclude_ids?: string[];
            limit?: number;
            user_types?: string[];
        } = {}
    ): Promise<
        Array<{
            id: string;
            full_name: string;
            email: string;
            profile_picture?: string;
            role: string;
            department?: string;
            is_online: boolean;
            last_seen?: Date;
        }>
    > => {
        try {
            // This is a placeholder implementation
            // In a real app, you would query your User model with proper search
            const searchRegex = new RegExp(query, "i");
            const excludeIds = options.exclude_ids || [];
            const limit = options.limit || 20;

            // Mock user search results for demonstration
            // Replace this with actual database query to your User model
            const mockUsers = [
                {
                    id: uuidv4(),
                    full_name: "John Smith",
                    email: "john.smith@company.com",
                    profile_picture: undefined,
                    role: "teacher",
                    department: "Engineering",
                    is_online: true,
                    last_seen: new Date(),
                },
                {
                    id: uuidv4(),
                    full_name: "Mike Johnson",
                    email: "mike.johnson@company.com",
                    profile_picture: undefined,
                    role: "teacher",
                    department: "Design",
                    is_online: false,
                    last_seen: new Date(Date.now() - 3_600_000), // 1 hour ago
                },
                {
                    id: uuidv4(),
                    full_name: "Sarah Wilson",
                    email: "sarah.wilson@company.com",
                    profile_picture: undefined,
                    role: "student",
                    department: "Marketing",
                    is_online: true,
                    last_seen: new Date(),
                },
            ];

            // Filter and return results
            return mockUsers
                .filter(
                    (user) =>
                        !excludeIds.includes(user.id) &&
                        (user.full_name.match(searchRegex) || user.email.match(searchRegex)) &&
                        (options.user_types?.length ? options.user_types.includes(user.role) : true)
                )
                .slice(0, limit);
        } catch (error) {
            console.error("Error searching users:", error);
            throw error;
        }
    };

    /**
     * Send meeting reminders to participants
     */
    public static readonly sendMeetingReminders = async (
        meetingId: string,
        reminderType: "1_hour" | "15_minutes" | "5_minutes" = "15_minutes"
    ): Promise<void> => {
        try {
            const meeting = await Meeting.findById(meetingId);
            if (!meeting) {
                throw new Error("Meeting not found");
            }

            // Only send reminders for scheduled meetings
            if (meeting.meeting_status !== "scheduled") {
                return;
            }

            // Check if meeting is starting soon based on reminder type
            const now = new Date();
            const meetingStartTime = new Date(meeting.meeting_start_time);
            const timeDiffMinutes = Math.floor((meetingStartTime.getTime() - now.getTime()) / (1000 * 60));

            let shouldSendReminder = false;
            let timeRemaining = "";
            let timeLabel = "";
            let urgencyClass = "";
            let urgencyIcon = "";

            switch (reminderType) {
                case "1_hour":
                    shouldSendReminder = timeDiffMinutes <= 60 && timeDiffMinutes > 45;
                    timeRemaining = "1 Hour";
                    timeLabel = "Meeting starts in 1 hour";
                    urgencyClass = "medium";
                    urgencyIcon = "⏰";
                    break;
                case "15_minutes":
                    shouldSendReminder = timeDiffMinutes <= 15 && timeDiffMinutes > 10;
                    timeRemaining = "15 Minutes";
                    timeLabel = "Meeting starts soon";
                    urgencyClass = "medium";
                    urgencyIcon = "⚡";
                    break;
                case "5_minutes":
                    shouldSendReminder = timeDiffMinutes <= 5 && timeDiffMinutes > 0;
                    timeRemaining = "5 Minutes";
                    timeLabel = "Meeting starting now";
                    urgencyClass = "high";
                    urgencyIcon = "🚨";
                    break;
            }

            if (!shouldSendReminder) {
                return;
            }

            // Get host and participants
            const host = await User.findById(meeting.creator_id);
            if (!host || !meeting.participants || meeting.participants.length === 0) {
                return;
            }

            // Get participant user details
            const participantUsers = await Promise.all(
                meeting.participants.map(async (participantId) => {
                    try {
                        return await User.findById(participantId);
                    } catch (error) {
                        return null;
                    }
                })
            );

            // Send reminders to valid participants
            await Promise.all(
                participantUsers.map(async (participant) => {
                    if (!participant || !participant.email) return;

                    try {
                        const reminderData: MeetingReminderEmailData = {
                            participant_name: `${participant.first_name} ${participant.last_name}`,
                            meeting_name: meeting.meeting_name,
                            meeting_date: meetingStartTime.toLocaleDateString("en-IN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            }),
                            meeting_time: meetingStartTime.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Kolkata",
                            }),
                            meeting_duration: `${Math.ceil(
                                (meeting.meeting_end_time.getTime() - meeting.meeting_start_time.getTime()) / (1000 * 60)
                            )} minutes`,
                            host_name: `${host.first_name} ${host.last_name}`,
                            meeting_url: `https://dev.letscatchup-kcs.com/meeting/${meeting.meeting_room_id}`,
                            time_remaining: timeRemaining,
                            time_label: timeLabel,
                            urgency_class: urgencyClass,
                            urgency_icon: urgencyIcon,
                            email: participant.email,
                        };

                        await sendMeetingReminder(participant.email, reminderData);
                    } catch (emailError) {
                        MeetingErrorMonitor.logError("sendReminders:emailFailed", emailError as Error, {
                            meeting_id: meetingId,
                            participant_email: participant.email,
                            reminder_type: reminderType,
                        });
                        // Continue with other reminders
                    }
                })
            );

            // Log successful reminder sending
            MeetingErrorMonitor.logError(
                "sendReminders:success",
                new Error("Meeting reminders sent successfully"),
                {
                    meeting_id: meetingId,
                    reminder_type: reminderType,
                    participants_count: participantUsers.filter((p) => p && p.email).length,
                    time_diff_minutes: timeDiffMinutes,
                }
            );
        } catch (error) {
            MeetingErrorMonitor.logError("sendMeetingReminders", error as Error, {
                meeting_id: meetingId,
                reminder_type: reminderType,
            });
            throw error;
        }
    };
}
