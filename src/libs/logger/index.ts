import { pino } from "pino";

import { config } from "@/utils/env";

export enum LogTypes {
    LOGS = "logs",
    ERROR = "error",
    CUSTOMOBJ = "customObj",
}

// Create a single logger instance with optimized configuration
const logger = pino({
    level: config.NODE_ENV === "production" ? "info" : "debug",
    base: {
        pid: false,
        hostname: false,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    transport:
        config.NODE_ENV === "production"
            ? undefined
            : {
                  target: "pino-pretty",
                  options: {
                      colorize: true,
                      ignore: "pid,hostname",
                      translateTime: "SYS:standard",
                  },
              },
});

const Logs = (msg: string) => logger.info(msg);
const ErrorLogs = (msg: string) => logger.error(msg);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customLogHandler = (obj: any) => logger.child(obj);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const infoLogs = (msg: any, logType: LogTypes, generated_by: string) => {
    if (
        generated_by &&
        [LogTypes.LOGS, LogTypes.ERROR].includes(logType) &&
        typeof msg === "string"
    ) {
        msg = `[${generated_by}] ` + msg;
    }
    if (logType === LogTypes.LOGS) return Logs(msg);
    if (logType === LogTypes.ERROR) return ErrorLogs(msg);
    return customLogHandler(msg);
};

export default infoLogs;
export { logger };
