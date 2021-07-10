import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';

export default class ConfigBlacklistAddCommand extends BotCommand {
	public constructor() {
		super('config-blacklist-add', {
			aliases: ['config-blacklist-add'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_BLACKLIST_ADD'),
				usage: 'config blacklist add <role>',
				examples: ['config blacklist add Blacklisted']
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
		if (guildEntry.blacklistroles.includes(role.id)) {
			await message.util!.send(
				this.client.i18n.t('CONFIG.BLACKLIST_ROLE_ALREADY_ADDED')
			);
			return;
		}
		guildEntry.blacklistroles.push(role.id);
		guildEntry.changed('blacklistroles', true);
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.BLACKLIST_ROLE_ADDED', { roleID: role.id })
		);
	}
}
