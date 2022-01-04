import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class UpdateCommand extends BotCommand {
	constructor() {
		super('update', {
			aliases: ['update'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.UPDATE'),
				usage: 'update',
				examples: ['update']
			},
			ownerOnly: true,
			typing: true
		});
	}

	public async exec(message: Message) {
		try {
			await message.util!.send('Git pulling...');
			await this.client.util.shell(`git pull`);
			await message.util!.send('Testing build...');
			await this.client.util.shell(`yarn build`);
			await message.util!.send('Restarting bot...');
			await this.client.util.shell(`pm2 restart yourapps`);
		} catch (e) {
			return message.util!.send(
				this.client.i18n.t('DEVELOPER.ERROR_RELOADING', {
					link: await this.client.util.haste(e.stack)
				})
			);
		}
	}
}
