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
					await this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_DELETE', message),
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
				await this.client.t('ARGS.INVALID', message, { type: 'application' })
			);
			return;
		}
		const submissions = await Submission.findAll({
			where: {
				position: app.id
			}
		});
		if (submissions.length >= 1 && !force) {
			await message.util?.reply(
				await this.client.t('CONFIG.DELETE_EXISTING', message)
			);
			return;
		}
		await Promise.all(submissions.map(s => s.destroy()));
		await app.destroy();
		await message.util!.reply(
			await this.client.t('CONFIG.APPLICATION_DELETED', message, {
				app: app.name
			})
		);
	}
}
