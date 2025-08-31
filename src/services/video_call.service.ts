import { VideoCall, IVideoCall } from "../models/video_call.model";
import { ChatRoom } from "../models/chat_room.model";
import { ChatValidationService } from "./chat_validation.service";
import log, { LogTypes } from "../libs/logger";
import { config } from "../utils/env";
import { StreamClient } from "@stream-io/node-sdk";

export interface CallParticipant {
    user_id: string;
    name: string;
    role?: 'host' | 'participant';
}

export interface CreateCallOptions {
    participants: CallParticipant[];
    call_type: 'audio' | 'video';
    screen_sharing_enabled?: boolean;
    recording_enabled?: boolean;
}

export interface CallToken {
    token: string;
    call_id: string;
    user_id: string;
    expires_at: Date;
}

interface StreamVideoClient {
    client: StreamClient;
}

export class VideoCallService {
    private static streamVideoClient: StreamVideoClient | null = null;

    /**
     * Initialize Stream Video client
     */
    private static initializeClient(): StreamVideoClient {
        if (!this.streamVideoClient) {
            const apiKey = config.GETSTREAM_API_KEY;
            const apiSecret = config.GETSTREAM_API_SECRET;

            if (!apiKey || !apiSecret) {
                throw new Error("GetStream API credentials not configured. Please set GETSTREAM_API_KEY and GETSTREAM_API_SECRET");
            }

            // Initialize the Stream Video client
            const client = new StreamClient(apiKey, apiSecret);
            this.streamVideoClient = { client };
        }
        return this.streamVideoClient;
    }

    /**
     * Generate JWT token for GetStream Video
     */
    private static generateUserToken(user_id: string): string {
        const { client } = this.initializeClient();
        
        // Use GetStream's built-in token generation
        return client.generateUserToken({ 
            user_id, 
            validity_in_seconds: 24 * 60 * 60 // 24 hours
        });
    }

    /**
     * Generate call-specific token
     */
    private static generateCallToken(user_id: string, call_id: string): string {
        const { client } = this.initializeClient();
        
        // Generate call-specific token with call_cids
        return client.generateCallToken({ 
            user_id,
            call_cids: [`default:${call_id}`],
            validity_in_seconds: 24 * 60 * 60 // 24 hours
        });
    }

