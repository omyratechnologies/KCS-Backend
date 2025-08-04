import { createServer } from "node:http";

import { app } from "@/app";
import { Cache } from "@/libs/cache/redis";
import { initDB } from "@/libs/db";
import { UploadFactory } from "@/libs/s3/upload.factory";
import { SocketService } from "@/services/socket.service";
import { WebRTCService } from "@/services/webrtc.service";
import { config } from "@/utils/env";

// Create HTTP server for Socket.IO integration
const server = createServer();

// Initialize services asynchronously
async function initializeServices() {
    try {
        console.log("🚀 Initializing services...");
        
        // Initialize cache
        Cache.init();
        console.log("✅ Cache initialized");
        
        // Initialize database (wait for it to complete)
        await initDB();
        console.log("✅ Database initialized");
        
        // Initialize upload client
        UploadFactory.createUploadClient();
        console.log("✅ Upload client initialized");

        // Initialize WebRTC service for real-time video conferencing
        console.log("🎥 Initializing WebRTC service...");
        try {
            await WebRTCService.initialize();
            const status = WebRTCService.getStatus();
            if (status.available) {
                console.log(`✅ WebRTC service initialized with ${status.workers} MediaSoup workers`);
            } else {
                console.log("📱 WebRTC running in compatibility mode - participant management only");
            }
        } catch (error) {
            console.warn("⚠️ WebRTC initialization failed, continuing without video features:", error);
        }

        // Initialize Socket.IO service for real-time communication
        console.log("🔗 Initializing Socket.IO service...");
        SocketService.initialize(server);
        console.log("✅ Socket.IO service initialized");
        
        console.log("🎉 All services initialized successfully");
        console.log("🎪 Real-time video conferencing system ready to support millions of users!");
    } catch (error) {
        console.error("❌ Failed to initialize services:", error);
        process.exit(1);
    }
}

// Initialize services on startup
initializeServices();

// Start the HTTP server for Socket.IO
server.listen(Number(config.PORT) + 1, () => {
    console.log(`🔌 Socket.IO server running on port ${Number(config.PORT) + 1}`);
});

export default {
    fetch: app.fetch.bind(app),
    port: Number(config.PORT),
    idleTimeout: 255,
};
