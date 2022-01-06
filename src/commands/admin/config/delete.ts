import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Submission } from '@lib/models/Submission';
import { Message } from 'discord.js';

export default class ConfigDeleteCommand extends BotCommand {
	constructor() {
		super('config-delete', {
			aliases: ['config-delete'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_DELETE'),
				usage: 'config delete <application> [--force]',
				examples: ['config delete moderator', 'config delete moderator --force']
			},
			category: 'admin',
			args: [
				{
					id: 'app',
					type: 'application',
					match: 'rest'
				},
				{
					id: 'force',
					match: 'flag',
					flag: '--force'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { app, force }: { app: App; force: boolean }) {
		if (!app) {
			await message.util!.send(
				this.client.i18n.t('ARGS.INVALID', { type: 'application' })
			);
			return;
		}
		const submissions = await Submission.findAll({
			where: {
				position: app.id
			}
		});
		if (submissions.length >= 1 && !force) {
			await message.util?.reply(this.client.i18n.t('CONFIG.DELETE_EXISTING'));
			return;
		}
		await Promise.all(submissions.map(s => s.destroy()));
		await app.destroy();
		await message.util!.reply(
			this.client.i18n.t('CONFIG.APPLICATION_DELETED', { app: app.name })
		);
	}
}
