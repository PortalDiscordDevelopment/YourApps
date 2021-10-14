import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { LogEvent } from '@lib/ext/Util';

export default class ConfigPrefixRemoveCommand extends BotCommand {
	public constructor() {
		super('config-prefix-remove', {
			aliases: ['config-prefix-remove'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_PREFIX_REMOVE'),
				usage: 'config prefix remove <prefix>',
				examples: ['config prefix remove ya!']
			},
			category: 'admin',
			args: [
				{
					id: 'prefix',
					match: 'rest'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { prefix }: { prefix?: string }) {
		if (!prefix) {
			await message.util!.send(
				this.client.i18n.t('ARGS.PLEASE_GIVE', { type: 'prefix' })
			);
			return;
		}
		const [guildEntry] = await Guild.findOrBuild({
			where: {
				id: message.guild!.id
			},
			defaults: {
				id: message.guild!.id
			}
		});
		if (!guildEntry.prefixes.includes(prefix)) {
			await message.util!.send(this.client.i18n.t('CONFIG.PREFIX_NOT_ADDED'));
			return;
		}
		guildEntry.prefixes.splice(guildEntry.prefixes.indexOf(prefix), 1);
		guildEntry.changed('prefixes', true);
		if (guildEntry.prefixes.length < 1) {
			await message.util!.send(
				this.client.i18n.t('CONFIG.TOO_LITTLE_PREFIXES')
			);
			return;
		}
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.PREFIX_REMOVED', { prefix })
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.PREFIX_REMOVE,
			{
				prefix
			}
		);
	}
}
