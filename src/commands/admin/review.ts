import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Submission } from '@lib/models/Submission';
import {
	Message,
	MessageActionRow,
	MessageButton,
	MessageSelectMenu,
	SelectMenuInteraction,
	User
} from 'discord.js';
import { Op } from 'sequelize';
import ConfigNewCommand from './config/new';

export default class ReviewCommand extends BotCommand {
	constructor() {
		super('review', {
			aliases: ['review'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.REVIEW_DESCRIPTION'),
				usage: 'review',
				examples: ['review']
			},
			channel: 'guild',
			permissionCheck: 'reviewer'
		});
	}

	async exec(message: Message) {
		const submissions = await Submission.findAll({
			where: {
				guild: message.guildId!
			}
		});
		const positionsSubmitted = submissions.reduce((prev, cur) => {
			if (prev.includes(cur.position)) return prev;
			else return [...prev, cur.position];
		}, [] as number[]);
		const apps = await App.findAll({
			where: {
				[Op.or]: positionsSubmitted.map(id => ({ id }))
			}
		});
		const positions = positionsSubmitted.map(
			id => apps.find(app => app.id == id)!
		);
		const ids = {
			positionsId: `selectPosReview|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			submissionId: `selectSumissionReview|1|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const menu = await message.util!.send({
			content: this.client.i18n.t('GENERIC.CHOOSE_POS'),
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.addOptions(
							positions.map(app => ({
								label: app.name,
								value: app.id.toString(),
								description: app.description ?? undefined
							}))
						)
						.setCustomId(ids.positionsId)
						.setPlaceholder(this.client.i18n.t('GENERIC.CHOSE_POS'))
				)
			]
		});
		const i = await menu.awaitMessageComponent({
			componentType: 'SELECT_MENU',
			filter: i =>
				i.user.id == message.author.id && i.customId == ids.positionsId
		});
		await i.deferUpdate();
		const pos = positions.find(
			p => p.id.toString() == (i as SelectMenuInteraction).values[0]!
		)!;
		const selectedSubmissions = await Promise.all(
			submissions
				.filter(
					s => s.position.toString() == (i as SelectMenuInteraction).values[0]!
				)
				.map(async s => ({
					user: await this.client.users.fetch(s.author),
					submission: s
				}))
		);
		const menu2 = await message.util!.send({
			content: this.client.i18n.t('GENERIC.CHOOSE_SUB'),
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.addOptions(
							selectedSubmissions.map(sub => ({
								label: sub.user.tag,
								value: sub.submission.id.toString(),
								description: pos.name
							}))
						)
						.setCustomId(ids.submissionId)
						.setPlaceholder(this.client.i18n.t('GENERIC.CHOOSE_A_SUB'))
				)
			]
		});
		const i2 = await menu2.awaitMessageComponent({
			componentType: 'SELECT_MENU',
			filter: i =>
				i.user.id == message.author.id && i.customId == ids.submissionId
		});
		await i2.deferUpdate();
		const sub = submissions.find(
			s => s.id.toString() == (i2 as SelectMenuInteraction).values[0]!
		)!;
		await this.startReview(
			message,
			sub,
			selectedSubmissions.find(s => s.submission.id == sub.id)!.user,
			pos
		);
	}

	async startReview(
		message: Message,
		submission: Submission,
		user: User,
		application: App
	) {
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
							user: user.tag,
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
