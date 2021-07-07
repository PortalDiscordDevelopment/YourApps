import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';

export default class ConfigAdminAddCommand extends BotCommand {
	public constructor() {
		super('config-admin-add', {
			aliases: ['config-admin-add'],
			description: {
				content: 'Adds an admin role to the server',
				usage: 'config admin add <role>',
				examples: ['config admin add Administrator']
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
		if (guildEntry.adminroles.includes(role.id)) {
			await message.util!.send("That admin role has already been added!");
			return;
		}
		guildEntry.adminroles.push(role.id);
		guildEntry.changed('adminroles', true);
		await guildEntry.save();
		await message.util!.send(
			`Admin role <@&${role.id}> was added to this server. Use the \`config admin\` command to see all the admin roles.`
		);
	}
}
