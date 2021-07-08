import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';

export default class PingCommand extends BotCommand {
	constructor() {
		super('ping', {
			aliases: ['ping'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.PING'),
				usage: 'ping',
				examples: ['ping']
			}
		});
	}

	public async exec(message: Message): Promise<void> {
		const m = await message.util!.send(
			this.client.i18n.t('COMMANDS.PING_CALCULATING')
		);
		await m.edit({
			content: this.client.i18n.t('COMMANDS.PING_MESSAGE', {
				shard: message.guild?.shardID ?? 0,
				delay:
					m.editedTimestamp !== 0
						? m.editedTimestamp! - message.editedTimestamp!
						: m.createdTimestamp - message.createdTimestamp,
				api: this.client.ws.ping
			})
		});
	}
}
