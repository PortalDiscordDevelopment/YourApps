import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';

export default class ConfigReviewAddCommand extends BotCommand {
	public constructor() {
		super('config-review-add', {
			aliases: ['config-review-add'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_REVIEW_ADD'),
				usage: 'config review add <role>',
				examples: ['config review add Reviewer']
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
		if (guildEntry.reviewroles.includes(role.id)) {
			await message.util!.send(
				this.client.i18n.t('CONFIG.REVIEW_ROLE_ALREADY_ADDED')
			);
			return;
		}
		guildEntry.reviewroles.push(role.id);
		guildEntry.changed('reviewroles', true);
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.REVIEW_ROLE_ADDED', { roleID: role.id })
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.REVIEW_ROLE_ADD,
			{ roleID: role.id }
		);
	}
}
