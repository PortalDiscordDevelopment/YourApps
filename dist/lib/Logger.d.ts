import { type ILogger, LogLevel, type LogMethods } from "@sapphire/framework";
export default class Logger implements ILogger {
    level: LogLevel;
    constructor(level: LogLevel);
    has(level: LogLevel): boolean;
    trace(...values: readonly unknown[]): void;
    debug(...values: readonly unknown[]): void;
    info(...values: readonly unknown[]): void;
    warn(...values: readonly unknown[]): void;
    error(...values: readonly unknown[]): void;
    fatal(...values: readonly unknown[]): void;
    write(level: LogLevel, ...values: readonly unknown[]): void;
    protected static readonly levels: Map<LogLevel, LogMethods>;
    protected readonly colors: Map<LogMethods, string>;
}
//# sourceMappingURL=Logger.d.ts.map