import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigLogpingCommand extends BotCommand {
	public constructor() {
		super('config-logping', {
			aliases: ['config-logping'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_LOGPING'),
				usage: 'config logping',
				examples: ['config logping']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-logping-add', 'add'],
				['config-logping-remove', 'remove']
			]
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (!guildEntry || guildEntry.logpings.length < 1) {
			await message.util!.send(this.client.i18n.t('CONFIG.NO_LOGPING_ROLES'));
			return;
		}
		await message.util!.send(
			this.client.i18n.t('CONFIG.SERVER_LOGPING_ROLES', {
				roles: guildEntry.logpings.map(p => `<@&${p}>`).join(', ')
			})
		);
	}
}
