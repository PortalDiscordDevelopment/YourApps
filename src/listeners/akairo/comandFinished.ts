import { BotCommand } from '@lib/ext/BotCommand';
import { BotListener } from '@lib/ext/BotListener';
import { Message } from 'discord.js';

export default class CommandFinishedListener extends BotListener {
	constructor() {
		super('commandFinished', {
			emitter: 'commandHandler',
			event: 'commandFinished'
		});
	}
	async exec(message: Message, command: BotCommand) {
		this.client.util.removeConcurrent({
			id: command.id,
			user: message.author.id,
			guild: message.guildId!,
			message: message.content
		});
	}
}
