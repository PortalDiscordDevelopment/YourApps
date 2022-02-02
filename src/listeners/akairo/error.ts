import { Command } from 'discord-akairo';
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
		if (!command && this.client.errorChannel) {
			const errorEmbed = this.client.util
				.embed()
				.setTitle(await this.client.t('ERROR_LOGGING.INHIBITOR.TITLE', message))
				.setDescription(
					await this.client.t('ERROR_LOGGING.INHIBITOR.BODY', message, {
						userID: message.author.id,
						userTag: message.author.tag,
						channelID: message.channel.id,
						messageUrl: message.url
					})
				)
				.addField(
					await this.client.t('GENERIC.ERROR', message),
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
					.setTitle(
						await this.client.t('ERROR_LOGGING.COMMAND.TITLE', message, { errorNo })
					)
					.setDescription(
						await this.client.t('ERROR_LOGGING.COMMAND.BODY', message, {
							userID: message.author.id,
							userTag: message.author.tag,
							command: command.id,
							channelID: message.channel.id,
							messageUrl: message.url
						})
					)
					.addField(
						await this.client.t('GENERIC.ERROR', message),
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
					.setTitle(await this.client.t('ERROR_LOGGING.COMMAND.ERROR_OCCURRED', message))
					.setDescription(
						await this.client.t('ERROR_LOGGING.COMMAND.ERROR_MESSAGE', message, {
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
