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
    log("Connected to DB", LogTypes.LOGS, "DB");
};

export { initDB, ottoman };
