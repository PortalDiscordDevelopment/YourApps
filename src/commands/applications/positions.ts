import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Message } from 'discord.js';

export default class PositionsCommand extends BotCommand {
	constructor() {
		super('positions', {
			aliases: ['positions', 'pos', 'apps', 'applications'],
			channel: 'guild',
			description: {
				content: () => await this.client.t('COMMANDS.DESCRIPTIONS.POSITIONS', message),
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
			await message.util!.send(await this.client.t('COMMANDS.NO_APPLICATIONS', message));
			return;
		}
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle(
						await this.client.t('COMMANDS.POSITIONS_TITLE', message, {
							guild: message.guild!.name
						})
					)
					.setDescription(
						applications
							.map(app => `${app.closed ? '❌' : '✅'} ${app.name}`)
							.join('\n')
					)
			]
		});
	}
}
