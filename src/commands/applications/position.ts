import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Message } from 'discord.js';

export default class PositionCommand extends BotCommand {
	constructor() {
		super('position', {
			aliases: ['position', 'app', 'application'],
			channel: 'guild',
			description: {
				content: () => await this.client.t('COMMANDS.DESCRIPTIONS.POSITION', message),
				usage: 'position',
				examples: ['position']
			},
			args: [
				{
					id: 'application',
					type: 'application',
					match: 'rest'
				}
			]
		});
	}
	async exec(message: Message, { application }: { application: App | null }) {
		if (!application) {
			await message.util!.send(
				await this.client.t('ARGS.INVALID', message, { type: 'application' })
			);
			return;
		}
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle(
						await this.client.t('CONFIG.APPLICATION_DETAILS', message, {
							application: application.name
						})
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_NAME', message),
						application.name,
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_DESCRIPTION', message),
						application.description ?? await this.client.t('CONFIG.NOT_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_QUESTION_COUNT', message),
						application.questions.length.toString(),
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_REWARD_ROLES', message),
						application.rewardroles.length > 0
							? application.rewardroles.map(r => `<@&${r}>`).join(', ')
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_REMOVE_ROLES', message),
						application.removeroles.length > 0
							? application.removeroles.map(r => `<@&${r}>`).join(', ')
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_REQUIRED_ROLES', message),
						application.requiredroles.length > 0
							? application.requiredroles.map(r => `<@&${r}>`).join(', ')
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_CUSTOM_COMMAND', message),
						application.customcommand ?? await this.client.t('CONFIG.NOT_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_CLOSED_TITLE', message),
						application.closed
							? await this.client.t('GENERIC.YES', message)
							: await this.client.t('GENERIC.NO', message),
						true
					)
					.addField(
						'Cooldown',
						application.cooldown
							? `${application.cooldown} milliseconds`
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						'Minimum join time',
						application.minjointime
							? `${application.minjointime} milliseconds`
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.APPLICATION_ID', message),
						application.id.toString(),
						true
					)
			]
		});
	}
}
