import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigReviewCommand extends BotCommand {
	public constructor() {
		super('config-review', {
			aliases: ['config-review'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_REVIEW'),
				usage: 'config review',
				examples: ['config review']
			},
			channel: 'guild',
			category: 'admin',
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
			await message.util!.send(this.client.i18n.t('CONFIG.NO_REVIEW_ROLES'));
			return;
		}
		await message.util!.send(
			this.client.i18n.t('CONFIG.SERVER_REVIEW_ROLES', {
				roles: guildEntry.reviewroles.map((p) => `<@&${p}>`).join(', ')
			})
		);
	}
}
