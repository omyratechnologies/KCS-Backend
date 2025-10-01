import admin from "firebase-admin";
import log, { LogTypes } from "@/libs/logger";

interface FirebaseNotificationPayload {
    title: string;
    message: string;
    data?: Record<string, string>;
    tokens?: string[];
    topic?: string;
}

export class FirebaseService {
    private static initialized = false;

    /**
     * Check if Firebase is initialized
     */
    public static isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Initialize Firebase Admin SDK
     */
    public static initialize() {
        if (this.initialized) {
            log('Firebase already initialized', LogTypes.LOGS, 'Firebase');
            return;
        }

        try {
            // Check if service account key is provided via environment variables
            const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            const projectId = process.env.FIREBASE_PROJECT_ID;

            log(`Firebase init - Project ID: ${projectId ? 'Found' : 'Missing'}`, LogTypes.LOGS, 'Firebase');
            log(`Firebase init - Service Account Key: ${serviceAccountKey ? 'Found' : 'Missing'}`, LogTypes.LOGS, 'Firebase');

            if (!serviceAccountKey || !projectId) {
                log('Firebase credentials not found, push notifications will be disabled', LogTypes.ERROR, 'Firebase');
                return;
            }

            // Parse service account key from environment variable
            log('Parsing service account key...', LogTypes.LOGS, 'Firebase');
            const serviceAccount = JSON.parse(serviceAccountKey);
            
            // Fix escaped newlines in private key
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            
            log(`Service account parsed successfully, project: ${serviceAccount.project_id}`, LogTypes.LOGS, 'Firebase');

            // Initialize Firebase Admin SDK
            log('Initializing Firebase Admin SDK...', LogTypes.LOGS, 'Firebase');
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: projectId,
            });

            this.initialized = true;
            log('Firebase Admin SDK initialized successfully', LogTypes.LOGS, 'Firebase');
        } catch (error) {
            log(`Failed to initialize Firebase Admin SDK: ${error}`, LogTypes.ERROR, 'Firebase');
            throw error;
        }
    }

    /**
     * Send push notification to multiple device tokens
     */
    public static async sendToTokens(payload: FirebaseNotificationPayload): Promise<{
        success: boolean;
        successCount: number;
        failureCount: number;
        results?: admin.messaging.SendResponse[];
        error?: string;
    }> {
        log(`sendToTokens called - initialized: ${this.initialized}`, LogTypes.LOGS, 'Firebase');
        
        if (!this.initialized) {
            log('Firebase not initialized - attempting to initialize', LogTypes.ERROR, 'Firebase');
            return {
                success: false,
                successCount: 0,
                failureCount: 0,
                error: "Firebase not initialized"
            };
        }

        if (!payload.tokens || payload.tokens.length === 0) {
            return {
                success: false,
                successCount: 0,
                failureCount: 0,
                error: "No device tokens provided"
            };
        }

        try {
            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title: payload.title,
                    body: payload.message,
                },
                data: {
                    ...payload.data,
                    title: payload.title,
                    message: payload.message,
                    timestamp: new Date().toISOString(),
                },
                tokens: payload.tokens,
                android: {
                    notification: {
                        priority: "high" as const,
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                    priority: "high" as const,
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.message,
                            },
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
                webpush: {
                    notification: {
                        title: payload.title,
                        body: payload.message,
                        icon: "/icon-192x192.png",
                        badge: "/badge-72x72.png",
                    },
                },
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            return {
                success: response.failureCount === 0,
                successCount: response.successCount,
                failureCount: response.failureCount,
                results: response.responses,
            };
        } catch (error) {
            return {
                success: false,
                successCount: 0,
                failureCount: 0,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }

    /**
     * Send push notification to a topic
     */
    public static async sendToTopic(payload: FirebaseNotificationPayload): Promise<{
        success: boolean;
        messageId?: string;
        error?: string;
    }> {
        if (!this.initialized) {
            return {
                success: false,
                error: "Firebase not initialized"
            };
        }

        if (!payload.topic) {
            return {
                success: false,
                error: "No topic provided"
            };
        }

        try {
            const message: admin.messaging.Message = {
                notification: {
                    title: payload.title,
                    body: payload.message,
                },
                data: {
                    ...payload.data,
                    title: payload.title,
                    message: payload.message,
                    timestamp: new Date().toISOString(),
                },
                topic: payload.topic,
                android: {
                    notification: {
                        priority: "high" as const,
                        defaultSound: true,
                        defaultVibrateTimings: true,
                    },
                    priority: "high" as const,
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.message,
                            },
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
                webpush: {
                    notification: {
                        title: payload.title,
                        body: payload.message,
                        icon: "/icon-192x192.png",
                        badge: "/badge-72x72.png",
                    },
                },
            };

            const messageId = await admin.messaging().send(message);

            return {
                success: true,
                messageId: messageId,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    }

    /**
     * Subscribe device tokens to a topic
     */
    public static async subscribeToTopic(tokens: string[], topic: string): Promise<{
        success: boolean;
        successCount: number;
        failureCount: number;
        errors?: Array<{ error: Error }>;
    }> {
        if (!this.initialized) {
            return {
                success: false,
                successCount: 0,
                failureCount: 0,
                errors: [{ error: new Error("Firebase not initialized") }]
            };
        }

        try {
            const response = await admin.messaging().subscribeToTopic(tokens, topic);

            return {
                success: response.failureCount === 0,
                successCount: response.successCount,
                failureCount: response.failureCount,
                errors: response.errors?.map(err => ({ error: new Error(err.error.message) })),
            };
        } catch (error) {
            return {
                success: false,
                successCount: 0,
                failureCount: 0,
                errors: [{ error: error as Error }]
            };
        }
    }

    /**
     * Unsubscribe device tokens from a topic
     */
    public static async unsubscribeFromTopic(tokens: string[], topic: string): Promise<{
        success: boolean;
        successCount: number;
        failureCount: number;
        errors?: Array<{ error: Error }>;
    }> {
        if (!this.initialized) {
            return {
                success: false,
                successCount: 0,
                failureCount: 0,
                errors: [{ error: new Error("Firebase not initialized") }]
            };
        }

        try {
            const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);

            return {
                success: response.failureCount === 0,
                successCount: response.successCount,
                failureCount: response.failureCount,
                errors: response.errors?.map(err => ({ error: new Error(err.error.message) })),
            };
        } catch (error) {
            return {
                success: false,
                successCount: 0,
                failureCount: 0,
                errors: [{ error: error as Error }]
            };
        }
    }

    /**
     * Validate registration tokens
     */
    public static async validateTokens(tokens: string[]): Promise<{
        validTokens: string[];
        invalidTokens: string[];
    }> {
        if (!this.initialized) {
            return {
                validTokens: [],
                invalidTokens: tokens
            };
        }

        const validTokens: string[] = [];
        const invalidTokens: string[] = [];

        // Test each token by sending a dry-run message
        for (const token of tokens) {
            try {
                await admin.messaging().send({
                    token: token,
                    notification: {
                        title: "Test",
                        body: "Test message",
                    }
                }, true); // dry-run mode

                validTokens.push(token);
            } catch {
                invalidTokens.push(token);
            }
        }

        return {
            validTokens,
            invalidTokens
        };
    }
}