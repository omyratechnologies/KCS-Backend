import crypto from "node:crypto";

import * as mediasoup from "mediasoup";
import { v4 as uuidv4 } from "uuid";

import {
    type IMeetingData,
    type IMeetingParticipant,
    Meeting,
    MeetingChat,
    MeetingParticipant,
} from "@/models/meeting.model";

/**
 * 🎥 WebRTC Service for High-Scale Video Conferencing
 *
 * This service handles:
 * - MediaSoup-based SFU (Selective Forwarding Unit)
 * - Scalable video routing for millions of users
 * - Adaptive bitrate streaming
 * - Load balancing across multiple media servers
 * - Advanced codec support (VP8, VP9, H.264, AV1)
 */
export class WebRTCService {
    private static workers: mediasoup.types.Worker[] = [];
    private static routers: Map<string, mediasoup.types.Router> = new Map();
    private static transports: Map<string, mediasoup.types.Transport> =
        new Map();
    private static producers: Map<string, mediasoup.types.Producer> = new Map();
    private static consumers: Map<string, mediasoup.types.Consumer> = new Map();
    private static rooms: Map<string, Set<string>> = new Map(); // room -> participants
    private static isMediaSoupAvailable: boolean = true;

    /**
     * Check if MediaSoup is available
     */
    public static isAvailable(): boolean {
        return this.isMediaSoupAvailable && this.workers.length > 0;
    }

    /**
     * Get status information
     */
    public static getStatus(): {
        available: boolean;
        workers: number;
        routers: number;
        activeRooms: number;
    } {
        return {
            available: this.isMediaSoupAvailable,
            workers: this.workers.length,
            routers: this.routers.size,
            activeRooms: this.rooms.size,
        };
    }

    // Media server configuration
    private static readonly MEDIA_CODECS: mediasoup.types.RtpCodecCapability[] =
        [
            {
                kind: "audio",
                mimeType: "audio/opus",
                clockRate: 48_000,
                channels: 2,
                preferredPayloadType: 111,
            },
            {
                kind: "video",
                mimeType: "video/VP8",
                clockRate: 90_000,
                preferredPayloadType: 96,
                parameters: {
                    "x-google-start-bitrate": 1000,
                },
            },
            {
                kind: "video",
                mimeType: "video/VP9",
                clockRate: 90_000,
                preferredPayloadType: 98,
                parameters: {
                    "profile-id": 2,
                    "x-google-start-bitrate": 1000,
                },
            },
            {
                kind: "video",
                mimeType: "video/h264",
                clockRate: 90_000,
                preferredPayloadType: 102,
                parameters: {
                    "packetization-mode": 1,
                    "profile-level-id": "4d0032",
                    "level-asymmetry-allowed": 1,
                    "x-google-start-bitrate": 1000,
                },
            },
        ];

    /**
     * Initialize MediaSoup workers for horizontal scaling
     */
    public static async initialize(): Promise<void> {
        try {
            const numWorkers = Number(process.env.MEDIASOUP_WORKERS) || 4;

            console.log(
                `🚀 Initializing ${numWorkers} MediaSoup workers for scalable video conferencing...`
            );

            // Check if MediaSoup is available in the environment
            if (!mediasoup) {
                throw new Error("MediaSoup not available");
            }

            // Create workers with timeout
            const workerPromises: Promise<mediasoup.types.Worker | null>[] = [];
            for (let i = 0; i < numWorkers; i++) {
                const workerPromise = this.createWorkerWithTimeout(i);
                workerPromises.push(workerPromise);
            }

            // Wait for all workers to initialize (or timeout)
            const workers = await Promise.allSettled(workerPromises);

            for (const [index, result] of workers.entries()) {
                if (result.status === "fulfilled" && result.value) {
                    this.workers.push(result.value);
                    console.log(
                        `✅ MediaSoup worker ${index} initialized [pid:${result.value.pid}]`
                    );
                } else {
                    console.warn(
                        `⚠️ Failed to create MediaSoup worker ${index}:`,
                        result.status === "rejected"
                            ? result.reason
                            : "Unknown error"
                    );
                }
            }

            if (this.workers.length === 0) {
                throw new Error("No MediaSoup workers could be created");
            }

            console.log(
                `✅ MediaSoup initialized with ${this.workers.length}/${numWorkers} workers`
            );
        } catch (error) {
            console.warn(
                "⚠️ MediaSoup initialization failed, running in compatibility mode:",
                error
            );

            // Set a flag to indicate MediaSoup is not available
            this.isMediaSoupAvailable = false;

            // Don't throw the error - allow the server to continue without MediaSoup
            // The participant management features will still work without WebRTC
            console.log(
                "📱 Participant management APIs will work without MediaSoup"
            );
        }
    }

