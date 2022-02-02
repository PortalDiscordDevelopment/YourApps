import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';

export default class ConfigAdminRemoveCommand extends BotCommand {
	public constructor() {
		super('config-admin-remove', {
			aliases: ['config-admin-remove'],
			description: {
				content: () =>
					await this.client.t(
						'COMMANDS.DESCRIPTIONS.CONFIG_ADMIN_REMOVE',
						message
					),
				usage: 'config admin remove <role>',
				examples: ['config admin remove Moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'role',
					type: 'role'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { role }: { role?: Role }) {
		if (!role) {
			await message.util!.send(
				await this.client.t('ARGS.PLEASE_GIVE', message, { type: 'role' })
			);
			return;
		}
		const [guildEntry] = await Guild.findOrBuild({
			where: {
				id: message.guild!.id
			},
			defaults: {
				id: message.guild!.id
			}
		});
		if (!guildEntry.adminroles.includes(role.id)) {
			await message.util!.send(
				await this.client.t('CONFIG.ADMIN_ROLE_NOT_ADDED', message)
			);
			return;
		}
		guildEntry.adminroles.splice(guildEntry.adminroles.indexOf(role.id), 1);
		guildEntry.changed('adminroles', true);
		await guildEntry.save();
		await message.util!.send(
			await this.client.t('CONFIG.ADMIN_ROLE_REMOVED', message, {
				roleID: role.id
			})
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.ADMIN_ROLE_REMOVE,
			{ roleID: role.id }
		);
	}
}
