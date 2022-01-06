import { Message, Snowflake } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App, Guild, Submission } from '@lib/models';
import got, { HTTPError } from 'got';
import { AppQuestionType } from '@lib/models/types';
import { stripIndent } from 'common-tags';

export interface GuildData {
	id: Snowflake;
	prefixes: string[];
	log_channel: Snowflake;
	archive_channel: Snowflake;
	admin_roles: Snowflake[];
	review_roles: Snowflake[];
	blacklist_roles: Snowflake[];
	ignored_channels: Snowflake[];
	ignored_roles: Snowflake[];
	premium: boolean;
}
export interface GuildPositionData {
	id: string;
	name: string;
}

export interface PositionData {
	id: string;
	name: string;
	created_at: Date;
	questions: {
		[q: string]: {
			details: unknown[];
			type: number;
		};
	};
	required_roles: Snowflake[];
	remove_roles: Snowflake[];
	reward_roles: Snowflake[];
	reward_message: string;
	open: boolean;
	guild_id: Snowflake;
	created_by: Snowflake;
	template_id: string;
}

export interface ApplicationData {
	author_id: string;
	position_id: string;
	version: number;
	answers: {
		question: string;
		answer: string;
	}[];
}

export default class ConfigLogpingCommand extends BotCommand {
	public constructor() {
		super('config-migrate', {
			aliases: ['config-migrate'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_MIGRATE'),
				usage: 'config migratre',
				examples: ['config migrate']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message) {
		const authHeaders = {
			headers: {
				Authorization: `Bearer ${this.client.config.migrationToken}`
			}
		};

		const [guildEntry] = await Guild.findOrBuild({
			where: {
				id: message.guild!.id
			},
			defaults: {
				id: message.guild!.id
			}
		});
		// Transfer guild config
		let guildData: GuildData;
		try {
			guildData = await got
				.get(
					`https://api.yourapps.cyou/guilds/${message.guild!.id}`,
					authHeaders
				)
				.json();
		} catch (e) {
			if (e instanceof HTTPError && e.response.statusCode == 404) {
				await message.util!.send(
					this.client.i18n.t('ERROR.TRANSFER_GUILD_NOT_FOUND')
				);
			} else {
				await this.logError(message, e);
			}
			return;
		}
		guildData.prefixes.forEach(e => {
			if (!guildEntry.prefixes.includes(e)) guildEntry.prefixes.push(e);
		});
		guildData.review_roles.forEach(e => {
			if (!guildEntry.reviewroles.includes(e)) guildEntry.reviewroles.push(e);
		});
		guildData.admin_roles.forEach(e => {
			if (!guildEntry.adminroles.includes(e)) guildEntry.adminroles.push(e);
		});
		guildData.blacklist_roles.forEach(e => {
			if (!guildEntry.blacklistroles.includes(e))
				guildEntry.blacklistroles.push(e);
		});
		guildEntry.logchannel = guildData.log_channel;
		guildEntry.archivechannel = guildData.archive_channel;
		guildEntry.legacypremium = guildData.premium;
		await guildEntry.save();
		// Transfer positions
		let guildPositions: GuildPositionData[];
		const map: Record<string, number> = {};
		try {
			guildPositions = await got
				.get(
					`https://api.yourapps.cyou/guilds/${message.guild!.id}/positions`,
					authHeaders
				)
				.json();
		} catch (e) {
			await this.logError(message, e);
			return;
		}
		for (const position of guildPositions) {
			let data: PositionData;
			try {
				data = await got
					.get(
						`https://api.yourapps.cyou/positions/${position.id}`,
						authHeaders
					)
					.json();
			} catch (e) {
				if (e.response?.statusCode == 404) continue;
				await this.logError(message, e);
				return;
			}
			const [app, created] = await App.findOrBuild({
				where: {
					name: position.name
				},
				defaults: {
					name: data.name,
					guild: message.guild!.id,
					questions: Object.entries(data.questions).map(q => ({
						question: q[0],
						type: AppQuestionType.STRING
					})),
					closed: !data.open,
					rewardroles: data.reward_roles,
					removeroles: data.remove_roles,
					requiredroles: data.required_roles
				}
			});
			if (created) await app.save();
			else
				await message.util!.send(
					this.client.i18n.t('CONFIG.IGNORING_APP', { app: app.name })
				);
			map[data.id] = app.id;
		}
		// Transfer apps
		let submittedApps: ApplicationData[];
		try {
			submittedApps = await got
				.get(
					`https://api.yourapps.cyou/guilds/${message.guild!.id}/applications`,
					authHeaders
				)
				.json();
		} catch (e) {
			await this.logError(message, e);
			return;
		}
		for (const app of submittedApps) {
			const answers: Record<string, string> = {};
			for (const ans of app.answers) {
				answers[ans.question] = ans.answer;
			}
			const sub = Submission.build({
				author: app.author_id,
				guild: message.guild!.id,
				position: map[app.position_id],
				answers
			});
			await sub.save();
		}
		await message.util?.send(
			'Successfully migrated all compatible settings, positions, and submitted applications.'
		);
	}

	async logError(message: Message, e: HTTPError) {
		const errorNo = Math.floor(Math.random() * 6969696969) + 69; // hehe funny number
		const errorEmbed = this.client.util
			.embed()
			.setTitle(this.client.i18n.t('ERROR_LOGGING.COMMAND.TITLE', { errorNo }))
			.setDescription(
				this.client.i18n.t('ERROR_LOGGING.COMMAND.BODY', {
					userID: message.author.id,
					userTag: message.author.tag,
					command: 'config-migrate',
					channelID: message.channel.id,
					messageUrl: message.url
				})
			)
			.addField(
				this.client.i18n.t('GENERIC.ERROR'),
				await this.client.util.codeblock(`${e.stack}`, 1024, 'js')
			)
			.addField(
				this.client.i18n.t('GENERIC.HTTP_RESPONSE'),
				await this.client.util.codeblock(
					stripIndent`
							Code: ${e.response.statusCode}
							Message: ${e.response.statusMessage}
							Url: ${e.response.requestUrl}
						`,
					1024,
					'js'
				)
			);

		await this.client.errorChannel.send({
			embeds: [errorEmbed]
		});
		const errorUserEmbed = this.client.util
			.embed()
			.setTitle(this.client.i18n.t('ERROR_LOGGING.COMMAND.ERROR_OCCURRED'))
			.setDescription(
				this.client.i18n.t('ERROR_LOGGING.COMMAND.ERROR_MESSAGE', {
					command: message.util!.parsed!.alias,
					errorNo
				})
			);
		await message.util!.send({
			embeds: [errorUserEmbed]
		});
		await message.util?.send({ embeds: [errorUserEmbed] });
	}
}
