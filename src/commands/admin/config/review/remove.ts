import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';

export default class ConfigReviewRemoveCommand extends BotCommand {
	public constructor() {
		super('config-review-remove', {
			aliases: ['config-review-remove'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_REVIEW_REMOVE'),
				usage: 'config review remove <role>',
				examples: ['config review remove Moderator']
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
		if (!guildEntry.reviewroles.includes(role.id)) {
			await message.util!.send(
				this.client.i18n.t('CONFIG.REVIEW_ROLE_NOT_ADDED')
			);
			return;
		}
		guildEntry.reviewroles.splice(guildEntry.reviewroles.indexOf(role.id), 1);
		guildEntry.changed('reviewroles', true);
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.REVIEW_ROLE_REMOVED', { roleID: role.id })
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.REVIEW_ROLE_REMOVE,
			{ roleID: role.id }
		);
	}
}
