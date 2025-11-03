import admin from "firebase-admin";
import log, { LogTypes } from "@/libs/logger";

/**
 * Firebase Notification Payload
 * 
 * Note: This service sends DATA-ONLY messages (no 'notification' field in FCM payload)
 * to prevent duplicate notifications. The frontend app is responsible for displaying
 * notifications from the data payload.
 * 
 * Why data-only?
 * - Prevents Firebase from auto-displaying notifications when app is in background/killed
 * - Gives frontend full control over notification display
 * - Eliminates duplicate notification issue
 * 
 * The 'title' and 'message' fields are placed in the 'data' object as 'title' and 'body'
 */
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
            // ✅ DATA-ONLY MESSAGE - Prevents duplicate notifications
            // The frontend app will handle displaying notifications from the data payload
            // This prevents Firebase from auto-displaying AND the app displaying (duplicate issue)
            const message: admin.messaging.MulticastMessage = {
                // ❌ REMOVED notification field to prevent auto-display by Firebase
                data: {
                    ...payload.data,
                    title: payload.title,
                    body: payload.message,  // Changed from 'message' to 'body' for consistency
                    timestamp: new Date().toISOString(),
                },
                tokens: payload.tokens,
                android: {
                    // Keep high priority for immediate delivery
                    priority: "high" as const,
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,  // For iOS background delivery
                        },
                    },
                    headers: {
                        'apns-priority': '10',  // High priority for iOS
                    },
                },
                webpush: {
                    headers: {
                        Urgency: 'high',
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
            // ✅ DATA-ONLY MESSAGE - Prevents duplicate notifications
            // The frontend app will handle displaying notifications from the data payload
            const message: admin.messaging.Message = {
                // ❌ REMOVED notification field to prevent auto-display by Firebase
                data: {
                    ...payload.data,
                    title: payload.title,
                    body: payload.message,  // Changed from 'message' to 'body' for consistency
                    timestamp: new Date().toISOString(),
                },
                topic: payload.topic,
                android: {
                    // Keep high priority for immediate delivery
                    priority: "high" as const,
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,  // For iOS background delivery
                        },
                    },
                    headers: {
                        'apns-priority': '10',  // High priority for iOS
                    },
                },
                webpush: {
                    headers: {
                        Urgency: 'high',
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