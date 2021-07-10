import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigBlacklistCommand extends BotCommand {
	public constructor() {
		super('config-blacklist', {
			aliases: ['config-blacklist'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_BLACKLIST'),
				usage: 'config blacklist',
				examples: ['config blacklist']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-blacklist-add', 'add'],
				['config-blacklist-remove', 'remove']
			]
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (!guildEntry || guildEntry.blacklistroles.length < 1) {
			await message.util!.send(this.client.i18n.t('CONFIG.NO_BLACKLIST_ROLES'));
			return;
		}
		await message.util!.send(
			this.client.i18n.t('CONFIG.SERVER_BLACKLIST_ROLES', {
				roles: guildEntry.blacklistroles.map((p) => `<@&${p}>`).join(', ')
			})
		);
	}
}
