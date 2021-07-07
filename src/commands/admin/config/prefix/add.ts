import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigPrefixAddCommand extends BotCommand {
	public constructor() {
		super('config-prefix-add', {
			aliases: ['config-prefix-add'],
			description: {
				content: 'Adds a prefix to the server',
				usage: 'config prefix add <prefix>',
				examples: ['config prefix add ya!']
			},
			category: 'admin',
			args: [
				{
					id: 'prefix',
					match: 'rest',
					prompt: {
						start: 'Please supply a prefix.'
					}
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { prefix }: { prefix: string }) {
		const [guildEntry] = await Guild.findOrBuild({
			where: {
				id: message.guild!.id
			},
			defaults: {
				id: message.guild!.id
			}
		});
		if (guildEntry.prefixes.includes(prefix)) {
			await message.util!.send("That prefix has already been added!");
			return;
		}
		guildEntry.prefixes.push(prefix);
		guildEntry.changed('prefixes', true);
		await guildEntry.save();
		await message.util!.send(
			`Prefix \`${prefix}\` was added to this server. Use the \`config prefix\` command to see all the prefixes.`
		);
	}
}
