import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigLogpingCommand extends BotCommand {
	public constructor() {
		super('config-logping', {
			aliases: ['config-logping'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_LOGPING'),
				usage: 'config logping',
				examples: ['config logping']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin',
			children: ['config-logping-add', 'config-logping-remove']
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
			await message.util!.send(
				await this.client.t('CONFIG.NO_LOGPING_ROLES', message)
			);
			return;
		}
		await message.util!.send(
			await this.client.t('CONFIG.SERVER_LOGPING_ROLES', message, {
				roles: guildEntry.logpings.map(p => `<@&${p}>`).join(', ')
			})
		);
	}
}
