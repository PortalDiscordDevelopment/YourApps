import { BotCommand } from '@lib/ext/BotCommand';
import { LogEvent } from '@lib/ext/Util';
import { Guild } from '@lib/models/Guild';
import { Message, Channel } from 'discord.js';

export default class ConfigLogCommand extends BotCommand {
	constructor() {
		super('config-log', {
			aliases: ['config-log'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_LOG'),
				usage: 'config log [channel]',
				examples: ['config log #logs', 'config log']
			},
			category: 'admin',
			args: [
				{
					id: 'channel',
					type: 'channel'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { channel }: { channel: Channel }) {
		const [guildEntry] = await Guild.findOrBuild({
			where: {
				id: message.guild!.id
			},
			defaults: {
				id: message.guild!.id
			}
		});
		if (!channel) {
			if (guildEntry.logchannel) {
				await message.util!.send(
					this.client.i18n.t('CONFIG.SERVER_LOG_CHANNEL', {
						channelID: guildEntry.logchannel
					})
				);
			} else {
				await message.util!.send(this.client.i18n.t('CONFIG.NO_LOG_CHANNEL'));
			}
			return;
		}
		guildEntry.logchannel = channel.id;
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.LOG_CHANNEL_SET', {
				channelID: channel.id
			})
		);
		await this.client.util.logEvent(message.guild!.id, message.author, LogEvent.LOG_CHANNEL, {
			channelID: channel.id
		});
	}
}
