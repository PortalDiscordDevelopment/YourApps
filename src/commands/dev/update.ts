import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class UpdateCommand extends BotCommand {
	constructor() {
		super('update', {
			aliases: ['update'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.UPDATE'),
				usage: 'update [--restart]',
				examples: ['update', 'update --restart']
			},
			args: [
				{
					id: 'restart',
					match: 'flag',
					flag: '--restart'
				}
			],
			ownerOnly: true,
			typing: true
		});
	}

	public async exec(message: Message, { restart }: { restart: boolean }) {
		try {
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
					restart ? 'restarting' : 'reloading'
				} bot...`
			);
			if (restart) await this.client.util.shell(`pm2 restart yourapps`);
			else {
				this.client.commandHandler.reloadAll();
				this.client.listenerHandler.reloadAll();
				this.client.inhibitorHandler.reloadAll();
				await this.client.util.loadLanguages();
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
