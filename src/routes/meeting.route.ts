import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";

// Removed compress import due to CompressionStream compatibility issues
import { MeetingController } from "@/controllers/meeting.controller";
import { meetingAccessControl, meetingSecurityMiddleware } from "@/middlewares/meeting_security.middleware";
import { meetingRateLimit, strictMeetingRateLimit } from "@/middlewares/rate_limiting.middleware";
import {
    createMeetingRequestBodySchema,
    createMeetingResponseSchema,
    errorResponseSchema,
    getMeetingsResponseSchema,
    meetingSchema,
    updateMeetingRequestBodySchema,
    updateMeetingResponseSchema,
} from "@/schema/meeting";

/**
 * 🎪 Enhanced Meeting Routes for Real-time Video Conferencing
 */
const app = new Hono();

// Apply middleware stack (removed compress due to CompressionStream issues)
// app.use("/*", compress()); // Response compression - DISABLED DUE TO COMPATIBILITY
app.use("/*", meetingSecurityMiddleware()); // Security headers
app.use("/*", meetingRateLimit()); // Rate limiting
app.use("/*", meetingAccessControl()); // Access control

// Enhanced meeting creation schema with strict validation
const enhancedCreateMeetingSchema = createMeetingRequestBodySchema
    .extend({
        meeting_type: z.enum(["scheduled", "instant", "recurring"]).optional(),
        max_participants: z.number().min(2).max(10_000).optional(),
        meeting_password: z
            .string()
            .min(6)
            .max(50)
            .optional()
            .transform((val) => val?.trim()),
        waiting_room_enabled: z.boolean().optional(),
        require_host_approval: z.boolean().optional(),
        features: z
            .object({
                video_enabled: z.boolean().optional(),
                audio_enabled: z.boolean().optional(),
                screen_sharing_enabled: z.boolean().optional(),
                chat_enabled: z.boolean().optional(),
                recording_enabled: z.boolean().optional(),
                breakout_rooms_enabled: z.boolean().optional(),
                whiteboard_enabled: z.boolean().optional(),
                hand_raise_enabled: z.boolean().optional(),
            })
            .optional(),
        recording_config: z
            .object({
                auto_record: z.boolean().optional(),
                record_video: z.boolean().optional(),
                record_audio: z.boolean().optional(),
                record_chat: z.boolean().optional(),
                storage_location: z.enum(["local", "cloud"]).optional(),
                retention_days: z.number().min(1).max(365).optional(),
            })
            .optional(),
    })
    .refine(
        (data) => {
            if (data.meeting_start_time && data.meeting_end_time) {
                return new Date(data.meeting_start_time) < new Date(data.meeting_end_time);
            }
            return true;
        },
        {
            message: "Meeting end time must be after start time",
        }
    );

const joinMeetingSchema = z.object({
    meeting_password: z
        .string()
        .optional()
        .transform((val) => val?.trim()),
});

// Parameter validation schemas
const meetingIdSchema = z.object({
    meeting_id: z.string().min(1, "Meeting ID is required"),
});

const participantManagementSchema = z
    .object({
        participants: z
            .array(
                z.object({
                    user_id: z.string().optional(),
                    email: z.string().email().optional(),
                    name: z
                        .string()
                        .min(1)
                        .max(100)
                        .optional()
                        .transform((val) => val?.trim()),
                    phone: z.string().optional(),
                    role: z.enum(["host", "co_host", "presenter", "attendee"]).optional(),
                })
            )
            .min(1, "At least one participant is required"),
        send_invitation: z.boolean().optional(),
        invitation_message: z
            .string()
            .max(500)
            .optional()
            .transform((val) => val?.trim()),
        participant_role: z.enum(["host", "co_host", "presenter", "attendee"]).optional(),
        notify_existing_participants: z.boolean().optional(),
    })
    .refine(
        (data) => {
            // Ensure each participant has either user_id or email
            return data.participants.every((p) => p.user_id || p.email);
        },
        {
            message: "Each participant must have either user_id or email",
        }
    );

// Apply rate limiting middleware
app.use("/*", meetingRateLimit());

