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

        // Note: ensureIndexes() is commented out due to issues with missing indexes
        // Indexes should be created manually in Couchbase or through a migration script
        // Uncomment below when all required indexes are present in the database
        /*
        try {
            log("Ensuring database indexes...", LogTypes.LOGS, "DB");
            await ottoman.ensureIndexes();
            log("Database indexes ensured", LogTypes.LOGS, "DB");
        } catch (error) {
            // Log warning but don't fail - indexes may not exist yet or need manual creation
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Warning: Could not ensure indexes (this is usually safe to ignore): ${errorMessage}`, LogTypes.LOGS, "DB");
            // Don't throw - continue with startup even if index creation fails
        }
        */

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
