import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Message } from 'discord.js';

export default class PositionsCommand extends BotCommand {
	constructor() {
		super('positions', {
			aliases: ['positions', 'pos', 'apps', 'applications'],
			channel: 'guild',
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.POSITIONS'),
				usage: 'positions',
				examples: ['positions']
			}
		});
	}
	async exec(message: Message) {
		const applications = await App.findAll({
			where: {
				guild: message.guild!.id
			}
		});
		if (applications.length < 1) {
			await message.util!.send(this.client.i18n.t('COMMANDS.NO_APPLICATIONS'));
			return;
		}
		await message.util!.send(
			this.client.util
				.embed()
				.setTitle(
					this.client.i18n.t('COMMANDS.POSITIONS_TITLE', {
						guild: message.guild!.name
					})
				)
				.setDescription(
					applications
						.map((app) => `${app.closed ? '❌' : '✅'} ${app.name}`)
						.join('\n')
				)
		);
	}
}
