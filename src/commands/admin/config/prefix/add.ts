import { Message } from 'discord.js';
import { BotCommand } from '../../../../lib/extensions/BotCommand';
import { Guild } from '../../../../lib/models';

export default class ConfigCommand extends BotCommand {
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
		guildEntry.prefixes.push(prefix);
		await guildEntry.save();
		await message.util.send(`Prefix \`${prefix}\` was added to this server. Use the \`config prefix\` command to see all the prefixes.`)
	}
}
