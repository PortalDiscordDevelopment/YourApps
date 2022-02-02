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
					await this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_PREFIX', message),
				usage: 'config prefix',
				examples: ['config prefix']
			},
			channel: 'guild',
			category: 'admin',
			children: ['config-prefix-add', 'config-prefix-remove'],
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
				await this.client.t('CONFIG.SERVER_PREFIXES', message, {
					prefixes: this.client.config.defaultPrefix
				})
			);
			return;
		}
		await message.util!.send(
			await this.client.t('CONFIG.SERVER_PREFIXES', message, {
				prefixes: guildEntry.prefixes.map(p => `\`${p}\``).join(', ')
			})
		);
	}
}
