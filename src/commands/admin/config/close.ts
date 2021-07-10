import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models';

export default class CloseCommand extends BotCommand {
	public constructor() {
		super('config-close', {
			aliases: ['config-close'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_CLOSE'),
				usage: 'config close <application>',
				examples: ['config close moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'application',
					type: 'application'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { application }: { application?: App }) {
		if (!application) {
			await message.util!.send(
				this.client.i18n.t('ARGS.INVALID', { type: 'application' })
			);
			return;
		}
		if (application.closed) {
			await message.util!.send(
				this.client.i18n.t('CONFIG.APPLICATION_NOT_OPEN')
			);
			return;
		}
		application.closed = true;
		application.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.APPLICATION_CLOSED', {
				application: application.name
			})
		);
	}
}
