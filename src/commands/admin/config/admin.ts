import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigAdminCommand extends BotCommand {
	public constructor() {
		super('config-admin', {
			aliases: ['config-admin'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_ADMIN'),
				usage: 'config admin',
				examples: ['config admin']
			},
			channel: 'guild',
			children: ['config-admin-add', 'config-admin-remove'],
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-admin-add', 'add'],
				['config-admin-remove', 'remove']
			]
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (!guildEntry || guildEntry.adminroles.length < 1) {
			await message.util!.send(this.client.i18n.t('CONFIG.NO_ADMIN_ROLES'));
			return;
		}
		await message.util!.send(
			this.client.i18n.t('CONFIG.SERVER_ADMIN_ROLES', {
				roles: guildEntry.adminroles.map(p => `<@&${p}>`).join(', ')
			})
		);
	}
}
