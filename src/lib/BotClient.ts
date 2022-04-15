import { LogLevel, SapphireClient } from '@sapphire/framework';
import * as config from '../options/config';

import '@sapphire/plugin-logger/register'; // Load logger
if (config.dev) {
	// Load HMR
	require('@sapphire/plugin-hmr/register'); // Sadly has to be require otherwise it gets turned into a promise and doesn't load synchronously
}

export class BotClient extends SapphireClient {
	public constructor() {
		super({
			intents: ['GUILDS', 'GUILD_MESSAGES'],
			logger: { level: LogLevel.Debug },
            hmr: {
                enabled: config.dev
            }
		});
	}

	public async start() {
		return this.login(config.token);
	}
}

declare module 'discord.js' {
    interface ClientOptions {
        hmr?: {
            enabled?: boolean;
            silent?: boolean;
        };
    }
}