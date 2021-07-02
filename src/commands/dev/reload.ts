import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class ReloadCommand extends BotCommand {
	constructor() {
		super('reload', {
			aliases: ['reload'],
			description: {
				content: 'Reloads the bot',
				usage: 'reload',
				examples: ['reload']
			},
			args: [
				{
					id: 'fast',
					match: 'flag',
					flag: '--fast'
				}
			],
			ownerOnly: true,
			typing: true
		});
	}

	public async exec(message: Message) {
		try {
			const s = new Date();
			await this.client.util.shell(`yarn build`);
			this.client.commandHandler.reloadAll();
			this.client.listenerHandler.reloadAll();
			this.client.inhibitorHandler.reloadAll();
			return message.util.send(
				`🔁 Successfully reloaded! (${new Date().getTime() - s.getTime()}ms)`
			);
		} catch (e) {
			return message.util.send(
				`An error occurred while reloading:\n${await this.client.util.haste(
					e.stack
				)}`
			);
		}
	}
}
