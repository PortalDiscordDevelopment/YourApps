import { BotCommand } from '@lib/ext/BotCommand';
import { LogEvent } from '@lib/ext/Util';
import { App } from '@lib/models/App';
import { Guild } from '@lib/models/Guild';
import { Message, Channel } from 'discord.js';

export default class ConfigDeleteCommand extends BotCommand {
	constructor() {
		super('config-delete', {
			aliases: ['config-delete'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_DELETE'),
				usage: 'config delete <application>',
				examples: ['config delete moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'app',
					type: 'application'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { app }: { app: App }) {
		if (!app) {
			await message.util!.send(
				this.client.i18n.t('ARGS.INVALID', { type: 'application' })
			);
			return;
		}
		await app.destroy();
		await message.util!.reply(
			this.client.i18n.t('CONFIG.APPLICATION_DELETED', { app: app.name })
		);
	}
}
