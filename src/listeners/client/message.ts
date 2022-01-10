import { BotListener } from '@lib/ext/BotListener';
import { App } from '@lib/models';
import { type Message } from 'discord.js';
import ApplyCommand from '../../commands/applications/apply';

export default class MessageListener extends BotListener {
	public constructor() {
		super('message', {
			emitter: 'client',
			event: 'message'
		});
	}
	public async exec(message: Message) {
		if (!message.guildId) return;
		const apps = await App.findAll({
			where: {
				guild: message.guildId
			}
		});
		for (const app of apps) {
			if (!app.customcommand || message.content != app.customcommand) continue;
			await ApplyCommand.startApplication(message, app);
		}
	}
}
