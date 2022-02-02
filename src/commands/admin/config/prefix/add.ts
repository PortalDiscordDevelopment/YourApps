import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { LogEvent } from '@lib/ext/Util';
import got from 'got';
import { GuildData } from '../migrate';

export default class ConfigPrefixAddCommand extends BotCommand {
	public constructor() {
		super('config-prefix-add', {
			aliases: ['config-prefix-add'],
			description: {
				content: () =>
					await this.client.t(
						'COMMANDS.DESCRIPTIONS.CONFIG_PREFIX_ADD',
						message
					),
				usage: 'config prefix add <prefix>',
				examples: ['config prefix add ya!']
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
				await this.client.t('ARGS.PLEASE_GIVE', message, { type: 'prefix' })
			);
			return;
		}
		const v3Settings: GuildData = await got
			.get(
				`https://${
					this.client.config.migrationApiUrl
				}/guilds/${message.guildId!}`,
				{
					headers: {
						Authorization: `Bearer ${this.client.config.migrationToken}`
					}
				}
			)
			.json();
		if (v3Settings.prefixes.includes(prefix)) {
			await message.util!.send(
				await this.client.t('ERRORS.PREFIX_EXISTS_V3', message)
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
		if (guildEntry.prefixes.includes(prefix)) {
			await message.util!.send(
				await this.client.t('CONFIG.PREFIX_ALREADY_ADDED', message)
			);
			return;
		}
		guildEntry.prefixes.push(prefix);
		guildEntry.changed('prefixes', true);
		await guildEntry.save();
		await message.util!.send(
			await this.client.t('CONFIG.PREFIX_ADDED', message, { prefix })
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.PREFIX_ADD,
			{
				prefix
			}
		);
	}
}
