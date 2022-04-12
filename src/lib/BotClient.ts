import { LogLevel, SapphireClient } from "@sapphire/framework";
import * as config from "../options/config";
import Logger from "./Logger";

export class BotClient extends SapphireClient {
    public constructor() {
        super({ 
            intents: ['GUILDS', 'GUILD_MESSAGES'],
            logger: {
                instance: new Logger(LogLevel.Debug)
            }
        })
    }

    public async start() {
        return this.login(config.token)
    }
}