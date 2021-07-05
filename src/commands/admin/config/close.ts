import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models';

export default class CloseCommand extends BotCommand {
	public constructor() {
		super('close', {
			aliases: ['close'],
			description: {
				content: 'Closes an application',
				usage: 'close <application>',
				examples: ['close moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'application',
					type: 'application',
					prompt: {
						start: 'What application would you like to close?',
						retry:
							'Invalid application. What application would you like to close?'
					}
				}
			]
		});
	}
	async exec(message: Message, { application }: { application: App }) {
		if (application.closed) {
			await message.util!.send('That application is not open!');
			return;
		}
		application.closed = true;
		application.save();
		await message.util!.send(`Sucessfully closed ${application.name}.`);
	}
}
