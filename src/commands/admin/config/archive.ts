import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models/Guild';
import { Message, Channel } from 'discord.js';

export default class ConfigArchiveCommand extends BotCommand {
	constructor() {
		super('config-archive', {
			aliases: ['config-archive'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_ARCHIVE'),
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
					this.client.i18n.t('CONFIG.SERVER_ARCHIVE_CHANNEL', {
						channelID: guildEntry.archivechannel
					})
				);
			} else {
				await message.util!.send(
					this.client.i18n.t('CONFIG.NO_ARCHIVE_CHANNEL')
				);
			}
			return;
		}
		guildEntry.archivechannel = channel.id;
		await guildEntry.save();
		await message.util!.send(
			this.client.i18n.t('CONFIG.ARCHIVE_CHANNEL_SET', {
				channelID: channel.id
			})
		);
	}
}
