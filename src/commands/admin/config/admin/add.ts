import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';

export default class ConfigAdminAddCommand extends BotCommand {
	public constructor() {
		super('config-admin-add', {
			aliases: ['config-admin-add'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_ADMIN_ADD'),
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
				this.client.i18n.t('ARGS.PLEASE_GIVE', { type: 'role' })
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
				this.client.i18n.t('CONFIG.ADMIN_ROLE_ALREADY_ADDED')
			);
			return;
		}
		guildEntry.adminroles.push(role.id);
		guildEntry.changed('adminroles', true);
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.ADMIN_ROLE_ADDED', { roleID: role.id })
		);
	}
}
