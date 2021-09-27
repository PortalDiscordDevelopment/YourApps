import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigPrefixCommand extends BotCommand {
	public constructor() {
		super('config-prefix', {
			aliases: ['config-prefix'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_PREFIX'),
				usage: 'config prefix',
				examples: ['config prefix']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-prefix-add', 'add'],
				['config-prefix-remove', 'remove']
			]
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (!guildEntry) {
			await message.util!.send(
				this.client.i18n.t('CONFIG.SERVER_PREFIXES', {
					prefixes: this.client.config.defaultPrefix
				})
			);
			return;
		}
		await message.util!.send(
			this.client.i18n.t('CONFIG.SERVER_PREFIXES', {
				prefixes: guildEntry.prefixes.map(p => `\`${p}\``).join(', ')
			})
		);
	}
}
