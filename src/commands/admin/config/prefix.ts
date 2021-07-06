import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigPrefixCommand extends BotCommand {
	public constructor() {
		super('config-prefix', {
			aliases: ['config-prefix'],
			description: {
				content: 'Gets the prefix of the server',
				usage: 'config prefix',
				examples: ['config prefix']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-prefix-add', 'add'],
				['config-prefix-remove', 'remove']
			],
			prompt: {
				optional: true,
				retry: 'Invalid subcommand. What subcommand would you like to use?'
			}
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (!guildEntry) {
			await message.channel.send(
				`The prefix(es) for this server are \`${this.client.config.defaultPrefix}\` (or mention).`
			);
			return;
		}
		await message.channel.send(
			`The prefix(es) for this server are ${guildEntry.prefixes
				.map((p) => `\`${p}\``)
				.join(', ')} (or mention).`
		);
	}
}