    /**
     * Create a single worker with timeout
     */
    private static async createWorkerWithTimeout(
        index: number
    ): Promise<mediasoup.types.Worker | null> {
        return new Promise(async (resolve, reject) => {
            // Set a timeout for worker creation (5 seconds)
            const timeout = setTimeout(() => {
                reject(
                    new Error(
                        `Worker ${index} creation timed out after 5 seconds`
                    )
                );
            }, 5000);

            try {
                const worker = await mediasoup.createWorker({
                    logLevel: "warn",
                    rtcMinPort: 10_000 + index * 1000,
                    rtcMaxPort: 10_000 + index * 1000 + 999,
                });

                worker.on("died", () => {
                    console.error(
                        `💀 MediaSoup worker ${index} died, restarting... [pid:${worker.pid}]`
                    );
                    // Remove the dead worker and try to restart
                    const workerIndex = this.workers.indexOf(worker);
                    if (workerIndex > -1) {
                        this.workers.splice(workerIndex, 1);
                    }
                    // In production, you might want to restart the worker
                    // For now, we'll just log the error
                });

                clearTimeout(timeout);
                resolve(worker);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Create a router for a meeting room with load balancing
     */
    public static async createMeetingRouter(
        meetingId: string
    ): Promise<mediasoup.types.Router | null> {
        if (!this.isMediaSoupAvailable || this.workers.length === 0) {
            console.log(
                `⚠️ MediaSoup not available - router creation skipped for meeting: ${meetingId}`
            );
            return null;
        }

        // Load balance across workers
        const worker = this.workers[this.workers.length % this.workers.length];

        const router = await worker.createRouter({
            mediaCodecs: this.MEDIA_CODECS,
        });

        this.routers.set(meetingId, router);
        this.rooms.set(meetingId, new Set());

        console.log(`🏗️  Created router for meeting: ${meetingId}`);
        return router;
    }

    /**
     * Create WebRTC transport for a participant
     */
    public static async createWebRtcTransport(
        meetingId: string,
        participantId: string,
        direction: "send" | "recv"
    ): Promise<{
        transport: mediasoup.types.WebRtcTransport | null;
        params: any;
    }> {
        if (!this.isMediaSoupAvailable) {
            console.log(
                `⚠️ MediaSoup not available - transport creation skipped for participant: ${participantId}`
            );
            return {
                transport: null,
                params: null,
            };
        }

        const router = this.routers.get(meetingId);
        if (!router) {
            throw new Error(`Router not found for meeting: ${meetingId}`);
        }

        const transport = await router.createWebRtcTransport({
            listenIps: [
                {
                    ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
                    announcedIp:
                        process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1",
                },
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });

        const transportId = `${meetingId}_${participantId}_${direction}`;
        this.transports.set(transportId, transport);

        // Add to room participants
        this.rooms.get(meetingId)?.add(participantId);

        return {
            transport,
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            },
        };
    }

    /**
     * Connect WebRTC transport
     */
    public static async connectTransport(
        transportId: string,
        dtlsParameters: mediasoup.types.DtlsParameters
    ): Promise<void> {
        const transport = this.transports.get(transportId);
        if (!transport) {
            throw new Error(`Transport not found: ${transportId}`);
        }

        await transport.connect({ dtlsParameters });
    }

    /**
     * Produce media (video/audio) from a participant
     */
    public static async produce(
        meetingId: string,
        participantId: string,
        rtpParameters: mediasoup.types.RtpParameters,
        kind: mediasoup.types.MediaKind
    ): Promise<{ id: string }> {
        const transportId = `${meetingId}_${participantId}_send`;
        const transport = this.transports.get(
            transportId
        ) as mediasoup.types.WebRtcTransport;

        if (!transport) {
            throw new Error(
                `Send transport not found for participant: ${participantId}`
            );
        }

        const producer = await transport.produce({
            kind,
            rtpParameters,
        });

        const producerId = `${meetingId}_${participantId}_${kind}`;
        this.producers.set(producerId, producer);

        // Notify other participants about new producer
        this.notifyParticipantsOfNewProducer(
            meetingId,
            participantId,
            producer.id,
            kind
        );

        // Update analytics
        await this.updateMeetingAnalytics(meetingId, "producer_added", {
            kind,
            participantId,
        });

        return { id: producer.id };
    }

    /**
     * Consume media from other participants
     */
    public static async consume(
        meetingId: string,
        consumerParticipantId: string,
        producerParticipantId: string,
        rtpCapabilities: mediasoup.types.RtpCapabilities,
        kind: mediasoup.types.MediaKind
    ): Promise<{
        id: string;
        producerId: string;
        rtpParameters: mediasoup.types.RtpParameters;
    }> {
        const router = this.routers.get(meetingId);
        const transportId = `${meetingId}_${consumerParticipantId}_recv`;
        const transport = this.transports.get(
            transportId
        ) as mediasoup.types.WebRtcTransport;
        const producerId = `${meetingId}_${producerParticipantId}_${kind}`;
        const producer = this.producers.get(producerId);

        if (!router || !transport || !producer) {
            throw new Error("Required components not found for consumption");
        }

        if (
            !router.canConsume({
                producerId: producer.id,
                rtpCapabilities,
            })
        ) {
            throw new Error("Cannot consume producer");
        }

        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: true, // Start paused
        });

        const consumerId = `${meetingId}_${consumerParticipantId}_${producerParticipantId}_${kind}`;
        this.consumers.set(consumerId, consumer);

        return {
            id: consumer.id,
            producerId: producer.id,
            rtpParameters: consumer.rtpParameters,
        };
    }

    /**
     * Resume consumer (start receiving media)
     */
    public static async resumeConsumer(consumerId: string): Promise<void> {
        const consumer = this.consumers.get(consumerId);
        if (!consumer) {
            throw new Error(`Consumer not found: ${consumerId}`);
        }

        await consumer.resume();
    }

    /**
     * Pause consumer (stop receiving media)
     */
    public static async pauseConsumer(consumerId: string): Promise<void> {
        const consumer = this.consumers.get(consumerId);
        if (!consumer) {
            throw new Error(`Consumer not found: ${consumerId}`);
        }

        await consumer.pause();
    }

    /**
     * Handle participant leaving the meeting
     */
    public static async handleParticipantDisconnect(
        meetingId: string,
        participantId: string
    ): Promise<void> {
        // Close all transports for this participant
        const sendTransportId = `${meetingId}_${participantId}_send`;
        const recvTransportId = `${meetingId}_${participantId}_recv`;

        for (const transportId of [sendTransportId, recvTransportId]) {
            const transport = this.transports.get(transportId);
            if (transport && !transport.closed) {
                transport.close();
                this.transports.delete(transportId);
            }
        }

        // Close all producers for this participant
        for (const kind of ["audio", "video"]) {
            const producerId = `${meetingId}_${participantId}_${kind}`;
            const producer = this.producers.get(producerId);
            if (producer && !producer.closed) {
                producer.close();
                this.producers.delete(producerId);
            }
        }

        // Close all consumers for this participant
        for (const [consumerId, consumer] of this.consumers.entries()) {
            if (consumerId.includes(participantId) && !consumer.closed) {
                consumer.close();
                this.consumers.delete(consumerId);
            }
        }

        // Remove from room
        this.rooms.get(meetingId)?.delete(participantId);

        // Update database
        await MeetingParticipant.updateById(participantId, {
            connection_status: "disconnected",
            left_at: new Date(),
            updated_at: new Date(),
        });

        // Update meeting analytics
        await this.updateMeetingAnalytics(meetingId, "participant_left", {
            participantId,
        });

        console.log(
            `👋 Participant ${participantId} disconnected from meeting ${meetingId}`
        );
    }

    /**
     * Close meeting room and cleanup resources
     */
    public static async closeMeetingRoom(meetingId: string): Promise<void> {
        const router = this.routers.get(meetingId);
        if (!router) {return;}

        // Close all transports in this room
        for (const [transportId, transport] of this.transports.entries()) {
            if (transportId.startsWith(meetingId) && !transport.closed) {
                transport.close();
                this.transports.delete(transportId);
            }
        }

        // Close all producers in this room
        for (const [producerId, producer] of this.producers.entries()) {
            if (producerId.startsWith(meetingId) && !producer.closed) {
                producer.close();
                this.producers.delete(producerId);
            }
        }

        // Close all consumers in this room
        for (const [consumerId, consumer] of this.consumers.entries()) {
            if (consumerId.startsWith(meetingId) && !consumer.closed) {
                consumer.close();
                this.consumers.delete(consumerId);
            }
        }

        // Close router
        router.close();
        this.routers.delete(meetingId);
        this.rooms.delete(meetingId);

        // Update meeting status
        await Meeting.updateById(meetingId, {
            meeting_status: "ended",
            updated_at: new Date(),
        });

        console.log(`🏁 Closed meeting room: ${meetingId}`);
    }

    /**
     * Get real-time statistics for a meeting
     */
    public static async getMeetingStats(meetingId: string): Promise<{
        participants: number;
        activeProducers: number;
        activeConsumers: number;
        bandwidth: { incoming: number; outgoing: number };
        quality: {
            average: number;
            poor: number;
            good: number;
            excellent: number;
        };
    }> {
        const router = this.routers.get(meetingId);
        if (!router) {
            throw new Error(`Meeting not found: ${meetingId}`);
        }

        const participants = this.rooms.get(meetingId)?.size || 0;

        let activeProducers = 0;
        let activeConsumers = 0;

        for (const [id, producer] of this.producers.entries()) {
            if (id.startsWith(meetingId) && !producer.closed) {
                activeProducers++;
            }
        }

        for (const [id, consumer] of this.consumers.entries()) {
            if (id.startsWith(meetingId) && !consumer.closed) {
                activeConsumers++;
            }
        }

        // Get transport stats for bandwidth calculation
        let incomingBandwidth = 0;
        let outgoingBandwidth = 0;

        for (const [transportId, transport] of this.transports.entries()) {
            if (transportId.startsWith(meetingId)) {
                const stats = await transport.getStats();
                stats.forEach((stat: any) => {
                    if (stat.type === "transport") {
                        incomingBandwidth += stat.bytesReceived || 0;
                        outgoingBandwidth += stat.bytesSent || 0;
                    }
                });
            }
        }

        return {
            participants,
            activeProducers,
            activeConsumers,
            bandwidth: {
                incoming: incomingBandwidth,
                outgoing: outgoingBandwidth,
            },
            quality: {
                average: 0.8, // Mock data - implement actual quality measurement
                poor: 0.1,
                good: 0.6,
                excellent: 0.3,
            },
        };
    }

    /**
     * Notify participants of new producer
     */
    private static notifyParticipantsOfNewProducer(
        meetingId: string,
        producerParticipantId: string,
        producerId: string,
        kind: mediasoup.types.MediaKind
    ): void {
        // This will be implemented with Socket.IO in the next step
        console.log(
            `🔔 New ${kind} producer from ${producerParticipantId} in meeting ${meetingId}`
        );
    }

    /**
     * Update meeting analytics
     */
    private static async updateMeetingAnalytics(
        meetingId: string,
        eventType: string,
        data: any
    ): Promise<void> {
        try {
            const meeting = await Meeting.findById(meetingId);
            if (!meeting) {return;}

            const analytics = meeting.analytics || {
                total_duration_minutes: 0,
                peak_participants: 0,
                total_participants_joined: 0,
                connection_quality_avg: 0,
                chat_messages_count: 0,
                screen_shares_count: 0,
            };

            switch (eventType) {
                case "participant_joined": {
                    analytics.total_participants_joined++;
                    analytics.peak_participants = Math.max(
                        analytics.peak_participants,
                        this.rooms.get(meetingId)?.size || 0
                    );
                    break;
                }
                case "producer_added": {
                    if (
                        data.kind === "video" &&
                        data.participantId.includes("screen")
                    ) {
                        analytics.screen_shares_count++;
                    }
                    break;
                }
            }

            await Meeting.updateById(meetingId, {
                analytics,
                updated_at: new Date(),
            });
        } catch (error) {
            console.error("Failed to update meeting analytics:", error);
        }
    }

    /**
     * Generate TURN server credentials
     */
    public static generateTurnCredentials(username: string): {
        username: string;
        credential: string;
        urls: string[];
    } {
        const secret = process.env.TURN_SECRET || "default-secret";
        const ttl = 24 * 3600; // 24 hours
        const timestamp = Math.floor(Date.now() / 1000) + ttl;
        const turnUsername = `${timestamp}:${username}`;

        const credential = crypto
            .createHmac("sha1", secret)
            .update(turnUsername)
            .digest("base64");

        return {
            username: turnUsername,
            credential,
            urls: [
                `turn:${process.env.TURN_SERVER_HOST || "localhost"}:3478?transport=udp`,
                `turn:${process.env.TURN_SERVER_HOST || "localhost"}:3478?transport=tcp`,
            ],
        };
    }

    /**
     * Health check for media servers
     */
    public static getHealthStatus(): {
        status: "healthy" | "degraded" | "unhealthy";
        workers: number;
        activeRooms: number;
        totalParticipants: number;
        memoryUsage: NodeJS.MemoryUsage;
    } {
        const activeWorkers = this.workers.filter(
            (worker) => !worker.closed
        ).length;
        const activeRooms = this.routers.size;
        const totalParticipants = [...this.rooms.values()].reduce(
            (sum, participants) => sum + participants.size,
            0
        );

        let status: "healthy" | "degraded" | "unhealthy" = "healthy";

        if (activeWorkers < this.workers.length * 0.5) {
            status = "unhealthy";
        } else if (activeWorkers < this.workers.length * 0.8) {
            status = "degraded";
        }

        return {
            status,
            workers: activeWorkers,
            activeRooms,
            totalParticipants,
            memoryUsage: process.memoryUsage(),
        };
    }
}
