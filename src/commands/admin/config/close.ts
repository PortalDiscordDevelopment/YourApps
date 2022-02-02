import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models';
import { LogEvent } from '@lib/ext/Util';

export default class CloseCommand extends BotCommand {
	public constructor() {
		super('config-close', {
			aliases: ['config-close'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_CLOSE'),
				usage: 'config close <application>',
				examples: ['config close moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'application',
					type: 'application',
					match: 'rest'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { application }: { application?: App }) {
		if (!application) {
			await message.util!.send(
				await this.client.t('ARGS.INVALID', message, { type: 'application' })
			);
			return;
		}
		if (application.closed) {
			await message.util!.send(
				await this.client.t('CONFIG.APPLICATION_NOT_OPEN', message)
			);
			return;
		}
		application.closed = true;
		application.save();
		await message.util!.send(
			await this.client.t('CONFIG.APPLICATION_CLOSED', message, {
				application: application.name
			})
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.CLOSE,
			{
				application: application.name
			}
		);
	}
}