    /**
     * Create a GetStream call via SDK
     */
    private static async createGetStreamCall(call_id: string, created_by: string, participants: CallParticipant[], call_type: 'audio' | 'video', settings: { screen_sharing_enabled: boolean; recording_enabled: boolean }) {
        const { client } = this.initializeClient();
        
        try {
            // First, ensure users exist in GetStream
            const users = participants.map(p => ({
                id: p.user_id,
                role: 'user',
                name: p.name
            }));

            // Upsert users to GetStream
            await client.upsertUsers(users);

            // Create the call using the video client
            const call = client.video.call('default', call_id);
            
            // Prepare call data
            const callData = {
                created_by_id: created_by,
                members: participants.map(p => ({
                    user_id: p.user_id,
                    role: 'user' // GetStream uses 'user', 'admin' or 'moderator' - we'll use 'user' for all
                })),
                settings_override: {
                    audio: {
                        mic_default_on: true,
                        speaker_default_on: true,
                        default_device: 'speaker' as const
                    },
                    video: {
                        camera_default_on: call_type === 'video',
                        camera_facing: call_type === 'video' ? ('front' as const) : undefined,
                        target_resolution: call_type === 'video' ? {
                            width: 720,
                            height: 480,
                            bitrate: 1000000
                        } : {
                            width: 240,
                            height: 240,
                            bitrate: 300000
                        }
                    },
                    screensharing: {
                        enabled: settings.screen_sharing_enabled && call_type === 'video'
                    },
                    recording: {
                        mode: settings.recording_enabled ? ('available' as const) : ('disabled' as const)
                    }
                }
            };

            // Create the call
            const callResponse = await call.create({ data: callData });

            return callResponse;
        } catch (error) {
            log(`GetStream call creation error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_SERVICE");
            throw error;
        }
    }

    /**
     * Create a video call between users
     */
    public static async createCall(
        caller_id: string,
        campus_id: string,
        options: CreateCallOptions
    ): Promise<{ success: boolean; data?: { call: IVideoCall; tokens: CallToken[] }; error?: string }> {
        try {
            // Validate that caller can call all participants
            for (const participant of options.participants) {
                if (participant.user_id === caller_id) {
                    continue; // Skip self-validation
                }
                
                const validation = await ChatValidationService.canSendPersonalMessage(
                    caller_id, 
                    participant.user_id, 
                    campus_id
                );
                
                if (!validation.canSend) {
                    return { 
                        success: false, 
                        error: `Cannot call ${participant.name}: ${validation.reason}` 
                    };
                }
            }

            // Generate unique call ID
            const call_id = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Add caller to participants if not already included
            const participantIds = options.participants.map(p => p.user_id);
            if (!participantIds.includes(caller_id)) {
                options.participants.unshift({
                    user_id: caller_id,
                    name: "Caller", // Will be updated with actual name
                    role: 'host'
                });
            }

            // Create GetStream call
            const getStreamCall = await this.createGetStreamCall(
                call_id,
                caller_id,
                options.participants,
                options.call_type,
                {
                    screen_sharing_enabled: options.screen_sharing_enabled || false,
                    recording_enabled: options.recording_enabled || false
                }
            );

            // Find associated chat room for personal calls (if 1:1)
            let room_id: string | undefined;
            if (options.participants.length === 2) {
                const [participant1, participant2] = options.participants;
                const personalRooms = await ChatRoom.find({
                    campus_id,
                    room_type: "personal",
                    is_deleted: false,
                });

                const existingRoom = personalRooms.rows?.find((room: { id: string; members: string[]; campus_id: string }) => 
                    room.members && 
                    room.members.includes(participant1.user_id) && 
                    room.members.includes(participant2.user_id)
                );

                room_id = existingRoom?.id;
            }

            // Create video call record
            const videoCall = await VideoCall.create({
                call_id,
                campus_id,
                room_id,
                call_type: options.call_type,
                caller_id,
                participants: options.participants.map(p => p.user_id),
                call_status: 'created',
                call_settings: {
                    audio_enabled: true, // Audio is always enabled
                    video_enabled: options.call_type === 'video', // Video only enabled for video calls
                    screen_sharing_enabled: options.screen_sharing_enabled && options.call_type === 'video' || false,
                    recording_enabled: options.recording_enabled || false,
                },
                metadata: {
                    getstream_call_id: getStreamCall.call?.id,
                    getstream_session_id: getStreamCall.call?.session?.id,
                },
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });

            // Generate tokens for all participants
            const tokens: CallToken[] = options.participants.map(participant => ({
                token: this.generateUserToken(participant.user_id),
                call_id,
                user_id: participant.user_id,
                expires_at: new Date(Date.now() + (24 * 60 * 60 * 1000)), // 24 hours
            }));

            return {
                success: true,
                data: {
                    call: videoCall,
                    tokens
                }
            };

        } catch (error) {
            log(`Video call creation error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_SERVICE");
            return {
                success: false,
                error: `Failed to create video call: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }

    /**
     * Join an existing call
     */
    public static async joinCall(
        user_id: string,
        call_id: string,
        campus_id: string
    ): Promise<{ success: boolean; data?: { token: string; call: IVideoCall }; error?: string }> {
        try {
            // Find the call
            const call = await VideoCall.findOne({
                call_id,
                campus_id,
                is_deleted: false
            });

            if (!call) {
                return { success: false, error: "Call not found" };
            }

            // Check if user is a participant
            if (!call.participants.includes(user_id)) {
                return { success: false, error: "You are not invited to this call" };
            }

            // Generate token for the user
            const token = this.generateUserToken(user_id);

            return {
                success: true,
                data: {
                    token,
                    call
                }
            };

        } catch (error) {
            log(`Join call error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_SERVICE");
            return {
                success: false,
                error: `Failed to join call: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }

    /**
     * End a video call
     */
    public static async endCall(
        user_id: string,
        call_id: string,
        campus_id: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const call = await VideoCall.findOne({
                call_id,
                campus_id,
                is_deleted: false
            });

            if (!call) {
                return { success: false, error: "Call not found" };
            }

            // Only caller or participants can end the call
            if (!call.participants.includes(user_id)) {
                return { success: false, error: "You are not authorized to end this call" };
            }

            // Update call status
            await VideoCall.replaceById(call.id, {
                ...call,
                call_status: 'ended',
                ended_at: new Date(),
                duration: call.started_at ? 
                    Math.floor((Date.now() - call.started_at.getTime()) / 1000) : 0,
                metadata: {
                    ...call.metadata,
                    end_reason: 'normal'
                },
                updated_at: new Date(),
            });

            return { success: true };

        } catch (error) {
            log(`End call error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_SERVICE");
            return {
                success: false,
                error: `Failed to end call: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }

    /**
     * Get call history for a user
     */
    public static async getCallHistory(
        user_id: string,
        campus_id: string,
        options: {
            page?: number;
            limit?: number;
            status_filter?: string;
        } = {}
    ): Promise<{
        success: boolean;
        data?: IVideoCall[];
        pagination?: { page: number; limit: number; total: number };
        error?: string;
    }> {
        try {
            const page = options.page || 1;
            const limit = options.limit || 20;
            const skip = (page - 1) * limit;

            const query = {
                campus_id,
                is_deleted: false,
                ...(options.status_filter && { call_status: options.status_filter }),
            };

            const calls = await VideoCall.find(query, {
                sort: { created_at: "DESC" },
                limit: 100, // Get more to filter
            });

            // Filter calls where user is a participant
            const userCalls = (calls.rows || []).filter(call => 
                call.participants && call.participants.includes(user_id)
            ).slice(skip, skip + limit);

            return {
                success: true,
                data: userCalls,
                pagination: {
                    page,
                    limit,
                    total: userCalls.length,
                },
            };

        } catch (error) {
            log(`Get call history error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_SERVICE");
            return {
                success: false,
                error: `Failed to get call history: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }

    /**
     * Update call status (for webhooks or client updates)
     */
    public static async updateCallStatus(
        call_id: string,
        status: 'ongoing' | 'ended' | 'missed' | 'rejected',
        metadata?: Record<string, unknown>
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const call = await VideoCall.findOne({ call_id });

            if (!call) {
                return { success: false, error: "Call not found" };
            }

            const updateData: Partial<IVideoCall> = {
                call_status: status,
                updated_at: new Date(),
            };

            if (status === 'ongoing' && !call.started_at) {
                updateData.started_at = new Date();
            }

            if (status === 'ended' && call.started_at && !call.ended_at) {
                updateData.ended_at = new Date();
                updateData.duration = Math.floor((Date.now() - call.started_at.getTime()) / 1000);
            }

            if (metadata) {
                updateData.metadata = { ...call.metadata, ...metadata };
            }

            await VideoCall.replaceById(call.id, {
                ...call,
                ...updateData
            });

            return { success: true };

        } catch (error) {
            log(`Update call status error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_SERVICE");
            return {
                success: false,
                error: `Failed to update call status: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }
}
