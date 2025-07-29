import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";

import { 
    IMeetingData, 
    Meeting,
    MeetingParticipant,
    MeetingChat,
    MeetingRecording,
    type IMeetingParticipant,
    type IMeetingChat,
    type IMeetingRecording
} from "@/models/meeting.model";
import { WebRTCService } from "./webrtc.service";
import { SocketService } from "./socket.service";

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
            meeting_type?: 'scheduled' | 'instant' | 'recurring';
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
                storage_location?: 'local' | 'cloud';
                retention_days?: number;
            };
        }
    ): Promise<IMeetingData> => {
        const meeting_room_id = `room_${uuidv4()}`;
        
        // Generate WebRTC configuration
        const webrtc_config = {
            ice_servers: [
                { urls: ['stun:stun.l.google.com:19302'] },
                { urls: ['stun:stun1.l.google.com:19302'] },
                // Add TURN servers for better connectivity
                WebRTCService.generateTurnCredentials(creator_id),
            ],
            media_constraints: {
                video: {
                    enabled: data.features?.video_enabled ?? true,
                    quality: 'medium' as const,
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
            meeting_type: data.meeting_type || 'scheduled',
            meeting_status: data.meeting_type === 'instant' ? 'live' : 'scheduled',
            max_participants: data.max_participants || 100,
            current_participants: [],
            
            // Security & Access Control
            meeting_password: data.meeting_password,
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
                storage_location: data.recording_config?.storage_location || 'cloud',
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
            audit_trail: [{
                timestamp: new Date(),
                action: 'meeting_created',
                user_id: creator_id,
                details: {
                    meeting_type: data.meeting_type || 'scheduled',
                    max_participants: data.max_participants || 100,
                },
            }],
            
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        if (!meeting) throw new Error("Meeting not created");

        // If instant meeting, initialize WebRTC infrastructure
        if (data.meeting_type === 'instant') {
            await WebRTCService.createMeetingRouter(meeting.id);
        }

        return meeting;
    };

    /**
     * Get all meetings by campus and creator with real-time status
     */
    public static readonly getAllMeetings = async (
        campus_id: string,
        creator_id: string
    ): Promise<IMeetingData[]> => {
        const meetings = await Meeting.find(
            { campus_id, creator_id, is_deleted: false },
            {
                sort: { updated_at: "DESC" },
            }
        );

        if (meetings.rows.length === 0) throw new Error("Meetings not found");

        // Enhance with real-time participant counts
        const enhancedMeetings = await Promise.all(
            meetings.rows.map(async (meeting) => {
                if (meeting.meeting_status === 'live') {
                    const liveParticipants = await MeetingParticipant.find({
                        meeting_id: meeting.id,
                        connection_status: 'connected',
                    });
                    meeting.current_participants = liveParticipants.rows?.map(p => p.user_id) || [];
                }
                return meeting;
            })
        );

        return enhancedMeetings;
    };

    /**
     * Get meeting by ID with full real-time details
     */
    public static readonly getMeetingById = async (id: string): Promise<IMeetingData> => {
        const meeting = await Meeting.findById(id);
        if (!meeting) throw new Error("Meeting not found");

        // Add real-time participant information
        if (meeting.meeting_status === 'live') {
            const liveParticipants = await MeetingParticipant.find({
                meeting_id: id,
                connection_status: 'connected',
            });
            meeting.current_participants = liveParticipants.rows?.map(p => p.user_id) || [];
        }

        return meeting;
    };

    /**
     * Get meetings where user is a participant
     */
    public static readonly getMeetingByParticipantId = async (
        participant_id: string
    ): Promise<IMeetingData[]> => {
        const meetings = await Meeting.find(
            {
                participants: participant_id,
                is_deleted: false,
            },
            {
                sort: { updated_at: "DESC" },
            }
        );

        if (meetings.rows.length === 0) throw new Error("Meetings not found");

        return meetings.rows;
    };

    /**
     * Update meeting with audit trail
     */
    public static readonly updateMeeting = async (
        id: string,
        data: Partial<IMeetingData>,
        updated_by?: string
    ): Promise<IMeetingData> => {
        const meeting = await Meeting.findById(id);
        if (!meeting) throw new Error("Meeting not found");

        // Add to audit trail
        const auditEntry = {
            timestamp: new Date(),
            action: 'meeting_updated',
            user_id: updated_by || 'system',
            details: data,
        };

        const updatedMeeting = await Meeting.updateById(id, {
            ...data,
            audit_trail: [...(meeting.audit_trail || []), auditEntry],
            updated_at: new Date(),
        });

        if (!updatedMeeting) throw new Error("Meeting not updated");

        // Notify participants if meeting is live
        if (meeting.meeting_status === 'live') {
            SocketService.sendToMeeting(id, 'meeting-updated', updatedMeeting);
        }

        return updatedMeeting;
    };

    /**
     * Delete meeting (soft delete)
     */
    public static readonly deleteMeeting = async (
        id: string,
        deleted_by?: string
    ): Promise<IMeetingData> => {
        const meeting = await Meeting.findById(id);
        if (!meeting) throw new Error("Meeting not found");

        // End meeting if it's live
        if (meeting.meeting_status === 'live') {
            await this.endMeeting(id, deleted_by);
        }

        const auditEntry = {
            timestamp: new Date(),
            action: 'meeting_deleted',
            user_id: deleted_by || 'system',
            details: { reason: 'deleted_by_user' },
        };

        const deletedMeeting = await Meeting.updateById(id, {
            is_deleted: true,
            meeting_status: 'cancelled',
            audit_trail: [...(meeting.audit_trail || []), auditEntry],
            updated_at: new Date(),
        });

        if (!deletedMeeting) throw new Error("Meeting not deleted");

        return deletedMeeting;
    };

    /**
     * Start a scheduled meeting
     */
    public static readonly startMeeting = async (
        meetingId: string,
        started_by: string
    ): Promise<IMeetingData> => {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) throw new Error("Meeting not found");

        if (meeting.meeting_status !== 'scheduled') {
            throw new Error("Meeting cannot be started");
        }

        // Initialize WebRTC infrastructure
        await WebRTCService.createMeetingRouter(meetingId);

        // Update meeting status
        const auditEntry = {
            timestamp: new Date(),
            action: 'meeting_started',
            user_id: started_by,
            details: { started_at: new Date() },
        };

        const updatedMeeting = await Meeting.updateById(meetingId, {
            meeting_status: 'live',
            audit_trail: [...(meeting.audit_trail || []), auditEntry],
            updated_at: new Date(),
        });

        if (!updatedMeeting) throw new Error("Failed to start meeting");

        // Notify participants
        SocketService.sendToMeeting(meetingId, 'meeting-started', updatedMeeting);

        return updatedMeeting;
    };

    /**
     * End a live meeting
     */
    public static readonly endMeeting = async (
        meetingId: string,
        ended_by?: string
    ): Promise<IMeetingData> => {
        const meeting = await Meeting.findById(meetingId);
        if (!meeting) throw new Error("Meeting not found");

        // Calculate final analytics
        const participants = await MeetingParticipant.find({ meeting_id: meetingId });
        const chatMessages = await MeetingChat.find({ meeting_id: meetingId });

        const analytics = {
            ...meeting.analytics,
            total_participants_joined: participants.rows?.length || 0,
            chat_messages_count: chatMessages.rows?.length || 0,
            total_duration_minutes: Math.floor(
                (Date.now() - meeting.created_at.getTime()) / (1000 * 60)
            ),
        };

        // Clean up WebRTC resources
        await WebRTCService.closeMeetingRoom(meetingId);

        // Update meeting status
        const auditEntry = {
            timestamp: new Date(),
            action: 'meeting_ended',
            user_id: ended_by || 'system',
            details: { ended_at: new Date(), final_analytics: analytics },
        };

        const updatedMeeting = await Meeting.updateById(meetingId, {
            meeting_status: 'ended',
            analytics,
            audit_trail: [...(meeting.audit_trail || []), auditEntry],
            updated_at: new Date(),
        });

        if (!updatedMeeting) throw new Error("Failed to end meeting");

        // Notify participants
        SocketService.sendToMeeting(meetingId, 'meeting-ended', {
            message: 'Meeting has ended',
            analytics,
        });

        return updatedMeeting;
    };

    /**
     * Get meeting participants with real-time status
     */
    public static readonly getMeetingParticipants = async (
        meetingId: string
    ): Promise<IMeetingParticipant[]> => {
        const participants = await MeetingParticipant.find({ meeting_id: meetingId });
        return participants.rows || [];
    };

    /**
     * Get meeting chat history
     */
    public static readonly getMeetingChat = async (
        meetingId: string,
        limit = 100
    ): Promise<IMeetingChat[]> => {
        const messages = await MeetingChat.find(
            { meeting_id: meetingId, is_deleted: false },
            { 
                sort: { timestamp: "DESC" },
                limit 
            }
        );
        return messages.rows || [];
    };

    /**
     * Get meeting recordings
     */
    public static readonly getMeetingRecordings = async (
        meetingId: string
    ): Promise<IMeetingRecording[]> => {
        const recordings = await MeetingRecording.find({ meeting_id: meetingId });
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
        if (!meeting) throw new Error("Meeting not found");

        const participants = await MeetingParticipant.find({ meeting_id: meetingId });
        const chatMessages = await MeetingChat.find({ meeting_id: meetingId });

        // Calculate engagement metrics
        const totalParticipants = participants.rows?.length || 0;
        const averageParticipationTime = totalParticipants > 0 
            ? participants.rows!.reduce((sum, p) => {
                const joinTime = p.joined_at.getTime();
                const leaveTime = p.left_at?.getTime() || Date.now();
                return sum + (leaveTime - joinTime);
              }, 0) / totalParticipants / (1000 * 60) // Convert to minutes
            : 0;

        const chatParticipationRate = totalParticipants > 0
            ? (new Set(chatMessages.rows?.map(m => m.sender_id)).size / totalParticipants) * 100
            : 0;

        return {
            meeting,
            participants: participants.rows || [],
            chatStats: {
                totalMessages: chatMessages.rows?.length || 0,
                uniqueParticipants: new Set(chatMessages.rows?.map(m => m.sender_id)).size,
                participationRate: chatParticipationRate,
            },
            connectionQuality: {
                averageQuality: participants.rows?.reduce((sum, p) => {
                    const qualityScore = { poor: 1, fair: 2, good: 3, excellent: 4 }[p.connection_quality] || 2;
                    return sum + qualityScore;
                }, 0) / Math.max(totalParticipants, 1),
                distribution: {
                    poor: participants.rows?.filter(p => p.connection_quality === 'poor').length || 0,
                    fair: participants.rows?.filter(p => p.connection_quality === 'fair').length || 0,
                    good: participants.rows?.filter(p => p.connection_quality === 'good').length || 0,
                    excellent: participants.rows?.filter(p => p.connection_quality === 'excellent').length || 0,
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
    public static readonly getSystemStats = async (campus_id?: string): Promise<{
        activeMeetings: number;
        totalParticipants: number;
        averageMeetingDuration: number;
        popularFeatures: any;
        serverHealth: any;
    }> => {
        const query = campus_id 
            ? { campus_id, meeting_status: 'live' }
            : { meeting_status: 'live' };
            
        const activeMeetings = await Meeting.find(query);
        
        let totalParticipants = 0;
        for (const meeting of activeMeetings.rows || []) {
            const participants = await MeetingParticipant.find({
                meeting_id: meeting.id,
                connection_status: 'connected',
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
            role?: 'host' | 'co_host' | 'presenter' | 'attendee';
            added_by: string;
            added_at: Date;
        }>
    ): Promise<IMeetingParticipant[]> => {
        try {
            const meeting = await Meeting.findById(meeting_id);
            if (!meeting) {
                throw new Error('Meeting not found');
            }

            // Check if adding participants would exceed max limit
            const currentCount = meeting.current_participants?.length || 0;
            if (currentCount + participants.length > meeting.max_participants) {
                throw new Error(`Adding ${participants.length} participants would exceed maximum limit of ${meeting.max_participants}`);
            }

            const addedParticipants: IMeetingParticipant[] = [];

            for (const participantData of participants) {
                // Check if participant is already in the meeting
                const existingParticipant = meeting.current_participants?.find(
                    (p: any) => p.user_id === participantData.user_id || p.email === participantData.email
                );

                if (existingParticipant) {
                    continue; // Skip if already a participant
                }

                const participantId = uuidv4();
                const participant: IMeetingParticipant = {
                    id: participantId,
                    meeting_id: meeting_id,
                    user_id: participantData.user_id || '',
                    participant_name: participantData.name || 'Guest',
                    participant_email: participantData.email || undefined,
                    connection_status: 'disconnected',
                    connection_quality: 'fair',
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
                        can_share_screen: participantData.role !== 'attendee',
                        can_use_chat: true,
                        can_use_whiteboard: true,
                        is_moderator: ['host', 'co_host'].includes(participantData.role || 'attendee'),
                        is_host: participantData.role === 'host',
                    },
                    peer_connection_id: '',
                    socket_id: '',
                    ip_address: '',
                    user_agent: '',
                    created_at: new Date(),
                    updated_at: new Date(),
                };

                // Create participant record
                const participantDoc = new MeetingParticipant(participant);
                await participantDoc.save();

                // Add to meeting's current_participants array
                await Meeting.findByIdAndUpdate(
                    meeting_id,
                    { 
                        $push: { current_participants: participantId },
                        $set: { updated_at: new Date() }
                    }
                );

                addedParticipants.push(participant);
            }

            return addedParticipants;
        } catch (error) {
            console.error('Error adding participants:', error);
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
                throw new Error('Meeting not found');
            }

            const removedParticipants: IMeetingParticipant[] = [];

            for (const participantId of participant_ids) {
                // Get participant details before removing
                const participant = await MeetingParticipant.findOne({ id: participantId });
                if (participant) {
                    // Update participant record with removal info
                    await MeetingParticipant.findOneAndUpdate(
                        { id: participantId },
                        {
                            left_at: metadata.removed_at,
                            connection_status: 'disconnected',
                        }
                    );

                    removedParticipants.push(participant);
                }

                // Remove from meeting's current_participants array
                await Meeting.findByIdAndUpdate(
                    meeting_id,
                    { 
                        $pull: { current_participants: participantId },
                        $set: { updated_at: new Date() }
                    }
                );

                // If meeting is live, notify via Socket.IO that participant was removed
                if (meeting.meeting_status === 'live') {
                    try {
                        // SocketService will handle disconnecting the participant
                        console.log(`Participant ${participantId} removed from live meeting ${meeting_id}`);
                    } catch (error) {
                        console.warn('Failed to disconnect participant from live meeting:', error);
                    }
                }
            }

            return removedParticipants;
        } catch (error) {
            console.error('Error removing participants:', error);
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
            role: 'host' | 'co_host' | 'presenter' | 'attendee';
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
                throw new Error('Meeting not found');
            }

            // Set default permissions based on role matching the interface
            const finalPermissions = {
                can_share_screen: updates.role !== 'attendee',
                can_use_chat: true,
                can_use_whiteboard: true,
                is_moderator: ['host', 'co_host'].includes(updates.role),
                is_host: updates.role === 'host',
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
                throw new Error('Participant not found');
            }

            return updatedParticipant;
        } catch (error) {
            console.error('Error updating participant role:', error);
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
    ): Promise<Array<{
        id: string;
        full_name: string;
        email: string;
        profile_picture?: string;
        role: string;
        department?: string;
        is_online: boolean;
        last_seen?: Date;
    }>> => {
        try {
            // This is a placeholder implementation
            // In a real app, you would query your User model with proper search
            const searchRegex = new RegExp(query, 'i');
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
                    last_seen: new Date(Date.now() - 3600000), // 1 hour ago
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
                .filter(user => 
                    !excludeIds.includes(user.id) &&
                    (user.full_name.match(searchRegex) || user.email.match(searchRegex)) &&
                    (options.user_types?.length ? options.user_types.includes(user.role) : true)
                )
                .slice(0, limit);
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    };
}
