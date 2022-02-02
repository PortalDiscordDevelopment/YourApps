import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigAdminCommand extends BotCommand {
	public constructor() {
		super('config-admin', {
			aliases: ['config-admin'],
			description: {
				content: () => await this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_ADMIN', message),
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
			await message.util!.send(await this.client.t('CONFIG.NO_ADMIN_ROLES', message));
			return;
		}
		await message.util!.send(
			await this.client.t('CONFIG.SERVER_ADMIN_ROLES', message, {
				roles: guildEntry.adminroles.map(p => `<@&${p}>`).join(', ')
			})
		);
	}
}
