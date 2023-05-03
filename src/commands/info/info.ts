import { BotCommand } from '@lib/ext/BotCommand';
import { Message, MessageEmbed } from 'discord.js';

/* XoXo Dummi */
export default class InfoCommand extends BotCommand {
	constructor() {
		super('info', {
			aliases: ['info'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.INFO'),
				usage: 'info',
				examples: ['info']
			}
		});
	}

	public async exec(message: Message): Promise<void> {
		const embed = new MessageEmbed()
			.setTitle('INFO')
			.addField('Stats', `Servers: ${this.client?.guilds?.cache?.size}`)
			.setTimestamp();

		await message.util?.reply({ embeds: [embed] });
	}
}
