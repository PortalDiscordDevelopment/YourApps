import { BotClient } from '@lib/ext/BotClient';
import { BotCommand } from '@lib/ext/BotCommand';
import { LogEvent } from '@lib/ext/Util';
import { App } from '@lib/models/App';
import { Submission, Guild } from '@lib/models';
import {
	AnswerType,
	AppQuestionType,
	AppQuestionTypeNice
} from '@lib/models/types';
import {
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
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.APPLY'),
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
				this.client.i18n.t('ARGS.INVALID', { type: 'application' })
			);
			return;
		}
		await ApplyCommand.startApplication(message, application);
	}

	static async startApplication(message: Message, app: App): Promise<void> {
		const client = message.client as BotClient;
		const buttonIds = {
			continue: `continueApplication|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			cancel: `cancelApplication|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const confirmation = await message.reply({
			content: client.i18n.t('COMMANDS.ARE_YOU_SURE_APPLICATION', {
				application: app.name
			}),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(buttonIds.continue)
						.setLabel(client.i18n.t('GENERIC.CONTINUE'))
						.setEmoji('✅')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(buttonIds.cancel)
						.setLabel(client.i18n.t('GENERIC.CANCEL'))
						.setEmoji('✖')
						.setStyle('DANGER')
				)
			]
		});
		let response: MessageComponentInteraction;
		try {
			response = await message.channel.awaitMessageComponent({
				filter: i => Object.values(buttonIds).includes(i.customId),
				componentType: 'BUTTON',
				time: 300_000 // 5 Minutes
			});
		} catch {
			await confirmation.edit({
				content: client.i18n.t('GENERIC.TIMED_OUT'),
				components: []
			});
			return;
		}
		if (response.customId !== buttonIds.continue) {
			await response.reply({
				content: client.i18n.t('GENERIC.CANCELED')
			});
			return;
		}
		await response.deferUpdate();
		// * Actually start the DM application
		const answers: Record<string, AnswerType> = {};
		const cancelButtonId = `cancelApplication|1|${message.id}|${
			message.editedTimestamp ?? message.createdTimestamp
		}`;
		const applicationMessage = await message.author.send({
			embeds: [
				client.util
					.embed()
					.setTitle(
						client.i18n.t('COMMANDS.APPLICATION_FOR', {
							application: app.name
						})
					)
					.setDescription(client.i18n.t('COMMANDS.APPLYING_INFO'))
					.setFields(
						app.questions.map(q => ({
							name: q.question,
							value: client.i18n.t('COMMANDS.YOUR_ANSWER', {
								type: AppQuestionTypeNice[q.type]
							}),
							inline: true
						}))
					)
			],
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(cancelButtonId)
						.setLabel(client.i18n.t('GENERIC.CANCEL'))
						.setEmoji('🗑')
						.setStyle('DANGER')
				)
			]
		});
		const answerCollector = applicationMessage.channel.createMessageCollector({
			filter: m => m.author.id === message.author.id,
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
			const unansweredQuestions = applicationMessage.embeds[0].fields
				.map(f => f.name)
				.filter(q => !Object.keys(answers).includes(q));
			const validation = client.util.validateQuestionType(
				m.content,
				app.questions.find(q => q.question === unansweredQuestions[0])?.type ??
					AppQuestionType.STRING
			);
			if (!validation.valid) {
				await m.reply({
					content: validation.error
				});
				return;
			}
			answers[unansweredQuestions[0]] = validation.processed;
			await applicationMessage.edit({
				embeds: [
					applicationMessage.embeds[0].setFields(
						applicationMessage.embeds[0].fields.map(f =>
							f.name === unansweredQuestions[0]
								? {
										name: f.name,
										value: validation.user,
										inline: true
								  }
								: f
						)
					)
				]
			});
			if (unansweredQuestions.length === 1) answerCollector.stop('finish');
		});
		// Await collector finish (on application complete or cancel)
		const endedReason: 'finish' | 'cancel' = await new Promise(resolve => {
			answerCollector.on('end', (_, reason) =>
				resolve(reason as 'finish' | 'cancel')
			);
		});
		// Cancel if collecter ended because cancelled
		if (endedReason === 'cancel') {
			await message.author.send(client.i18n.t('GENERIC.CANCELED'));
			return;
		}
		// * Ask for confirmation to submit app
		const submissionButtonIds = {
			continue: `continueApplication|3|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			cancel: `cancelApplication|3|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const submissionConfirmation = await applicationMessage.reply({
			content: client.i18n.t('COMMANDS.ARE_YOU_SURE_SUBMIT', {
				application: app.name
			}),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(submissionButtonIds.continue)
						.setLabel(client.i18n.t('GENERIC.CONTINUE'))
						.setEmoji('✅')
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(submissionButtonIds.cancel)
						.setLabel(client.i18n.t('GENERIC.CANCEL'))
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
				content: client.i18n.t('GENERIC.TIMED_OUT'),
				components: []
			});
			return;
		}
		if (submissionResponse.customId !== submissionButtonIds.continue) {
			await submissionResponse.reply({
				content: client.i18n.t('GENERIC.CANCELED')
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
			author: message.author.id,
			position: app.id,
			answers
		});
		await submissionEntry.save();
		await client.util.logEvent(
			message.guildId!,
			message.author,
			LogEvent.APPLICATION_SUBMITTED,
			{
				user: message.author.tag,
				application: app.name
			}
		);
		await submissionResponse.editReply({
			content: client.i18n.t('GENERIC.SUBMITTED')
		});
	}
}
