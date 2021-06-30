import { Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '../../lib/extensions/BotCommand';
import { Guild } from '../../lib/models';

export default class ConfigCommand extends BotCommand {
	public constructor() {
		super('config', {
			aliases: ['config'],
			description: {
				content: 'Get the config of the server',
				usage: 'config',
				examples: ['config']
			},
			parent: true,
			userPermissions: ['MANAGE_GUILD']
		});
	}
	*args() {
		const subcommand = yield {
			type: [['config-prefix', 'prefix', 'pre']],
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
		const guildEntry = await Guild.findByPk(message.guild.id);
		if (!guildEntry) {
			await message.util.send(
				'This guild does not appear to have any config options changed.'
			);
			return;
		}
		await message.util.send(
			this.client.util
				.embed()
				.setTitle('Guild config')
				.addField(
					'Prefixes',
					guildEntry.prefixes.map((p) => `\`${p}\``).join(', ') +
						' (or mention)',
					true
				)
				.addField(
					'Review roles',
					guildEntry.reviewroles !== null
						? guildEntry.reviewroles.map((r) => `<@&${r}>`).join(', ')
						: 'None set',
					true
				)
				.addField(
					'Admin roles',
					guildEntry.adminroles !== null
						? guildEntry.adminroles.map((r) => `<@&${r}>`).join(', ')
						: 'None set',
					true
				)
				.addField(
					'Blacklist roles',
					guildEntry.blacklistroles !== null
						? guildEntry.blacklistroles.map((r) => `<@&${r}>`).join(', ')
						: 'None set',
					true
				)
				.addField(
					'Log ping roles',
					guildEntry.logpings !== null
						? guildEntry.logpings.map((r) => `<@&${r}>`).join(', ')
						: 'None set',
					true
				)
				.addField(
					'Log channel',
					guildEntry.logchannel !== null
						? `<#${guildEntry.logchannel}>`
						: 'Not set',
					true
				)
				.addField(
					'Archive channel',
					guildEntry.archivechannel !== null
						? `<#${guildEntry.archivechannel}>`
						: 'Not set',
					true
				)
				.setTimestamp()
		);
	}
}
