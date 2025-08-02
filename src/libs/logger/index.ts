import { pino } from "pino";

export enum LogTypes {
    LOGS = "logs",
    ERROR = "error",
    CUSTOMOBJ = "customObj",
}

const init = () => pino({
    base: null // disables pid, hostname, and other default fields
});
const Logs = (msg: string) => init().info(msg);
const ErrorLogs = (msg: string) => init().error(msg);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customLogHandler = (obj: any) => init().child(obj);

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
