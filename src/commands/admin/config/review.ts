import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigReviewCommand extends BotCommand {
	public constructor() {
		super('config-review', {
			aliases: ['config-review'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_REVIEW'),
				usage: 'config review',
				examples: ['config review']
			},
			channel: 'guild',
			category: 'admin',
			children: ['config-review-add', 'config-review-remove'],
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-review-add', 'add'],
				['config-review-remove', 'remove']
			]
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (!guildEntry || guildEntry.reviewroles.length < 1) {
			await message.util!.send(
				await this.client.t('CONFIG.NO_REVIEW_ROLES', message)
			);
			return;
		}
		await message.util!.send(
			await this.client.t('CONFIG.SERVER_REVIEW_ROLES', message, {
				roles: guildEntry.reviewroles.map(p => `<@&${p}>`).join(', ')
			})
		);
	}
}
