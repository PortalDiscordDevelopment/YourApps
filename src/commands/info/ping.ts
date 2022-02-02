import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class PingCommand extends BotCommand {
	constructor() {
		super('ping', {
			aliases: ['ping'],
			description: {
				content: () => await this.client.t('COMMANDS.DESCRIPTIONS.PING', message),
				usage: 'ping',
				examples: ['ping']
			}
		});
	}

	public async exec(message: Message): Promise<void> {
		const m = await message.util!.reply(
			await this.client.t('COMMANDS.PING_CALCULATING', message)
		);
		await m.edit({
			content: await this.client.t('COMMANDS.PING_MESSAGE', message, {
				shard: message.guild?.shardId ?? 0,
				delay: message.editedTimestamp
					? (m.editedTimestamp ?? m.createdTimestamp) - message.editedTimestamp
					: m.createdTimestamp - message.createdTimestamp,
				api: this.client.ws.ping
			})
		});
	}
}
