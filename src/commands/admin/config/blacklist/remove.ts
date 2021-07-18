import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';

export default class ConfigBlacklistRemoveCommand extends BotCommand {
	public constructor() {
		super('config-blacklist-remove', {
			aliases: ['config-blacklist-remove'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_BLACKLIST_REMOVE'),
				usage: 'config blacklist remove <role>',
				examples: ['config blacklist remove Moderator']
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
		if (!guildEntry.blacklistroles.includes(role.id)) {
			await message.util!.send(
				this.client.i18n.t('CONFIG.BLACKLIST_ROLE_NOT_ADDED')
			);
			return;
		}
		guildEntry.blacklistroles.splice(
			guildEntry.blacklistroles.indexOf(role.id),
			1
		);
		guildEntry.changed('blacklistroles', true);
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.BLACKLIST_ROLE_REMOVED', { roleID: role.id })
		);
		await this.client.util.logEvent(message.guild!.id, LogEvent.BLACKLIST_ROLE_REMOVE, {roleID: role.id})
	}
}
