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
		const member = await message.member!.fetch();
		let canUseCommand = false;
		if (
			guildEntry &&
			guildEntry.adminroles.length >= 1 &&
			member.roles.cache.some(r => guildEntry.adminroles.includes(r.id))
		) {
			// Admin roles exist and user has one
			canUseCommand = true;
		} else if (
			guildEntry &&
			guildEntry.adminroles.length < 1 &&
			member.permissions.has('MANAGE_GUILD')
		) {
			// Admin roles do not exist and user has MANAGE_GUILD
			canUseCommand = true;
		} else if (member.permissions.has('ADMINISTRATOR')) {
			// User has admin permission, override everything
			canUseCommand = true;
		}
		return !canUseCommand;
	}
}
