import { Redis } from "ioredis";

import log, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

export class Cache {
    private static redis: Redis;
    private static instance: Cache;

    public static readonly init = () => {
        this.redis = new Redis(config.REDIS_URI);
        
        // Add proper error handling for Redis
        this.redis.on("error", (error) => {
            log(`Redis error: ${error.message}`, LogTypes.ERROR, "Cache");
        });

        this.redis.on("connect", () => {
            log("Redis connected successfully", LogTypes.LOGS, "Cache");
        });

        this.redis.on("ready", () => {
            log("Redis ready to accept commands", LogTypes.LOGS, "Cache");
        });

        this.redis.on("close", () => {
            log("Redis connection closed", LogTypes.ERROR, "Cache");
        });

        this.redis.on("reconnecting", () => {
            log("Redis reconnecting...", LogTypes.LOGS, "Cache");
        });

        log("Redis client initialized", LogTypes.LOGS, "Cache");
    };

    public static readonly getInstance = () => {
        if (!this.instance) {
            this.instance = new Cache();
            this.init();
        }

        return this.instance;
    };

    public static readonly set = async (key: string, value: string) => {
        return await this.redis.set(key, value);
    };

    public static readonly get = async (key: string) => {
        return await this.redis.get(key);
    };
}
