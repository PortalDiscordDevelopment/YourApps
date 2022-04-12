"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotCommand = void 0;
const tslib_1 = require("tslib");
const framework_1 = require("@sapphire/framework");
const config = tslib_1.__importStar(require("../options/config"));
const Utils_1 = require("./Utils");
class BotCommand extends framework_1.Command {
    constructor(context, options) {
        super(context, options);
        Object.defineProperty(this, "parseArgs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: Utils_1.Utils.parseInteractionArgs
        });
    }
    registerApplicationCommands(registry) {
        if (this.chatInputRun && this.name && this.options.slashOptions) {
            const command = {
                name: this.name,
                description: this.options.slashOptions.description || this.description || 'No description provided.',
                options: this.options.slashOptions.options || [],
            };
            registry.registerChatInputCommand(command, {
                idHints: this.options.slashOptions.idHints
                    ? this.options.slashOptions.idHints
                    : config.slashHints[this.name]
                        ? [config.slashHints[this.name]]
                        : [],
                behaviorWhenNotIdentical: "OVERWRITE" /* Overwrite */,
                ...(config.dev
                    ? { guildId: config.devGuild }
                    : this.options.slashOptions.guildIDs
                        ? { guildIds: this.options.slashOptions.guildIDs }
                        : {}),
            });
        }
    }
}
exports.BotCommand = BotCommand;
//# sourceMappingURL=BotCommand.js.map