import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Message } from 'discord.js';

export default class PositionCommand extends BotCommand {
	constructor() {
		super('position', {
			aliases: ['position', 'app', 'application'],
			channel: 'guild',
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.POSITION'),
				usage: 'position',
				examples: ['position']
			},
			args: [
				{
					id: 'application',
					type: 'application'
				}
			]
		});
	}
	async exec(message: Message, { application }: { application: App | null }) {
		if (!application) {
			await message.util!.send(
				this.client.i18n.t('ARGS.INVALID', { type: 'application' })
			);
			return;
		}
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle(
						this.client.i18n.t('CONFIG.APPLICATION_DETAILS', {
							application: application.name
						})
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_NAME'),
						application.name,
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_DESCRIPTION'),
						application.description ?? this.client.i18n.t('CONFIG.NOT_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_QUESTION_COUNT'),
						application.questions.length.toString(),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_REWARD_ROLES'),
						application.rewardroles.length > 0
							? application.rewardroles.map(r => `<@&${r}>`).join(', ')
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_REMOVE_ROLES'),
						application.removeroles.length > 0
							? application.removeroles.map(r => `<@&${r}>`).join(', ')
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_REQUIRED_ROLES'),
						application.requiredroles.length > 0
							? application.requiredroles.map(r => `<@&${r}>`).join(', ')
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_CUSTOM_COMMAND'),
						application.customcommand ?? this.client.i18n.t('CONFIG.NOT_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_CLOSED_TITLE'),
						application.closed
							? this.client.i18n.t('GENERIC.YES')
							: this.client.i18n.t('GENERIC.NO'),
						true
					)
					.addField(
						'Cooldown',
						application.cooldown
							? `${application.cooldown} milliseconds`
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						'Minimum join time',
						application.minjointime
							? `${application.minjointime} milliseconds`
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.APPLICATION_ID'),
						application.id.toString(),
						true
					)
			]
		});
	}
}
