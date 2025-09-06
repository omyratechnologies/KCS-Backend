import { Context } from "hono";
import { VideoCallService } from "../services/video_call.service";
import log, { LogTypes } from "../libs/logger";

export class VideoCallController {
    /**
     * Create a new video call
     * POST /api/video-calls
     */
    public static async createCall(c: Context) {
        try {
            const user_id = c.get("user_id");
            const campus_id = c.get("campus_id");
            
            if (!user_id) {
                return c.json({ success: false, error: "Authentication required" }, 401);
            }

            if (!campus_id) {
                return c.json({ success: false, error: "Campus context required" }, 400);
            }

            const body = await c.req.json();
            const { participants, call_type = 'video', screen_sharing_enabled = false, recording_enabled = false } = body;

            // Validate call_type
            if (!['audio', 'video'].includes(call_type)) {
                return c.json({
                    success: false,
                    error: "Call type must be either 'audio' or 'video'"
                }, 400);
            }

            // Validate participants
            if (!participants || !Array.isArray(participants) || participants.length === 0) {
                return c.json({ 
                    success: false, 
                    error: "At least one participant is required" 
                }, 400);
            }

            // Ensure participants have required fields
            for (const participant of participants) {
                if (!participant.user_id || !participant.name) {
                    return c.json({
                        success: false,
                        error: "Each participant must have user_id and name"
                    }, 400);
                }
            }

            const result = await VideoCallService.createCall(user_id, campus_id, {
                participants,
                call_type,
                screen_sharing_enabled,
                recording_enabled
            });

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            log(`Video call created: ${result.data?.call.call_id} by user ${user_id}`, LogTypes.LOGS, "VIDEO_CALL_CONTROLLER");

            return c.json({
                success: true,
                data: result.data
            }, 201);

        } catch (error) {
            log(`Create call error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }

    /**
     * Join an existing call
     * POST /api/video-calls/:call_id/join
     */
    public static async joinCall(c: Context) {
        try {
            const user_id = c.get("user_id");
            const campus_id = c.get("campus_id");
            
            if (!user_id) {
                return c.json({ success: false, error: "Authentication required" }, 401);
            }

            if (!campus_id) {
                return c.json({ success: false, error: "Campus context required" }, 400);
            }

            const call_id = c.req.param("call_id");

            if (!call_id) {
                return c.json({ 
                    success: false, 
                    error: "Call ID is required" 
                }, 400);
            }

            const result = await VideoCallService.joinCall(user_id, call_id, campus_id);

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            log(`User ${user_id} joined call: ${call_id}`, LogTypes.LOGS, "VIDEO_CALL_CONTROLLER");

            return c.json({
                success: true,
                data: result.data
            });

        } catch (error) {
            log(`Join call error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }

    /**
     * End a video call
     * POST /api/video-calls/:call_id/end
     */
    public static async endCall(c: Context) {
        try {
            const user_id = c.get("user_id");
            const campus_id = c.get("campus_id");
            
            if (!user_id) {
                return c.json({ success: false, error: "Authentication required" }, 401);
            }

            if (!campus_id) {
                return c.json({ success: false, error: "Campus context required" }, 400);
            }

            const call_id = c.req.param("call_id");

            if (!call_id) {
                return c.json({ 
                    success: false, 
                    error: "Call ID is required" 
                }, 400);
            }

            const result = await VideoCallService.endCall(user_id, call_id, campus_id);

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            log(`Call ended: ${call_id} by user ${user_id}`, LogTypes.LOGS, "VIDEO_CALL_CONTROLLER");

            return c.json({
                success: true,
                message: "Call ended successfully"
            });

        } catch (error) {
            log(`End call error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }

    /**
     * Get call history for the authenticated user
     * GET /api/video-calls/history
     */
    public static async getCallHistory(c: Context) {
        try {
            const user_id = c.get("user_id");
            const campus_id = c.get("campus_id");
            
            if (!user_id) {
                return c.json({ success: false, error: "Authentication required" }, 401);
            }

            if (!campus_id) {
                return c.json({ success: false, error: "Campus context required" }, 400);
            }

            const page = parseInt(c.req.query("page") || "1");
            const limit = parseInt(c.req.query("limit") || "20");
            const status_filter = c.req.query("status");

            const result = await VideoCallService.getCallHistory(user_id, campus_id, {
                page,
                limit,
                status_filter
            });

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            return c.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });

        } catch (error) {
            log(`Get call history error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }

    /**
     * Get call details by ID
     * GET /api/video-calls/:call_id
     */
    public static async getCallDetails(c: Context) {
        try {
            const user_id = c.get("user_id");
            const campus_id = c.get("campus_id");
            
            if (!user_id) {
                return c.json({ success: false, error: "Authentication required" }, 401);
            }

            if (!campus_id) {
                return c.json({ success: false, error: "Campus context required" }, 400);
            }

            const call_id = c.req.param("call_id");

            if (!call_id) {
                return c.json({ 
                    success: false, 
                    error: "Call ID is required" 
                }, 400);
            }

            // This would use a method to get call details (we can add to service)
            const result = await VideoCallService.joinCall(user_id, call_id, campus_id);

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            return c.json({
                success: true,
                data: {
                    call: result.data?.call,
                    // Don't return the token unless they're joining
                }
            });

        } catch (error) {
            log(`Get call details error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }

    /**
     * Update call status (webhook endpoint)
     * POST /api/video-calls/:call_id/status
     */
    public static async updateCallStatus(c: Context) {
        try {
            const call_id = c.req.param("call_id");
            const body = await c.req.json();
            const { status, metadata } = body;

            if (!call_id) {
                return c.json({ 
                    success: false, 
                    error: "Call ID is required" 
                }, 400);
            }

            if (!status) {
                return c.json({ 
                    success: false, 
                    error: "Status is required" 
                }, 400);
            }

            // Validate status values
            const validStatuses = ['ongoing', 'ended', 'missed', 'rejected'];
            if (!validStatuses.includes(status)) {
                return c.json({
                    success: false,
                    error: "Invalid status value"
                }, 400);
            }

            const result = await VideoCallService.updateCallStatus(call_id, status, metadata);

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            log(`Call status updated: ${call_id} -> ${status}`, LogTypes.LOGS, "VIDEO_CALL_CONTROLLER");

            return c.json({
                success: true,
                message: "Call status updated successfully"
            });

        } catch (error) {
            log(`Update call status error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }

    /**
     * Create an audio call (convenience endpoint)
     * POST /api/video-calls/audio
     */
    public static async createAudioCall(c: Context) {
        try {
            const user_id = c.get("user_id");
            const campus_id = c.get("campus_id");
            
            if (!user_id) {
                return c.json({ success: false, error: "Authentication required" }, 401);
            }

            if (!campus_id) {
                return c.json({ success: false, error: "Campus context required" }, 400);
            }

            const body = await c.req.json();
            const { participants, recording_enabled = false } = body;

            // Validate participants
            if (!participants || !Array.isArray(participants) || participants.length === 0) {
                return c.json({ 
                    success: false, 
                    error: "At least one participant is required" 
                }, 400);
            }

            // Ensure participants have required fields
            for (const participant of participants) {
                if (!participant.user_id || !participant.name) {
                    return c.json({
                        success: false,
                        error: "Each participant must have user_id and name"
                    }, 400);
                }
            }

            const result = await VideoCallService.createCall(user_id, campus_id, {
                participants,
                call_type: 'audio',
                screen_sharing_enabled: false, // No screen sharing for audio calls
                recording_enabled
            });

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            log(`Audio call created: ${result.data?.call.call_id} by user ${user_id}`, LogTypes.LOGS, "VIDEO_CALL_CONTROLLER");

            return c.json({
                success: true,
                data: result.data,
                message: "Audio call created successfully"
            }, 201);

        } catch (error) {
            log(`Create audio call error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }

    /**
     * Create a video call (convenience endpoint)
     * POST /api/video-calls/video
     */
    public static async createVideoCall(c: Context) {
        try {
            const user_id = c.get("user_id");
            const campus_id = c.get("campus_id");
            
            if (!user_id) {
                return c.json({ success: false, error: "Authentication required" }, 401);
            }

            if (!campus_id) {
                return c.json({ success: false, error: "Campus context required" }, 400);
            }

            const body = await c.req.json();
            const { participants, screen_sharing_enabled = false, recording_enabled = false } = body;

            // Validate participants
            if (!participants || !Array.isArray(participants) || participants.length === 0) {
                return c.json({ 
                    success: false, 
                    error: "At least one participant is required" 
                }, 400);
            }

            // Ensure participants have required fields
            for (const participant of participants) {
                if (!participant.user_id || !participant.name) {
                    return c.json({
                        success: false,
                        error: "Each participant must have user_id and name"
                    }, 400);
                }
            }

            const result = await VideoCallService.createCall(user_id, campus_id, {
                participants,
                call_type: 'video',
                screen_sharing_enabled,
                recording_enabled
            });

            if (!result.success) {
                return c.json({ 
                    success: false, 
                    error: result.error 
                }, 400);
            }

            log(`Video call created: ${result.data?.call.call_id} by user ${user_id}`, LogTypes.LOGS, "VIDEO_CALL_CONTROLLER");

            return c.json({
                success: true,
                data: result.data,
                message: "Video call created successfully"
            }, 201);

        } catch (error) {
            log(`Create video call error: ${error}`, LogTypes.ERROR, "VIDEO_CALL_CONTROLLER");
            return c.json({
                success: false,
                error: "Internal server error"
            }, 500);
        }
    }
}
