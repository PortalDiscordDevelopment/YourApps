import { BotClient } from '@lib/ext/BotClient';
import { BotCommand } from '@lib/ext/BotCommand';
import { DiscordFieldLimits, LogEvent } from '@lib/ext/Util';
import { App } from '@lib/models/App';
import { Submission, Guild } from '@lib/models';
import {
	AnswerType,
	AppQuestionType,
	AppQuestionTypeNice
} from '@lib/models/types';
import {
	ButtonInteraction,
	Message,
	MessageActionRow,
	MessageButton,
	MessageComponentInteraction
} from 'discord.js';

export default class ApplyCommand extends BotCommand {
	constructor() {
		super('apply', {
			aliases: ['apply'],
			channel: 'guild',
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.APPLY'),
				usage: 'apply <position>',
				examples: ['apply moderator']
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
		if (
			(await message.author.send({}).catch(e => e.message)) ==
			'Cannot send messages to this user'
		) {
			await message.util!.send(
				await this.client.t('ERRORS.CANNOT_DM', message)
			);
			return;
		}
		const submittedApps = await Submission.count({
			where: {
				author: message.author.id,
				position: application.id
			}
		});
		if (submittedApps > 0) {
			await message.util!.send(
				await this.client.t('ERRORS.ALREADY_APPLIED', message)
			);
			return;
		}
		const memberRoles = (await message.member!.fetch()).roles.cache;
		if (!application.requiredroles.every(r => memberRoles.has(r))) {
			await message.util!.send(
				await this.client.t('ERRORS.NO_REQUIRED_ROLES', message)
			);
			return;
		}
		if (
			application.minjointime &&
			(message.editedTimestamp ?? message.createdTimestamp) -
				message.member!.joinedTimestamp! <
				application.minjointime
		) {
			await message.util!.send(
				await this.client.t('ERRORS.NOT_JOINED_LONG_ENOUGH', message)
			);
			return;
		}
		if (application.closed) {
			await message.util!.send(
				await this.client.t('ERRORS.APP_CLOSED', message)
			);
			return;
		}
		await ApplyCommand.startApplication(message, application);
	}

	static async startApplication(
		message: Message | ButtonInteraction,
		app: App
	): Promise<void> {
		const interaction = message instanceof ButtonInteraction;
		const client = message.client as BotClient;
		const buttonIds = {
			continue: `continueApplication|0|${message.id}|${
				interaction
					? message.createdTimestamp
					: message.editedTimestamp ?? message.createdTimestamp
			}`,
			cancel: `cancelApplication|0|${message.id}|${
				interaction
					? message.createdTimestamp
					: message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		if (!interaction) await message.react('✅');
		const confirmation = interaction
			? await message.reply({
					content: await client.t(
						'COMMANDS.ARE_YOU_SURE_APPLICATION',
						message,
						{
							application: app.name
						}
					),
					components: [
						new MessageActionRow().addComponents(
							new MessageButton()
								.setCustomId(buttonIds.continue)
								.setLabel(await client.t('GENERIC.CONTINUE', message))
								.setEmoji('✅')
								.setStyle('SUCCESS'),
							new MessageButton()
								.setCustomId(buttonIds.cancel)
								.setLabel(await client.t('GENERIC.CANCEL', message))
								.setEmoji('✖')
								.setStyle('DANGER')
						)
					],
					ephemeral: true
			  })
			: await message.author.send({
					content: await client.t(
						'COMMANDS.ARE_YOU_SURE_APPLICATION',
						message,
						{
							application: app.name
						}
					),
					components: [
						new MessageActionRow().addComponents(
							new MessageButton()
								.setCustomId(buttonIds.continue)
								.setLabel(await client.t('GENERIC.CONTINUE', message))
								.setEmoji('✅')
								.setStyle('SUCCESS'),
							new MessageButton()
								.setCustomId(buttonIds.cancel)
								.setLabel(await client.t('GENERIC.CANCEL', message))
								.setEmoji('✖')
								.setStyle('DANGER')
						)
					]
			  });
		let response: MessageComponentInteraction;
		try {
			response = await (interaction
				? message
				: (confirmation as Message)
			).channel!.awaitMessageComponent({
				filter: i =>
					Object.values(buttonIds).includes(i.customId) &&
					i.user.id == (interaction ? message.user : message.author).id,
				componentType: 'BUTTON',
				time: 300_000 // 5 Minutes
			});
		} catch {
			if (confirmation instanceof Message && !interaction) {
				await confirmation.edit({
					content: await client.t('GENERIC.TIMED_OUT', message),
					components: []
				});
			} else {
				await (message as ButtonInteraction).editReply({
					content: await client.t('GENERIC.TIMED_OUT', message),
					components: []
				});
			}
			return;
		}
		await response.deferUpdate();
		if (response.customId !== buttonIds.continue) {
			interaction
				? await message.editReply({
						content: await client.t('GENERIC.CANCELED', message),
						components: []
				  })
				: await (confirmation as Message).edit({
						content: await client.t('GENERIC.CANCELED', message),
						components: []
				  });
			return;
		}
		// * Actually start the DM application
		const answers: Record<string, AnswerType> = {};
		const cancelButtonId = `cancelApplication|1|${message.id}|${
			interaction
				? message.createdTimestamp
				: message.editedTimestamp ?? message.createdTimestamp
		}`;
		let curQuestion = 0;
		const applicationMessage = await (interaction
			? message.user
			: message.author
		).send({
			embeds: [
				client.util
					.embed()
					.setTitle(
						await client.t('COMMANDS.APPLICATION_FOR', message, {
							application: app.name
						})
					)
					.setDescription(await client.t('COMMANDS.APPLYING_INFO', message))
					.addField(
						app.questions[curQuestion].question,
						await client.t('COMMANDS.YOUR_ANSWER', message, {
							type: AppQuestionTypeNice[app.questions[curQuestion].type]
						}),
						true
					)
			],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(cancelButtonId)
						.setLabel(await client.t('GENERIC.CANCEL', message))
						.setEmoji('🗑')
						.setStyle('DANGER')
				)
			]
		});
		const answerCollector = applicationMessage.channel.createMessageCollector({
			filter: m =>
				m.author.id === (interaction ? message.user : message.author).id,
			idle: 600_000
		});
		applicationMessage
			.awaitMessageComponent({
				filter: i => i.customId === cancelButtonId,
				componentType: 'BUTTON'
			})
			.then(i => {
				i.deferUpdate();
				answerCollector.stop('cancel');
			});
		answerCollector.on('collect', async m => {
			const answer = `${m.content}\n${m.attachments
				.map(a => a.url)
				.join('\n')}`;
			const validation = client.util.validateQuestionType(
				answer,
				app.questions[curQuestion]?.type ?? AppQuestionType.STRING
			);
			if (!validation.valid) {
				await m.reply({
					content: validation.error
				});
				return;
			}
			answers[app.questions[curQuestion].question] = validation.processed;
			curQuestion++;
			let newEmbed = applicationMessage.embeds[0].setFields(
				applicationMessage.embeds[0].fields.map(f =>
					f.name === app.questions[curQuestion - 1].question
						? {
								name: f.name,
								value: client.util.truncate(validation.user, DiscordFieldLimits.FIELD_VALUE),
								inline: true
						  }
						: f
				)
			);
			if (curQuestion !== app.questions.length)
				newEmbed = newEmbed.addField(
					app.questions[curQuestion].question,
					await client.t('COMMANDS.YOUR_ANSWER', message, {
						type: AppQuestionTypeNice[app.questions[curQuestion].type]
					}),
					true
				);
			await applicationMessage.edit({
				embeds: [newEmbed]
			});
			if (curQuestion === app.questions.length) answerCollector.stop('finish');
		});
		// Await collector finish (on application complete or cancel)
		const endedReason: 'finish' | 'cancel' = await new Promise(resolve => {
			answerCollector.on('end', (_, reason) =>
				resolve(reason as 'finish' | 'cancel')
			);
		});
		// Cancel if collecter ended because cancelled
		if (endedReason === 'cancel') {
			await (interaction ? message.user : message.author).send(
				await client.t('GENERIC.CANCELED', message)
			);
			return;
		}
		// * Ask for confirmation to submit app
		const submissionButtonIds = {
			continue: `continueApplication|3|${message.id}|${
				interaction
					? message.createdTimestamp
					: message.editedTimestamp ?? message.createdTimestamp
			}`,
			cancel: `cancelApplication|3|${message.id}|${
				interaction
					? message.createdTimestamp
					: message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const submissionConfirmation = await applicationMessage.reply({
			content: await client.t('COMMANDS.ARE_YOU_SURE_SUBMIT', message, {
				application: app.name
			}),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(submissionButtonIds.continue)
						.setLabel(await client.t('GENERIC.CONTINUE', message))
						.setEmoji('✅')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(submissionButtonIds.cancel)
						.setLabel(await client.t('GENERIC.CANCEL', message))
						.setEmoji('✖')
						.setStyle('DANGER')
				)
			]
		});
		let submissionResponse: MessageComponentInteraction;
		try {
			submissionResponse =
				await applicationMessage.channel.awaitMessageComponent({
					filter: i => Object.values(submissionButtonIds).includes(i.customId),
					componentType: 'BUTTON',
					time: 300_000 // 5 Minutes
				});
		} catch {
			await submissionConfirmation.edit({
				content: await client.t('GENERIC.TIMED_OUT', message),
				components: []
			});
			return;
		}
		if (submissionResponse.customId !== submissionButtonIds.continue) {
			await submissionResponse.reply({
				content: await client.t('GENERIC.CANCELED', message)
			});
			return;
		}
		await submissionResponse.deferReply();
		await Guild.findOrCreate({
			where: {
				id: message.guildId!
			},
			defaults: {
				id: message.guildId!
			}
		});
		const submissionEntry = Submission.build({
			guild: message.guildId!,
			author: (interaction ? message.user : message.author).id,
			position: app.id,
			answers
		});
		await submissionEntry.save();
		await client.util.logEvent(
			message.guildId!,
			interaction ? message.user : message.author,
			LogEvent.APPLICATION_SUBMITTED,
			{
				user: (interaction ? message.user : message.author).tag,
				application: app.name
			}
		);
		await submissionResponse.editReply({
			content: await client.t('GENERIC.SUBMITTED', message)
		});
	}
}
