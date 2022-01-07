import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Submission } from '@lib/models/Submission';
import {
	GuildMember,
	Message,
	MessageActionRow,
	MessageButton
} from 'discord.js';
import ConfigNewCommand from './config/new';

export default class ReviewCommand extends BotCommand {
	constructor() {
		super('review', {
			aliases: ['review'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.REVIEW_DESCRIPTION'),
				usage: 'review <user> <application>',
				examples: ['review @Tyman cool']
			},
			channel: 'guild',
			permissionCheck: 'reviewer',
			args: [
				{
					id: 'user',
					type: 'member'
				},
				{
					id: 'application',
					type: 'application',
					match: 'rest'
				}
			]
		});
	}

	async exec(
		message: Message,
		{ user, application }: { user: GuildMember | null; application: App | null }
	) {
		if (!user) {
			await message.util!.send(
				this.client.i18n.t('ARGS.INVALID', { type: 'user' })
			);
			return;
		}
		if (!application) {
			await message.util!.send(
				this.client.i18n.t('ARGS.INVALID', { type: 'application' })
			);
			return;
		}
		const submission = await Submission.findOne({
			where: {
				guild: message.guild!.id,
				position: application.id,
				author: user.id
			}
		});
		if (!submission) {
			await message.util!.send(
				this.client.i18n.t('COMMANDS.REVIEW_NOT_APPLIED')
			);
			return;
		}
		const {
			approveButtonId,
			approveWithReasonId,
			denyButtonId,
			cancelButtonId
		} = {
			approveButtonId: `approveSubmissionReview|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			approveWithReasonId: `approveSubmissionReviewWithReason|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			denyButtonId: `denySubmissionReview|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			cancelButtonId: `cancelSubmissionReview|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const reviewMessage = await message.reply({
			embeds: [
				this.client.util
					.embed()
					.setTitle(
						this.client.i18n.t('COMMANDS.REVIEW_TITLE', {
							user: user.user.tag,
							application: application.name
						})
					)
					.setDescription(
						this.client.i18n.t('COMMANDS.REVIEW_EMBED_DESCRIPTION')
					)
					.addFields(
						Object.entries(submission.answers).map(e => ({
							name: e[0],
							value: e[1].toString(),
							inline: true
						}))
					)
			],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(approveButtonId)
						.setEmoji('✅')
						.setLabel(this.client.i18n.t('GENERIC.APPROVE'))
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(approveWithReasonId)
						.setEmoji('✅')
						.setLabel(this.client.i18n.t('GENERIC.APPROVE_WITH_REASON'))
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(denyButtonId)
						.setEmoji('✖')
						.setLabel(this.client.i18n.t('GENERIC.DENY'))
						.setStyle('DANGER')
				),
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(cancelButtonId)
						.setEmoji('🗑')
						.setLabel(this.client.i18n.t('GENERIC.CANCEL'))
						.setStyle('DANGER')
				)
			]
		});
		const response = await reviewMessage.awaitMessageComponent({
			filter: i =>
				[
					approveButtonId,
					approveWithReasonId,
					denyButtonId,
					cancelButtonId
				].includes(i.customId) && i.user.id == message.author.id,
			componentType: 'BUTTON'
		});
		await response.deferUpdate();
		switch (response.customId) {
			case approveButtonId:
				await this.client.util.approveSubmission(message.author, submission);
				await reviewMessage.edit({
					content: this.client.i18n.t('GENERIC.SUCCESSFULLY_APPROVED'),
					components: [],
					embeds: []
				});
				break;
			case approveWithReasonId: {
				const ids = {
					continueButtonId: `continueReview|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelReview|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				};
				const reason = await (
					this.handler.modules.get('config-new') as ConfigNewCommand
				).sendPromptSingle(message, {
					ids,
					allowSkip: false,
					fieldName: this.client.i18n.t('GENERIC.REASON'),
					description: this.client.i18n.t('GENERIC.ENTER_REASON'),
					process: m => ({
						processed: {
							user: m.content,
							data: m.content
						},
						success: true
					}),
					title: this.client.i18n.t('GENERIC.APPROVE_REASON')
				});
				if (reason.cancelled) {
					await response.editReply(this.client.i18n.t('GENERIC.CANCELED'));
					return;
				}
				await this.client.util.approveSubmission(
					message.author,
					submission,
					reason.result
				);
				await reviewMessage.edit({
					content: this.client.i18n.t('GENERIC.SUCCESSFULLY_APPROVED'),
					components: [],
					embeds: []
				});
				break;
			}
			case denyButtonId: {
				const ids = {
					continueButtonId: `continueReview|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelReview|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				};
				const reason = await (
					this.handler.modules.get('config-new') as ConfigNewCommand
				).sendPromptSingle(message, {
					ids,
					allowSkip: false,
					fieldName: this.client.i18n.t('GENERIC.REASON'),
					description: this.client.i18n.t('GENERIC.ENTER_REASON'),
					process: m => ({
						processed: {
							user: m.content,
							data: m.content
						},
						success: true
					}),
					title: this.client.i18n.t('GENERIC.DENY')
				});
				if (reason.cancelled) {
					await response.editReply(this.client.i18n.t('GENERIC.CANCELED'));
					return;
				}
				await this.client.util.denySubmission(
					message.author,
					submission,
					reason.result!
				);
				await reviewMessage.edit({
					content: this.client.i18n.t('GENERIC.SUCCESSFULLY_DENIED'),
					components: [],
					embeds: []
				});
				break;
			}
			case cancelButtonId:
				await response.editReply(this.client.i18n.t('GENERIC.CANCELED'));
				break;
		}
	}
}
