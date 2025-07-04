import { Ottoman } from "ottoman";

import log, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

const ottoman = new Ottoman({});

const initDB = async () => {
    await ottoman.connect({
        bucketName: config.OTTOMAN_BUCKET_NAME,
        connectionString: config.OTTOMAN_CONNECTION_STRING,
        username: config.OTTOMAN_USERNAME,
        password: config.OTTOMAN_PASSWORD,
    });
    await ottoman.start();
    
    // Import all models after database connection is established
    await import("@/models");
    
    // Ensure all models/collections are created
    try {
        await ottoman.ensureIndexes();
        log("Database indexes ensured", LogTypes.LOGS, "DB");
    } catch (error) {
        log(`Warning: Could not ensure indexes: ${error}`, LogTypes.ERROR, "DB");
    }
    
    log("Connected to DB", LogTypes.LOGS, "DB");
};

export { initDB, ottoman };
