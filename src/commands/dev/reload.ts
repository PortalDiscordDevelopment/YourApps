import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class ReloadCommand extends BotCommand {
	constructor() {
		super('reload', {
			aliases: ['reload'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.RELOAD'),
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
			await this.client.util.loadLanguages();
			return message.util!.send(
				this.client.i18n.t('DEVELOPER.RELOADED', {
					milliseconds: new Date().getTime() - s.getTime()
				})
			);
		} catch (e) {
			return message.util!.send(
				this.client.i18n.t('DEVELOPER.ERROR_RELOADING', {
					link: await this.client.util.haste((e as Error).stack!)
				})
			);
		}
	}
}
