import { BotCommand } from '@lib/ext/BotCommand';
import { BotInhibitor } from '@lib/ext/BotInhibitor';
import { Guild } from '@lib/models/Guild';
import { Message } from 'discord.js';

export default class AdminCheckInhibitor extends BotInhibitor {
	public constructor() {
		super('adminCheck', {
			reason: 'notAdmin'
		});
	}
	public async exec(message: Message, command: BotCommand) {
		if (command.permissionCheck != 'admin') return false;
		if (message.guild == null) return false;
		const guildEntry = await Guild.findByPk(message.guild.id);
		if (
			// If they do not have an admin role, but with all the bases covered
			!guildEntry ||
			!guildEntry.adminroles ||
			guildEntry.adminroles.length < 1 ||
			!message.member!.roles.cache.some((r) =>
				guildEntry.adminroles!.includes(r.id)
			)
		) {
			if (message.member!.permissions.has('MANAGE_GUILD')) return false;
			else return true;
		} else return false;
	}
}
