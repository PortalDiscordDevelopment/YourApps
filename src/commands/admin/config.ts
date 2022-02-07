import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigCommand extends BotCommand {
	public constructor() {
		super('config', {
			aliases: ['config'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.CONFIG'),
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
				'config-migrate',
				'config-delete',
				'config-edit'
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
				['config-migrate', 'migrate'],
				['config-delete', 'delete'],
				['config-edit', 'edit']
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
				await this.client.t('CONFIG.NO_CONFIG', message)
			);
			return;
		}
		const roleFmt = async (rs: Array<string>) =>
			(
				await Promise.all(
					rs.map(async r =>
						(await message.guild.roles.fetch(r))
							? `<@&${r}>`
							: `\`${r} (deleted)\``
					)
				)
			).join(', ');
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle(await this.client.t('CONFIG.GUILD_CONFIG', message))
					.addField(
						await this.client.t('CONFIG.PREFIXES', message),
						await this.client.t('CONFIG.OR_MENTION', message, {
							prefixes: guildEntry.prefixes.map(p => `\`${p}\``).join(', ')
						}),
						true
					)
					.addField(
						await this.client.t('CONFIG.REVIEW_ROLES', message),
						guildEntry.reviewroles.length > 0
							? await roleFmt(guildEntry.reviewroles)
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.ADMIN_ROLES', message),
						guildEntry.adminroles.length > 0
							? await roleFmt(guildEntry.adminroles)
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.BLACKLIST_ROLES', message),
						guildEntry.blacklistroles.length > 0
							? await roleFmt(guildEntry.blacklistroles)
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.LOG_PING_ROLES', message),
						guildEntry.logpings.length > 0
							? await roleFmt(guildEntry.logpings)
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.LOG_CHANNEL', message),
						guildEntry.logchannel !== null
							? `<#${guildEntry.logchannel}>`
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
					.addField(
						await this.client.t('CONFIG.ARCHIVE_CHANNEL', message),
						guildEntry.archivechannel !== null
							? `<#${guildEntry.archivechannel}>`
							: await this.client.t('CONFIG.NONE_SET', message),
						true
					)
			]
		});
	}
}
