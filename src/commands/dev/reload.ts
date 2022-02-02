import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class ReloadCommand extends BotCommand {
	constructor() {
		super('reload', {
			aliases: ['reload'],
			description: {
				content: () => await this.client.t('COMMANDS.DESCRIPTIONS.RELOAD', message),
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
				await this.client.t('DEVELOPER.RELOADED', message, {
					milliseconds: new Date().getTime() - s.getTime()
				})
			);
		} catch (e) {
			return message.util!.send(
				await this.client.t('DEVELOPER.ERROR_RELOADING', message, {
					link: await this.client.util.haste((e as Error).stack!)
				})
			);
		}
	}
}
