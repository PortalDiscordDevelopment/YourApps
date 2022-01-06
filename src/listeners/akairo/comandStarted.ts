import { BotCommand } from '@lib/ext/BotCommand';
import { BotListener } from '@lib/ext/BotListener';
import { Message } from 'discord.js';

export default class CommandStartedListener extends BotListener {
	constructor() {
		super('commandStarted', {
			emitter: 'commandHandler',
			event: 'commandStarted'
		});
	}
	async exec(message: Message, command: BotCommand) {
		this.client.util.concurrentCommands.push({
			id: command.id,
			user: message.author.id,
			guild: message.guildId!,
			message: message.content
		});
	}
}
