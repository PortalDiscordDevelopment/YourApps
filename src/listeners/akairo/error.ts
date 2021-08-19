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
		if (!command) {
			const errorEmbed = this.client.util
				.embed()
				.setTitle(this.client.i18n.t('ERROR_LOGGING.INHIBITOR.TITLE'))
				.setDescription(
					this.client.i18n.t('ERROR_LOGGING.INHIBITOR.BODY', {
						userID: message.author.id,
						userTag: message.author.tag,
						channelID: message.channel.id,
						messageUrl: message.url
					})
				)
				.addField(
					this.client.i18n.t('GENERIC.ERROR'),
					await this.client.util.codeblock(
						`${error?.stack ?? error}`,
						1024,
						'js'
					)
				);
			await this.client.errorChannel.send({
				embeds: [errorEmbed]
			});
		} else {
			const errorNo = Math.floor(Math.random() * 6969696969) + 69; // hehe funny number
			const errorEmbed = this.client.util
				.embed()
				.setTitle(
					this.client.i18n.t('ERROR_LOGGING.COMMAND.TITLE', { errorNo })
				)
				.setDescription(
					this.client.i18n.t('ERROR_LOGGING.COMMAND.BODY', {
						userID: message.author.id,
						userTag: message.author.tag,
						command: command.id,
						channelID: message.channel.id,
						messageUrl: message.url
					})
				)
				.addField(
					this.client.i18n.t('GENERIC.ERROR'),
					await this.client.util.codeblock(
						`${error?.stack ?? error}`,
						1024,
						'js'
					)
				);

			await this.client.errorChannel.send({
				embeds: [errorEmbed]
			});
			if (command) {
				const errorUserEmbed = this.client.util
					.embed()
					.setTitle(this.client.i18n.t('ERROR_LOGGING.COMMAND.ERROR_OCCURRED'))
					.setDescription(
						this.client.i18n.t('ERROR_LOGGING.COMMAND.ERROR_MESSAGE', {
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
