"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("@sapphire/framework");
const moment_1 = tslib_1.__importDefault(require("moment"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
class Logger {
    constructor(level) {
        Object.defineProperty(this, "level", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map([
                ['info', 'blue'],
                ['error', 'red'],
                ['debug', 'magenta'],
                ['warn', 'red'],
                ['trace', 'black'],
            ])
        });
        this.level = level;
    }
    has(level) {
        return level >= this.level;
    }
    trace(...values) {
        this.write(10 /* Trace */, ...values);
    }
    debug(...values) {
        this.write(20 /* Debug */, ...values);
    }
    info(...values) {
        this.write(30 /* Info */, ...values);
    }
    warn(...values) {
        this.write(40 /* Warn */, ...values);
    }
    error(...values) {
        this.write(50 /* Error */, ...values);
    }
    fatal(...values) {
        this.write(60 /* Fatal */, ...values);
        process.exit();
    }
    write(level, ...values) {
        if (!this.has(level))
            return;
        const method = Logger.levels.get(level);
        if (typeof method === 'string')
            console[method]((0, chalk_1.default) `{${this.colors.get(method)} [${method.toUpperCase()}]} {${this.colors.get(method)}Bright ${(0, moment_1.default)().format('YYYY-MM-DD hh:mm:ss A')}}:`, ...values);
    }
}
exports.default = Logger;
Object.defineProperty(Logger, "levels", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map([
        [10 /* Trace */, 'trace'],
        [20 /* Debug */, 'debug'],
        [30 /* Info */, 'info'],
        [40 /* Warn */, 'warn'],
        [50 /* Error */, 'error'],
        [60 /* Fatal */, 'error'],
    ])
});
//# sourceMappingURL=Logger.js.map