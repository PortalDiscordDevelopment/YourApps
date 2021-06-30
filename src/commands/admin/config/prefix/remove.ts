import { Message } from 'discord.js';
import { BotCommand } from '../../../../lib/extensions/BotCommand';
import { Guild } from '../../../../lib/models';

export default class ConfigPrefixRemoveCommand extends BotCommand {
	public constructor() {
		super('config-prefix-remove', {
			aliases: ['config-prefix-remove'],
			description: {
				content: 'Removes a prefix to the server',
				usage: 'config prefix remove <prefix>',
				examples: ['config prefix remove ya!']
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
			]
		});
	}
	async exec(message: Message, { prefix }: { prefix: string }) {
		const [guildEntry] = await Guild.findOrBuild({
			where: {
				id: message.guild.id
			},
			defaults: {
				id: message.guild.id
			}
		});
		if (!guildEntry.prefixes.includes(prefix)) {
			await message.util.send("That prefix has not been added!")
			return
		}
		guildEntry.prefixes.splice(guildEntry.prefixes.indexOf(prefix), 1);
		if (guildEntry.prefixes.length < 1) {
			await message.util.send("You cannot have less than one prefix!")
			return
		}
		await guildEntry.save();
		await message.util.send(`Prefix \`${prefix}\` was removed from this server. Use the \`config prefix\` command to see all the prefixes.`)
	}
}
