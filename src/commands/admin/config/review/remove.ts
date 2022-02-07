import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';
import { Argument } from 'discord-akairo';

export default class ConfigReviewRemoveCommand extends BotCommand {
	public constructor() {
		super('config-review-remove', {
			aliases: ['config-review-remove'],
			description: {
				content: () =>
					this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_REVIEW_REMOVE'),
				usage: 'config review remove <role>',
				examples: ['config review remove Moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'role',
					type: Argument.union('role', 'number')
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { role }: { role?: Role | number }) {
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
		const roleId = role instanceof Role ? role.id : role.toString();
		if (!guildEntry.reviewroles.includes(roleId)) {
			await message.util!.send(
				await this.client.t('CONFIG.REVIEW_ROLE_NOT_ADDED', message)
			);
			return;
		}
		guildEntry.reviewroles.splice(guildEntry.reviewroles.indexOf(roleId), 1);
		guildEntry.changed('reviewroles', true);
		await guildEntry.save();
		await message.util!.send(
			await this.client.t('CONFIG.REVIEW_ROLE_REMOVED', message, {
				roleID: roleId
			})
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.REVIEW_ROLE_REMOVE,
			{ roleID: roleId }
		);
	}
}
