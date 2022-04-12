import { type ILogger, LogLevel, type LogMethods } from "@sapphire/framework"
import moment from "moment"
import chalk from 'chalk'

export default class Logger implements ILogger {
	public level: LogLevel

	public constructor(level: LogLevel) {
		this.level = level
	}

	public has(level: LogLevel): boolean {
		return level >= this.level
	}

	public trace(...values: readonly unknown[]): void {
		this.write(LogLevel.Trace, ...values)
	}

	public debug(...values: readonly unknown[]): void {
		this.write(LogLevel.Debug, ...values)
	}

	public info(...values: readonly unknown[]): void {
		this.write(LogLevel.Info, ...values)
	}

	public warn(...values: readonly unknown[]): void {
		this.write(LogLevel.Warn, ...values)
	}

	public error(...values: readonly unknown[]): void {
		this.write(LogLevel.Error, ...values)
	}

	public fatal(...values: readonly unknown[]): void {
		this.write(LogLevel.Fatal, ...values)
		process.exit()
	}

	public write(level: LogLevel, ...values: readonly unknown[]): void {
		if (!this.has(level)) return
		const method = Logger.levels.get(level)
		if (typeof method === 'string') console[method](chalk`{${this.colors.get(method)} [${method.toUpperCase()}]} {${this.colors.get(method)}Bright ${moment().format('YYYY-MM-DD hh:mm:ss A')}}:`, ...values)
	}

	protected static readonly levels = new Map<LogLevel, LogMethods>([
		[LogLevel.Trace, 'trace'],
		[LogLevel.Debug, 'debug'],
		[LogLevel.Info, 'info'],
		[LogLevel.Warn, 'warn'],
		[LogLevel.Error, 'error'],
		[LogLevel.Fatal, 'error'],
	])

	protected readonly colors = new Map<LogMethods, string>([
		['info', 'blue'],
		['error', 'red'],
		['debug', 'magenta'],
		['warn', 'red'],
		['trace', 'black'],
	])
}