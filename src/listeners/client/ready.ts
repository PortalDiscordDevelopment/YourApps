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
				this.client.config.ownerIDs.forEach(async id => {
					try {
						const u = await this.client.users.fetch(id);
						u.send(
							'Error while loading:\nError channel in config must be a text channel (bot will still load)'
						);
					} catch {
						//
					}
				});
				console.error('Error channel in config must be a text channel!');
			}
			this.client.errorChannel = errorChannel as TextChannel;
		} catch {
			this.client.config.ownerIDs.forEach(async id => {
				try {
					const u = await this.client.users.fetch(id);
					u.send(
						'Error while loading:\nError channel in config must be a channel that the bot can see (bot will still load)'
					);
				} catch {
					//
				}
			});
			console.error(
				'Error channel in config must be a channel that the bot can see!'
			);
		}
	}
}