// Create meeting
app.post(
    "/",
    describeRoute({
        operationId: "createMeeting",
        summary: "Create a new meeting with enhanced features",
        description: "Creates a meeting with real-time video conferencing capabilities",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "Meeting created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", enhancedCreateMeetingSchema),
    MeetingController.createMeeting
);

// Get all meetings
app.get(
    "/",
    describeRoute({
        operationId: "getAllMeetings",
        summary: "Get all meetings",
        description: "Retrieves all meetings with real-time status",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "Meetings retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getMeetingsResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getAllMeetings
);

// Get meeting by ID
app.get(
    "/:meeting_id",
    describeRoute({
        operationId: "getMeetingById",
        summary: "Get meeting by ID",
        description: "Retrieves detailed meeting information",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "Meeting retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(meetingSchema),
                    },
                },
            },
            404: {
                description: "Meeting not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getMeetingById
);

// Get meetings by participant
app.get(
    "/participant/:participant_id?",
    describeRoute({
        operationId: "getMeetingByParticipantId",
        summary: "Get meetings for participant",
        description: "Retrieves meetings for a participant",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "Meetings retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getMeetingsResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getMeetingByParticipantId
);

// Update meeting
app.put(
    "/:meeting_id",
    describeRoute({
        operationId: "updateMeeting",
        summary: "Update meeting",
        description: "Updates meeting details",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "Meeting updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateMeetingResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateMeetingRequestBodySchema),
    MeetingController.updateMeeting
);

// Delete meeting
app.delete(
    "/:meeting_id",
    describeRoute({
        operationId: "deleteMeeting",
        summary: "Delete meeting",
        description: "Soft deletes a meeting",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "Meeting deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(meetingSchema),
                    },
                },
            },
        },
    }),
    MeetingController.deleteMeeting
);

// Start meeting
app.post(
    "/:meeting_id/start",
    describeRoute({
        operationId: "startMeeting",
        summary: "Start meeting",
        description: "Starts a scheduled meeting",
        tags: ["Meeting", "Live"],
        responses: {
            200: {
                description: "Meeting started successfully",
                content: {
                    "application/json": {
                        schema: resolver(meetingSchema),
                    },
                },
            },
        },
    }),
    MeetingController.startMeeting
);

// End meeting
app.post(
    "/:meeting_id/end",
    describeRoute({
        operationId: "endMeeting",
        summary: "End meeting",
        description: "Ends a live meeting",
        tags: ["Meeting", "Live"],
        responses: {
            200: {
                description: "Meeting ended successfully",
                content: {
                    "application/json": {
                        schema: resolver(meetingSchema),
                    },
                },
            },
        },
    }),
    MeetingController.endMeeting
);

// Join meeting
app.post(
    "/:meeting_id/join",
    describeRoute({
        operationId: "joinMeeting",
        summary: "Join meeting",
        description: "Validates access and joins meeting",
        tags: ["Meeting", "Live"],
        responses: {
            200: {
                description: "Join validation successful",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", joinMeetingSchema),
    MeetingController.joinMeeting
);

// Get participants
app.get(
    "/:meeting_id/participants",
    describeRoute({
        operationId: "getMeetingParticipants",
        summary: "Get meeting participants",
        description: "Retrieves meeting participants",
        tags: ["Meeting", "Participants"],
        responses: {
            200: {
                description: "Participants retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getMeetingsResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getMeetingParticipants
);

// Get chat history
app.get(
    "/:meeting_id/chat",
    describeRoute({
        operationId: "getMeetingChat",
        summary: "Get meeting chat",
        description: "Retrieves chat history",
        tags: ["Meeting", "Chat"],
        responses: {
            200: {
                description: "Chat retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getMeetingsResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getMeetingChat
);

// Get recordings
app.get(
    "/:meeting_id/recordings",
    describeRoute({
        operationId: "getMeetingRecordings",
        summary: "Get meeting recordings",
        description: "Retrieves meeting recordings",
        tags: ["Meeting", "Recordings"],
        responses: {
            200: {
                description: "Recordings retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getMeetingsResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getMeetingRecordings
);

// Get analytics
app.get(
    "/:meeting_id/analytics",
    describeRoute({
        operationId: "getMeetingAnalytics",
        summary: "Get meeting analytics",
        description: "Retrieves meeting analytics",
        tags: ["Meeting", "Analytics"],
        responses: {
            200: {
                description: "Analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getMeetingAnalytics
);

// Get WebRTC config
app.get(
    "/:meeting_id/webrtc-config",
    describeRoute({
        operationId: "getWebRTCConfig",
        summary: "Get WebRTC configuration",
        description: "Retrieves WebRTC configuration",
        tags: ["Meeting", "WebRTC"],
        responses: {
            200: {
                description: "Configuration retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getWebRTCConfig
);

// Get live stats
app.get(
    "/:meeting_id/live-stats",
    describeRoute({
        operationId: "getLiveMeetingStats",
        summary: "Get live meeting statistics",
        description: "Retrieves real-time statistics",
        tags: ["Meeting", "Live", "Statistics"],
        responses: {
            200: {
                description: "Statistics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getLiveMeetingStats
);

// Microsoft Teams-style participant management routes

// Add participants to meeting
app.post(
    "/:id/participants",
    describeRoute({
        operationId: "addParticipants",
        summary: "Add participants to meeting",
        description: "Add people to meeting like Microsoft Teams - works for both scheduled and live meetings",
        tags: ["Meeting", "Participants"],
        responses: {
            200: {
                description: "Participants added successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
            403: {
                description: "Access denied - only hosts/co-hosts can add participants",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator(
        "json",
        z.object({
            participants: z.array(
                z.object({
                    user_id: z.string().optional(),
                    email: z.string().email().optional(),
                    name: z.string().optional(),
                    phone: z.string().optional(),
                    role: z.enum(["host", "co_host", "presenter", "attendee"]).optional(),
                })
            ),
            send_invitation: z.boolean().optional(),
            invitation_message: z.string().optional(),
            participant_role: z.enum(["host", "co_host", "presenter", "attendee"]).optional(),
            notify_existing_participants: z.boolean().optional(),
        })
    ),
    MeetingController.addParticipants
);

// Remove participants from meeting
app.delete(
    "/:id/participants",
    describeRoute({
        operationId: "removeParticipants",
        summary: "Remove participants from meeting",
        description: "Remove people from meeting like Microsoft Teams",
        tags: ["Meeting", "Participants"],
        responses: {
            200: {
                description: "Participants removed successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
            403: {
                description: "Access denied - only hosts/co-hosts can remove participants",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator(
        "json",
        z.object({
            participant_ids: z.array(z.string()),
            notify_removed_participants: z.boolean().optional(),
            notify_existing_participants: z.boolean().optional(),
            reason: z.string().optional(),
        })
    ),
    MeetingController.removeParticipants
);

// Update participant role
app.patch(
    "/:id/participants/:participant_id/role",
    describeRoute({
        operationId: "updateParticipantRole",
        summary: "Update participant role",
        description: "Change participant role and permissions like Microsoft Teams",
        tags: ["Meeting", "Participants"],
        responses: {
            200: {
                description: "Participant role updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
            403: {
                description: "Access denied - only hosts can change roles",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator(
        "json",
        z.object({
            new_role: z.enum(["host", "co_host", "presenter", "attendee"]),
            permissions: z
                .object({
                    can_share_screen: z.boolean().optional(),
                    can_unmute_others: z.boolean().optional(),
                    can_manage_participants: z.boolean().optional(),
                    can_record: z.boolean().optional(),
                    can_manage_breakout_rooms: z.boolean().optional(),
                })
                .optional(),
            notify_participant: z.boolean().optional(),
            notify_others: z.boolean().optional(),
        })
    ),
    MeetingController.updateParticipantRole
);

// Search users to add to meeting
app.post(
    "/:id/search-users",
    describeRoute({
        operationId: "searchUsersToAdd",
        summary: "Search users to add to meeting",
        description: "Search campus directory to find people to add like Microsoft Teams",
        tags: ["Meeting", "Participants", "Search"],
        responses: {
            200: {
                description: "Users found successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator(
        "json",
        z.object({
            query: z.string(),
            exclude_current_participants: z.boolean().optional(),
            limit: z.number().optional(),
            user_types: z.array(z.string()).optional(),
        })
    ),
    MeetingController.searchUsersToAdd
);

// Get system stats
app.get(
    "/system/stats",
    describeRoute({
        operationId: "getSystemStats",
        summary: "Get system statistics",
        description: "Retrieves system-wide statistics",
        tags: ["Meeting", "Admin", "Statistics"],
        responses: {
            200: {
                description: "System statistics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(createMeetingResponseSchema),
                    },
                },
            },
        },
    }),
    MeetingController.getSystemStats
);

export default app;
