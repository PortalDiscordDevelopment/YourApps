import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { stripIndent } from 'common-tags';

export default class PingCommand extends BotCommand {
	constructor() {
		super('ping', {
			aliases: ['ping'],
			description: {
				content: 'Gets the latency of the bot',
				usage: 'ping',
				examples: ['ping']
			}
		});
	}

	public async exec(message: Message): Promise<void> {
		const m = await message.util.send('Calculating...');
		await m.edit(stripIndent`
		Shard: ${message.guild.shardID}
		Delay: ${
			m.editedTimestamp !== 0
				? m.editedTimestamp - message.editedTimestamp
				: m.createdTimestamp - message.createdTimestamp
		}ms
		API: ${this.client.ws.ping}ms
		`);
	}
}
