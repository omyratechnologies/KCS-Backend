import { app } from "@/app";
import { Cache } from "@/libs/cache/redis";
import { initDB } from "@/libs/db";
import { UploadFactory } from "@/libs/s3/upload.factory";
import { config } from "@/utils/env";

Cache.init();
initDB();
UploadFactory.createUploadClient();

export default {
    fetch: app.fetch.bind(app),
    port: Number(config.PORT),
    idleTimeout: 255,
};
