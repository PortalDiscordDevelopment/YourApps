import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class ReloadCommand extends BotCommand {
	constructor() {
		super('reload', {
			aliases: ['reload'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.RELOAD'),
				usage: 'reload',
				examples: ['reload']
			},
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
			await this.client.i18n.reloadResources();
			return message.util!.send(
				`🔁 Successfully reloaded! (${new Date().getTime() - s.getTime()}ms)`
			);
		} catch (e) {
			return message.util!.send(
				`An error occurred while reloading:\n${await this.client.util.haste(
					(e as Error).stack!
				)}`
			);
		}
	}
}
