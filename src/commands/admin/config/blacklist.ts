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
					await this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_BLACKLIST', message),
				usage: 'config blacklist',
				examples: ['config blacklist']
			},
			channel: 'guild',
			children: ['config-blacklist-add', 'config-blacklist-remove'],
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
			await message.util!.send(await this.client.t('CONFIG.NO_BLACKLIST_ROLES', message));
			return;
		}
		await message.util!.send(
			await this.client.t('CONFIG.SERVER_BLACKLIST_ROLES', message, {
				roles: guildEntry.blacklistroles.map(p => `<@&${p}>`).join(', ')
			})
		);
	}
}
