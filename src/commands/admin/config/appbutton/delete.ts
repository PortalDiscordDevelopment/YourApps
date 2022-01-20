import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';

export default class ConfigBlacklistRemoveCommand extends BotCommand {
	public constructor() {
		super('config-appbutton-delete', {
			aliases: ['config-appbutton-delete'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_APPBUTTON_DELETE'),
				usage: 'config appbutton delete',
				examples: ['config appbutton delete']
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
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.BLACKLIST_ROLE_REMOVE,
			{ roleID: role.id }
		);
	}
}
