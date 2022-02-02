import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';

export default class ConfigAdminAddCommand extends BotCommand {
	public constructor() {
		super('config-admin-add', {
			aliases: ['config-admin-add'],
			description: {
				content: () =>
					await this.client.t(
						'COMMANDS.DESCRIPTIONS.CONFIG_ADMIN_ADD',
						message
					),
				usage: 'config admin add <role>',
				examples: ['config admin add Administrator']
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
		if (guildEntry.adminroles.includes(role.id)) {
			await message.util!.send(
				await this.client.t('CONFIG.ADMIN_ROLE_ALREADY_ADDED', message)
			);
			return;
		}
		guildEntry.adminroles.push(role.id);
		guildEntry.changed('adminroles', true);
		await guildEntry.save();
		await message.util!.send(
			await this.client.t('CONFIG.ADMIN_ROLE_ADDED', message, {
				roleID: role.id
			})
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.ADMIN_ROLE_ADD,
			{ roleID: role.id }
		);
	}
}
