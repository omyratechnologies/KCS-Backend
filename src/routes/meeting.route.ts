import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { MeetingController } from "@/controllers/meeting.controller";
import {
    createMeetingRequestBodySchema,
    createMeetingResponseSchema,
    errorResponseSchema,
    getMeetingsResponseSchema,
    meetingSchema,
    updateMeetingRequestBodySchema,
    updateMeetingResponseSchema,
} from "@/schema/meeting";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        operationId: "createMeeting",
        summary: "Create a new meeting",
        description:
            "Creates a new meeting with specified participants and details",
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
    zValidator("json", createMeetingRequestBodySchema),
    MeetingController.createMeeting
);

app.get(
    "/",
    describeRoute({
        operationId: "getAllMeetings",
        summary: "Get all meetings",
        description: "Retrieves all meetings for the current user's campus",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "List of meetings",
                content: {
                    "application/json": {
                        schema: resolver(getMeetingsResponseSchema),
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
    MeetingController.getAllMeetings
);

app.get(
    "/:meeting_id",
    describeRoute({
        operationId: "getMeetingById",
        summary: "Get meeting by ID",
        description: "Retrieves a specific meeting by ID",
        tags: ["Meeting"],
        parameters: [
            {
                name: "meeting_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Meeting ID",
            },
        ],
        responses: {
            200: {
                description: "Meeting details",
                content: {
                    "application/json": {
                        schema: resolver(meetingSchema),
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
    MeetingController.getMeetingById
);

app.get(
    "/u/participants",
    describeRoute({
        operationId: "getMeetingByParticipantId",
        summary: "Get meetings by participant",
        description:
            "Retrieves all meetings where the current user is a participant",
        tags: ["Meeting"],
        responses: {
            200: {
                description: "List of meetings",
                content: {
                    "application/json": {
                        schema: resolver(getMeetingsResponseSchema),
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
    MeetingController.getMeetingByParticipantId
);

app.put(
    "/:meeting_id",
    describeRoute({
        operationId: "updateMeeting",
        summary: "Update a meeting",
        description: "Updates a specific meeting by ID",
        tags: ["Meeting"],
        parameters: [
            {
                name: "meeting_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Meeting ID",
            },
        ],
        responses: {
            200: {
                description: "Meeting updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateMeetingResponseSchema),
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
    zValidator("json", updateMeetingRequestBodySchema),
    MeetingController.updateMeeting
);

app.delete(
    "/:meeting_id",
    describeRoute({
        operationId: "deleteMeeting",
        summary: "Delete a meeting",
        description: "Deletes a specific meeting by ID (soft delete)",
        tags: ["Meeting"],
        parameters: [
            {
                name: "meeting_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Meeting ID",
            },
        ],
        responses: {
            200: {
                description: "Meeting deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(meetingSchema),
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
    MeetingController.deleteMeeting
);

export default app;
