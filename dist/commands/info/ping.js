"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingCommand = void 0;
const tslib_1 = require("tslib");
const decorators_1 = require("@sapphire/decorators");
const BotCommand_1 = require("../../lib/BotCommand");
const common_tags_1 = require("common-tags");
let PingCommand = class PingCommand extends BotCommand_1.BotCommand {
    async chatInputRun(interaction) {
        await interaction.deferReply();
        const reply = await interaction.fetchReply();
        await interaction.editReply((0, common_tags_1.stripIndent) `
            Shard: 0
            Delay: ${reply.createdTimestamp - interaction.createdTimestamp}ms
            Gateway: ${interaction.client.ws.ping}
        `);
    }
};
PingCommand = tslib_1.__decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'ping',
        aliases: ['ping', 'pong'],
        description: 'Gets the ping of the bot',
        preconditions: [],
        slashOptions: {
            options: []
        },
    })
], PingCommand);
exports.PingCommand = PingCommand;
//# sourceMappingURL=ping.js.map