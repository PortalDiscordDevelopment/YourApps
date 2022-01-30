import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { Submission } from '@lib/models/Submission';
import {
	DiscordAPIError,
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
				content: () => this.client.t('COMMANDS.REVIEW_DESCRIPTION'),
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
		if (submissions.length < 1) {
			await message.util!.send(await this.client.t('NO_SUBMISSIONS', message));
			return;
		}
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
			content: await this.client.t('GENERIC.CHOOSE_POS', message),
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.addOptions(
							await Promise.all(
								positions.map(async app => ({
									label: app.name,
									value: app.id.toString(),
									description: await this.client.t(
										'POSITION_CHOICE_DESC',
										message,
										{
											n: submissions.filter(s => s.position == app.id).length
										}
									)
								}))
							)
						)
						.setCustomId(ids.positionsId)
						.setPlaceholder(await this.client.t('GENERIC.CHOSE_POS', message))
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
			content: await this.client.t('GENERIC.CHOOSE_SUB', message),
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
						.setPlaceholder(
							await this.client.t('GENERIC.CHOOSE_A_SUB', message)
						)
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
						await this.client.t('COMMANDS.REVIEW_TITLE', message, {
							user: user.tag,
							application: application.name
						})
					)
					.setDescription(
						await this.client.t('COMMANDS.REVIEW_EMBED_DESCRIPTION', message)
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
						.setLabel(await this.client.t('GENERIC.APPROVE', message))
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(approveWithReasonId)
						.setEmoji('✅')
						.setLabel(
							await this.client.t('GENERIC.APPROVE_WITH_REASON', message)
						)
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(denyButtonId)
						.setEmoji('✖')
						.setLabel(await this.client.t('GENERIC.DENY', message))
						.setStyle('DANGER')
				),
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(cancelButtonId)
						.setEmoji('🗑')
						.setLabel(await this.client.t('GENERIC.CANCEL', message))
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
			case approveButtonId: {
				const me = await message.guild!.members.fetch(user.client.user!.id);
				// Check for role perms
				if (!me.permissions.has('MANAGE_ROLES')) {
					await reviewMessage.edit(
						await this.client.t('COMMANDS.REVIEW_NO_PERMS', message)
					);
					return;
				}
				try {
					await this.client.util.approveSubmission(message.author, submission);
				} catch (e) {
					if (e instanceof DiscordAPIError) {
						await reviewMessage.edit({
							content: await this.client.t('ERRORS.UNABLE_TO_FETCH', message),
							components: [],
							embeds: []
						});
						await submission.destroy();
						return;
					}
					throw e;
				}
				await reviewMessage.edit({
					content: await this.client.t(
						'GENERIC.SUCCESSFULLY_APPROVED',
						message
					),
					components: [],
					embeds: []
				});
				break;
			}
			case approveWithReasonId: {
				const me = await message.guild!.members.fetch(user.client.user!.id);
				// Check for role perms
				if (!me.permissions.has('MANAGE_ROLES')) {
					await reviewMessage.edit(
						await this.client.t('COMMANDS.REVIEW_NO_PERMS', message)
					);
					return;
				}
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
					allowSkip: 'reason',
					fieldName: await this.client.t('GENERIC.REASON', message),
					description: await this.client.t('GENERIC.ENTER_REASON', message),
					process: m => ({
						processed: {
							user: m.content,
							data: m.content
						},
						success: true
					}),
					title: await this.client.t('GENERIC.APPROVE_REASON', message)
				});
				if (reason.cancelled) {
					await response.editReply(
						await this.client.t('GENERIC.CANCELED', message)
					);
					return;
				}
				try {
					await this.client.util.approveSubmission(
						message.author,
						submission,
						reason.result
					);
				} catch (e) {
					if (e instanceof DiscordAPIError) {
						await reviewMessage.edit({
							content: await this.client.t('ERRORS.UNABLE_TO_FETCH', message),
							components: [],
							embeds: []
						});
						await submission.destroy();
						return;
					}
					throw e;
				}
				await reviewMessage.edit({
					content: await this.client.t(
						'GENERIC.SUCCESSFULLY_APPROVED',
						message
					),
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
					allowSkip: 'reason',
					fieldName: this.client.t('GENERIC.REASON', message),
					description: this.client.t('GENERIC.ENTER_REASON', message),
					process: m => ({
						processed: {
							user: m.content,
							data: m.content
						},
						success: true
					}),
					title: await this.client.t('GENERIC.DENY', message)
				});
				if (reason.cancelled) {
					await response.editReply(
						await this.client.t('GENERIC.CANCELED', message)
					);
					return;
				}
				try {
					await this.client.util.denySubmission(
						message.author,
						submission,
						reason.result!
					);
				} catch (e) {
					if (e instanceof DiscordAPIError) {
						await reviewMessage.edit({
							content: await this.client.t('ERRORS.UNABLE_TO_FETCH', message),
							components: [],
							embeds: []
						});
						await submission.destroy();
						return;
					}
					throw e;
				}
				await reviewMessage.edit({
					content: await this.client.t('GENERIC.SUCCESSFULLY_DENIED', message),
					components: [],
					embeds: []
				});
				break;
			}
			case cancelButtonId:
				await response.editReply(
					await this.client.t('GENERIC.CANCELED', message)
				);
				break;
		}
	}
}
