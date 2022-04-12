"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotClient = void 0;
const tslib_1 = require("tslib");
const framework_1 = require("@sapphire/framework");
const config = tslib_1.__importStar(require("../options/config"));
const Logger_1 = tslib_1.__importDefault(require("./Logger"));
class BotClient extends framework_1.SapphireClient {
    constructor() {
        super({
            intents: ['GUILDS', 'GUILD_MESSAGES'],
            logger: {
                instance: new Logger_1.default(20 /* Debug */)
            }
        });
    }
    async start() {
        return this.login(config.token);
    }
}
exports.BotClient = BotClient;
//# sourceMappingURL=BotClient.js.map