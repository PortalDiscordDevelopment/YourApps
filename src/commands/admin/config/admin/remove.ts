import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';

export default class ConfigPrefixRemoveCommand extends BotCommand {
	public constructor() {
		super('config-admin-remove', {
			aliases: ['config-admin-remove'],
			description: {
				content: 'Removes an admin role from the server',
				usage: 'config admin remove <role>',
				examples: ['config admin remove Moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'role',
					type: 'role',
					prompt: {
						start: 'Please supply a role.',
						retry: 'Invalid role. Please supply a role.'
					}
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { role }: { role: Role }) {
		const [guildEntry] = await Guild.findOrBuild({
			where: {
				id: message.guild!.id
			},
			defaults: {
				id: message.guild!.id
			}
		});
		if (!guildEntry.adminroles.includes(role.id)) {
			await message.util!.send('That admin role has not been added!');
			return;
		}
		guildEntry.adminroles.splice(guildEntry.adminroles.indexOf(role.id), 1);
		guildEntry.changed('adminroles', true);
		await guildEntry.save();
		await message.util!.send(
			`Admin role <@&${role.id}> was removed from this server. Use the \`config admin\` command to see all the admin roles.`
		);
	}
}
