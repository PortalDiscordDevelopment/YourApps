import { BotCommand } from '@lib/ext/BotCommand';
import { LogEvent } from '@lib/ext/Util';
import { Guild } from '@lib/models/Guild';
import { Message, Channel } from 'discord.js';

export default class ConfigArchiveCommand extends BotCommand {
	constructor() {
		super('config-archive', {
			aliases: ['config-archive'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_ARCHIVE'),
				usage: 'config log [channel]',
				examples: ['config archive #logs', 'config archive']
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
			if (guildEntry.archivechannel) {
				await message.util!.send(
					await this.client.t('CONFIG.SERVER_ARCHIVE_CHANNEL', message, {
						channelID: guildEntry.archivechannel
					})
				);
			} else {
				await message.util!.send(
					await this.client.t('CONFIG.NO_ARCHIVE_CHANNEL', message)
				);
			}
			return;
		}
		guildEntry.archivechannel = channel.id;
		await guildEntry.save();
		await message.util!.send(
			await this.client.t('CONFIG.ARCHIVE_CHANNEL_SET', message, {
				channelID: channel.id
			})
		);
		await this.client.util.logEvent(
			message.guild!.id,
			message.author,
			LogEvent.ARCHIVE_CHANNEL,
			{ channelID: channel.id }
		);
	}
}
