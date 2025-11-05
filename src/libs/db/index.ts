import { Ottoman } from "ottoman";

import log, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

// Interface for Couchbase errors
interface CouchbaseError extends Error {
    code?: number;
    context?: unknown;
}

const ottoman = new Ottoman({});

const initDB = async () => {
    try {
        log("Attempting to connect to Couchbase database...", LogTypes.LOGS, "DB");
        
        await ottoman.connect({
            bucketName: config.OTTOMAN_BUCKET_NAME,
            connectionString: config.OTTOMAN_CONNECTION_STRING,
            username: config.OTTOMAN_USERNAME,
            password: config.OTTOMAN_PASSWORD,
        });
        
        log("Ottoman connection established, starting Ottoman...", LogTypes.LOGS, "DB");
        await ottoman.start();

        // Import all models after database connection is established
        log("Importing database models...", LogTypes.LOGS, "DB");
        await import("@/models");

        // Ensure all models/collections are created
        // Note: This may fail if indexes don't exist, but that's okay
        try {
            log("Ensuring database collections and indexes...", LogTypes.LOGS, "DB");
            
            // First ensure collections exist
            await ottoman.ensureCollections();
            log("Database collections ensured", LogTypes.LOGS, "DB");
            
            // Then try to ensure indexes (may fail if some don't exist)
            try {
                await ottoman.ensureIndexes();
                log("Database indexes ensured", LogTypes.LOGS, "DB");
            } catch (indexError) {
                // Indexes might not exist yet - that's okay, log and continue
                log(`Info: Some indexes may need manual creation: ${indexError instanceof Error ? indexError.message : String(indexError)}`, LogTypes.LOGS, "DB");
            }
        } catch (error) {
            // Log warning but don't fail - collections/indexes may need manual creation
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Warning: Could not ensure collections/indexes (continuing anyway): ${errorMessage}`, LogTypes.LOGS, "DB");
        }

        log("Connected to DB", LogTypes.LOGS, "DB");
    } catch (error) {
        // Handle specific Couchbase errors
        if (error && typeof error === 'object' && 'code' in error) {
            const couchbaseError = error as CouchbaseError;
            switch (couchbaseError.code) {
                case 14: // Unambiguous timeout
                    log(`Database connection timeout: Unable to connect to Couchbase server at ${config.OTTOMAN_CONNECTION_STRING}. Please check if the server is running and accessible.`, LogTypes.ERROR, "DB");
                    throw new Error(`Database connection timeout. Server may be down or unreachable.`);
                case 11: // Authentication error  
                    log(`Database authentication failed: Invalid credentials for user ${config.OTTOMAN_USERNAME}`, LogTypes.ERROR, "DB");
                    throw new Error(`Database authentication failed. Please check username and password.`);
                case 5: // Bucket not found
                    log(`Database bucket not found: Bucket '${config.OTTOMAN_BUCKET_NAME}' does not exist`, LogTypes.ERROR, "DB");
                    throw new Error(`Database bucket '${config.OTTOMAN_BUCKET_NAME}' not found.`);
                default:
                    log(`Database connection error (code ${couchbaseError.code}): ${couchbaseError.message}`, LogTypes.ERROR, "DB");
                    throw new Error(`Database connection failed: ${couchbaseError.message}`);
            }
        }
        
        // Handle generic errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Database initialization failed: ${errorMessage}`, LogTypes.ERROR, "DB");
        throw new Error(`Database initialization failed: ${errorMessage}`);
    }
};

export { initDB, ottoman };
