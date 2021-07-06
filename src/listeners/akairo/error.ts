import { stripIndents } from 'common-tags';
import { Command } from 'discord-akairo';
import { MessageEmbed } from 'discord.js';
import { BotListener } from '@lib/ext/BotListener';
import { Message } from 'discord.js';

export default class CommandErrorListener extends BotListener {
	public constructor() {
		super('commandError', {
			emitter: 'commandHandler',
			event: 'error'
		});
	}

	public async exec(
		error: Error,
		message: Message,
		command: Command | undefined
	): Promise<void> {
		if (!command) {
			const errorEmbed = new MessageEmbed()
				.setTitle(`Inihibitor error`)
				.setDescription(
					stripIndents`
					**User:** ${message.author} (${message.author.tag})
					**Channel:** ${message.channel} (${message.channel?.id})
					**Message:** [link](${message.url})`
				)
				.addField(
					'Error',
					await this.client.util.codeblock(
						`${error?.stack ?? error}`,
						1024,
						'js'
					)
				)
				.setTimestamp();
			await this.client.errorChannel.send(errorEmbed);
		} else {
			const errorNo = Math.floor(Math.random() * 6969696969) + 69; // hehe funny number
			const errorEmbed = new MessageEmbed()
				.setTitle(`Command error #\`${errorNo}\``)
				.setDescription(
					stripIndents`
					**User:** ${message.author} (${message.author.tag})
					**Command:** ${command}
					**Channel:** ${message.channel} (${message.channel.id})
					**Message:** [link](${message.url})`
				)
				.addField(
					'Error',
					await this.client.util.codeblock(
						`${error?.stack ?? error}`,
						1024,
						'js'
					)
				)
				.setTimestamp();

			await this.client.errorChannel.send(errorEmbed);
			if (command) {
				const errorUserEmbed: MessageEmbed = new MessageEmbed()
					.setTitle('A Command Error Occurred')
					.setDescription(
						`Oh no! While running the command \`${command.id}\`, an error occurred. Please give the developers code \`${errorNo}\`.`
					)
					.setTimestamp();
				await message.util!.send(errorUserEmbed);
			}
		}
	}
}
