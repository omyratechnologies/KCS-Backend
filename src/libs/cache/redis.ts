import { Redis } from "ioredis";

import log, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

export class Cache {
    private static redis: Redis;
    private static instance: Cache;
    private static statusReported = false;

    public static readonly init = () => {
        this.redis = new Redis(config.REDIS_URI);

        // Only show connection status once after initial attempt
        this.redis.on("ready", () => {
            if (!this.statusReported) {
                log("Redis connected", LogTypes.LOGS, "Cache");
                this.statusReported = true;
            }
        });

        // Show disconnection only if we were previously connected
        this.redis.on("close", () => {
            if (this.statusReported) {
                log("Redis disconnected", LogTypes.ERROR, "Cache");
                this.statusReported = false;
            }
        });

        // Show connection failure after initial timeout
        setTimeout(() => {
            if (!this.statusReported && this.redis.status !== "ready") {
                log("Redis not connected", LogTypes.ERROR, "Cache");
                this.statusReported = true;
            }
        }, 1000);

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

    public static readonly expire = async (key: string, seconds: number) => {
        return await this.redis.expire(key, seconds);
    };

    public static readonly setex = async (key: string, seconds: number, value: string) => {
        return await this.redis.setex(key, seconds, value);
    };
}
