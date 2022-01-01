import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigCommand extends BotCommand {
	public constructor() {
		super('config', {
			aliases: ['config'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG'),
				usage: 'config',
				examples: ['config']
			},
			children: [
				'config-prefix',
				'config-admin',
				'config-blacklist',
				'config-logping',
				'config-review',
				'config-open',
				'config-close',
				'config-log',
				'config-archive',
				'config-new',
				'config-migrate'
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-prefix', 'prefix', 'pre'],
				['config-admin', 'admin'],
				['config-blacklist', 'blacklist'],
				['config-logping', 'logping'],
				['config-review', 'review'],
				['config-open', 'open'],
				['config-close', 'close'],
				['config-log', 'log'],
				['config-archive', 'archive'],
				['config-new', 'new'],
				['config-migrate', 'migrate']
			]
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (!guildEntry) {
			await message.util!.send(this.client.i18n.t('CONFIG.NO_CONFIG'));
			return;
		}
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle(this.client.i18n.t('CONFIG.GUILD_CONFIG'))
					.addField(
						this.client.i18n.t('CONFIG.PREFIXES'),
						this.client.i18n.t('CONFIG.OR_MENTION', {
							prefixes: guildEntry.prefixes.map(p => `\`${p}\``).join(', ')
						}),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.REVIEW_ROLES'),
						guildEntry.reviewroles.length > 0
							? guildEntry.reviewroles.map(r => `<@&${r}>`).join(', ')
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.ADMIN_ROLES'),
						guildEntry.adminroles.length > 0
							? guildEntry.adminroles.map(r => `<@&${r}>`).join(', ')
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.BLACKLIST_ROLES'),
						guildEntry.blacklistroles.length > 0
							? guildEntry.blacklistroles.map(r => `<@&${r}>`).join(', ')
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.LOG_PING_ROLES'),
						guildEntry.logpings.length > 0
							? guildEntry.logpings.map(r => `<@&${r}>`).join(', ')
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.LOG_CHANNEL'),
						guildEntry.logchannel !== null
							? `<#${guildEntry.logchannel}>`
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
					.addField(
						this.client.i18n.t('CONFIG.ARCHIVE_CHANNEL'),
						guildEntry.archivechannel !== null
							? `<#${guildEntry.archivechannel}>`
							: this.client.i18n.t('CONFIG.NONE_SET'),
						true
					)
			]
		});
	}
}
