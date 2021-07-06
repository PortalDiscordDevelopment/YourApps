import { BotListener } from '@lib/ext/BotListener';
import { TextChannel } from 'discord.js';

export default class ReadyListener extends BotListener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready'
		});
	}
	public async exec() {
		console.log('Bot ready');
		// Cache error channel
		try {
			const errorChannel = await this.client.channels.fetch(
				this.client.config.channels.error
			);
			if (!(errorChannel instanceof TextChannel)) {
				console.error('Error channel in config must be a text channel!');
				process.exit(1);
			}
			this.client.errorChannel = errorChannel as TextChannel;
		} catch {
			console.error(
				'Error channel in config must be a channel that the bot can see!'
			);
			process.exit(1);
		}
	}
}
