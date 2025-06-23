import { app } from "@/app";
import { Cache } from "@/libs/cache/redis";
import { initDB } from "@/libs/db";
import { UploadFactory } from "@/libs/s3/upload.factory";
import { config } from "@/utils/env";

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
        
        console.log("🎉 All services initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize services:", error);
        process.exit(1);
    }
}

// Initialize services on startup
initializeServices();

export default {
    fetch: app.fetch.bind(app),
    port: Number(config.PORT),
    idleTimeout: 255,
};
