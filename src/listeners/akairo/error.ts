import { Command } from 'discord-akairo';
import { BotListener } from '@lib/ext/BotListener';
import { Message } from 'discord.js';
import { stripIndent } from 'common-tags';

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
		if (!command && this.client.errorChannel) {
			const errorEmbed = this.client.util
				.embed()
				.setTitle('Inhibitor error')
				.setDescription(
					stripIndent`
					**User:** <@${message.author.id}> (${message.author.tag})
					**Channel:** <#${message.channel.id}}> (${message.channel.id})
					**Message:** [link](${message.url})
				`
				)
				.addField(
					'Error',
					await this.client.util.codeblock(
						`${error?.stack ?? error}`,
						1024,
						'js'
					)
				);
			await this.client.errorChannel.send({
				embeds: [errorEmbed]
			});
		}
		if (command) {
			this.client.util.removeConcurrent({
				guild: message.guildId!,
				id: command.id,
				message: message.content,
				user: message.author.id
			});
			const errorNo = Math.floor(Math.random() * 6969696969) + 69; // hehe funny number
			if (this.client.errorChannel) {
				const errorEmbed = this.client.util
					.embed()
					.setTitle(`Command error #${errorNo}`)
					.setDescription(
						stripIndent`
						**User:** <@${message.author.id}> (${message.author.tag})
						**Command:** ${command.id}
						**Channel:** <#${message.channel.id}> (${message.channel.id})
						**Message:** [link](${message.url})
					`
					)
					.addField(
						'Error',
						await this.client.util.codeblock(
							`${error?.stack ?? error}`,
							1024,
							'js'
						)
					);

				await this.client.errorChannel.send({
					embeds: [errorEmbed]
				});
			}
			if (command) {
				const errorUserEmbed = this.client.util
					.embed()
					.setTitle(
						await this.client.t('ERRORS.COMMAND_ERROR_OCCURRED', message)
					)
					.setDescription(
						await this.client.t('ERRORS.COMMAND_ERROR_MESSAGE', message, {
							command: message.util!.parsed!.alias,
							errorNo
						})
					);
				await message.util!.send({
					embeds: [errorUserEmbed]
				});
			}
		}
	}
}
