import { BotCommand } from '@lib/ext/BotCommand';
import { App, Submission } from '@lib/models';
import { Message } from 'discord.js';

export default class SubmissionsCommand extends BotCommand {
	constructor() {
		super('submissions', {
			aliases: ['submissions'],
			description: {
				content: () => this.client.t('COMMANDS.REVIEW_DESCRIPTION'),
				usage: 'submissions',
				examples: ['submissions']
			},
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}

	public async exec(message: Message) {
		const submissions = await Submission.findAll({
			where: {
				guild: message.guild!.id
			}
		});
		if (submissions.length < 1) {
			await message.util?.send(
				await this.client.t('COMMANDS.NO_SUBMISSIONS', message)
			);
		}
		let string = '';
		for (const submission of submissions) {
			const app = await App.findByPk(submission.position);
			const user = await this.client.users.fetch(submission.author);
			string += `<@${submission.author}> (${user.tag}): ${app!.name}\n`;
		}
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle('Submitted applications')
					.setDescription(string)
			]
		});
	}
}
