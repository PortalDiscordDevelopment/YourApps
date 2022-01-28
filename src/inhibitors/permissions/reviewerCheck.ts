import { BotCommand } from '@lib/ext/BotCommand';
import { BotInhibitor } from '@lib/ext/BotInhibitor';
import { Guild } from '@lib/models/Guild';
import { Message } from 'discord.js';

export default class ReviewerCheckInhibitor extends BotInhibitor {
	public constructor() {
		super('reviewerCheck', {
			reason: 'notReviewer'
		});
	}
	public async exec(message: Message, command: BotCommand) {
		if (command.permissionCheck != 'reviewer') return false;
		if (message.guild == null) return false;
		const guildEntry = await Guild.findByPk(message.guild.id);
		const member = await message.member!.fetch();
		if (
			// If they do not have a review role, but with all the bases covered
			guildEntry &&
			guildEntry.reviewroles.length >= 1 &&
			member.roles.cache.some(r => guildEntry.reviewroles.includes(r.id))
		) {
			return false;
		} else if (
			guildEntry &&
			guildEntry.reviewroles.length < 1 &&
			member.permissions.has('MANAGE_ROLES')
		) {
			return false;
		} else {
			return true;
		}
	}
}
