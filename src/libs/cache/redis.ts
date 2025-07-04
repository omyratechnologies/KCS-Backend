import { Redis } from "ioredis";

import log, { LogTypes } from "@/libs/logger";
import { config } from "@/utils/env";

export class Cache {
    private static redis: Redis;
    private static instance: Cache;

    public static readonly init = () => {
        this.redis = new Redis(config.REDIS_URI);
        log("Redis connected", LogTypes.LOGS, "Cache");
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
