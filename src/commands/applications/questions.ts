import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models/App';
import { AppQuestionTypeNice } from '@lib/models/types';
import { Message } from 'discord.js';

export default class QuestionsCommand extends BotCommand {
	constructor() {
		super('questions', {
			aliases: ['questions', 'qs', 'format'],
			channel: 'guild',
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.QUESTIONS'),
				usage: 'questions <application>',
				examples: ['questions moderator']
			},
			args: [
				{
					id: 'application',
					type: 'application'
				}
			]
		});
	}
	async exec(message: Message, { application }: { application?: App }) {
		if (!application) {
			await message.util!.send(
				await this.client.t('ARGS.PLEASE_GIVE', message, {
					type: 'application'
				})
			);
			return;
		}
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle(
						await this.client.t('COMMANDS.QUESTIONS_TITLE', message, {
							app: application.name
						})
					)
					.setFields(
						application.questions.map(q => ({
							name: q.question,
							value: AppQuestionTypeNice[q.type]
						}))
					)
			]
		});
	}
}
