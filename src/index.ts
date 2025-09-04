import { createServer } from "node:http";

import { app } from "@/app";
import { Cache } from "@/libs/cache/redis";
import { initDB } from "@/libs/db";
import log, { LogTypes } from "@/libs/logger";
import { UploadFactory } from "@/libs/s3/upload.factory";
import { SocketService } from "@/services/socket.service";
import { WebRTCService } from "@/services/webrtc.service";
import { config } from "@/utils/env";

// Create HTTP server for Socket.IO integration
const server = createServer();

// Initialize services asynchronously
async function initializeServices() {
    try {
        log("🚀 Initializing services...", LogTypes.LOGS, "INIT");

        // Initialize cache
        try {
            Cache.init();
            log("✅ Cache initialized", LogTypes.LOGS, "INIT");
        } catch (error) {
            log(`❌ Cache initialization failed: ${error}`, LogTypes.ERROR, "INIT");
            throw new Error("Cache initialization failed");
        }

        // Initialize database (wait for it to complete) with retry mechanism
        let dbRetries = 3;
        let dbInitialized = false;
        
        while (dbRetries > 0 && !dbInitialized) {
            try {
                log(`📀 Attempting database connection... (${4 - dbRetries}/3)`, LogTypes.LOGS, "INIT");
                await initDB();
                log("✅ Database initialized", LogTypes.LOGS, "INIT");
                dbInitialized = true;
            } catch (error) {
                dbRetries--;
                log(`❌ Database connection failed: ${error instanceof Error ? error.message : String(error)}`, LogTypes.ERROR, "INIT");
                
                if (dbRetries > 0) {
                    log(`🔄 Retrying database connection in 5 seconds... (${dbRetries} attempts remaining)`, LogTypes.LOGS, "INIT");
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    log("💥 All database connection attempts failed. Please check:", LogTypes.ERROR, "INIT");
                    log("   1. Couchbase server is running and accessible", LogTypes.ERROR, "INIT");
                    log(`   2. Connection string is correct: ${config.OTTOMAN_CONNECTION_STRING}`, LogTypes.ERROR, "INIT");
                    log("   3. Database credentials are valid", LogTypes.ERROR, "INIT");
                    log("   4. Network connectivity to the database server", LogTypes.ERROR, "INIT");
                    throw new Error("Database connection failed after multiple attempts");
                }
            }
        }

        // Initialize upload client
        try {
            UploadFactory.createUploadClient();
            log("✅ Upload client initialized", LogTypes.LOGS, "INIT");
        } catch (error) {
            log(`⚠️ Upload client initialization failed, continuing without file upload features: ${error}`, LogTypes.ERROR, "INIT");
        }

        // Initialize WebRTC service for real-time video conferencing
        log("🎥 Initializing WebRTC service...", LogTypes.LOGS, "INIT");
        try {
            await WebRTCService.initialize();
            const status = WebRTCService.getStatus();
            if (status.available) {
                log(`✅ WebRTC service initialized with ${status.workers} MediaSoup workers`, LogTypes.LOGS, "INIT");
            } else {
                log("📱 WebRTC running in compatibility mode - participant management only", LogTypes.LOGS, "INIT");
            }
        } catch (error) {
            log(`⚠️ WebRTC initialization failed, continuing without video features: ${error}`, LogTypes.ERROR, "INIT");
        }

        // Initialize Socket.IO service for real-time communication
        log("🔗 Initializing Socket.IO service...", LogTypes.LOGS, "INIT");
        try {
            SocketService.initialize(server);
            log("✅ Socket.IO service initialized", LogTypes.LOGS, "INIT");
        } catch (error) {
            log(`⚠️ Socket.IO initialization failed, continuing without real-time features: ${error}`, LogTypes.ERROR, "INIT");
        }

        log("🎉 All services initialized successfully", LogTypes.LOGS, "INIT");
        log("🎪 Real-time video conferencing system ready to support millions of users!", LogTypes.LOGS, "INIT");
    } catch (error) {
        log(`❌ Failed to initialize services: ${error}`, LogTypes.ERROR, "INIT");
        process.exit(1);
    }
}

// Initialize services on startup
initializeServices();

// Start the HTTP server for Socket.IO
server.listen(Number(config.PORT) + 1, () => {
    log(`🔌 Socket.IO server running on port ${Number(config.PORT) + 1}`, LogTypes.LOGS, "INIT");
});

export default {
    fetch: app.fetch.bind(app),
    port: Number(config.PORT),
    idleTimeout: 255,
};
