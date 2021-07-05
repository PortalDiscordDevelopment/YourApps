import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models';

export default class OpenCommand extends BotCommand {
	public constructor() {
		super('open', {
			aliases: ['open'],
			description: {
				content: 'Opens an application',
				usage: 'open <application>',
				examples: ['open moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'application',
					type: 'application',
					prompt: {
						start: 'What application would you like to open?',
						retry:
							'Invalid application. What application would you like to open?'
					}
				}
			]
		});
	}
	async exec(message: Message, { application }: { application: App }) {
		if (!application.closed) {
			await message.util!.send('That application is not closed!');
			return;
		}
		application.closed = false;
		application.save();
		await message.util!.send(`Sucessfully opened ${application.name}.`);
	}
}
