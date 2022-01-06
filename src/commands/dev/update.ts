import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class UpdateCommand extends BotCommand {
	constructor() {
		super('update', {
			aliases: ['update'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.UPDATE'),
				usage: 'update [--restart] [--force]',
				examples: ['update', 'update --restart', 'update --force']
			},
			args: [
				{
					id: 'restart',
					match: 'flag',
					flag: '--restart'
				},
				{
					id: 'force',
					match: 'flag',
					flag: '--force'
				}
			],
			ownerOnly: true,
			typing: true
		});
	}

	public async exec(
		message: Message,
		{ restart, force }: { restart: boolean; force: boolean }
	) {
		try {
			if (this.client.util.concurrentCommands.length > 0 && !force) {
				await message.util!.send(
					`There is ${this.client.util.concurrentCommands.length} commands currently running, cancelling. To bypass this, use the --force flag.`
				);
				return;
			}
			await message.util!.send(
				'<a:loading3:928388076001189918> Git pulling...'
			);
			await this.client.util.shell(`git pull`);
			await message.util!.send(
				'<a:loading3:928388076001189918> Testing build...'
			);
			await this.client.util.shell(`yarn build`);
			await message.util!.send(
				`<a:loading3:928388076001189918> ${
					restart ? 'Restarting' : 'Reloading'
				} bot...`
			);
			if (restart) await this.client.util.shell(`pm2 restart yourapps`);
			else {
				this.client.commandHandler.reloadAll();
				this.client.listenerHandler.reloadAll();
				this.client.inhibitorHandler.reloadAll();
				await this.client.util.loadLanguages();
				await message.util!.send(
					'<a:checkmark:928707645483929630> Successfully reloaded bot!'
				);
			}
		} catch (e) {
			return message.util!.send(
				this.client.i18n.t('DEVELOPER.ERROR_RELOADING', {
					link: await this.client.util.haste(e.stack)
				})
			);
		}
	}
}
