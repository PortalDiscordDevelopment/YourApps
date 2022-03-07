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
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_MIGRATE'),
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
		await message.util!.reply(
			await this.client.t('GENERIC.MIGRATING', message)
		);
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
					`https://${this.client.config.migrationApiUrl}/guilds/${
						message.guild!.id
					}`,
					authHeaders
				)
				.json();
		} catch (e) {
			if (e instanceof HTTPError && e.response.statusCode == 404) {
				await message.util!.reply(
					await this.client.t('ERRORS.TRANSFER_GUILD_NOT_FOUND', message)
				);
			} else if (e instanceof HTTPError) {
				await this.logError(message, e);
			}
			return;
		}
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
					`https://${this.client.config.migrationApiUrl}/guilds/${
						message.guild!.id
					}/positions`,
					authHeaders
				)
				.json();
		} catch (e) {
			if (e instanceof HTTPError) {
				await this.logError(message, e);
				return;
			}
			throw e;
		}
		for (const position of guildPositions) {
			let data: PositionData;
			try {
				data = await got
					.get(
						`https://${this.client.config.migrationApiUrl}/positions/${position.id}`,
						authHeaders
					)
					.json();
			} catch (e) {
				if (e instanceof HTTPError && e.response.statusCode == 404) continue;
				else if (e instanceof HTTPError) await this.logError(message, e);
				else throw e;
				return;
			}
			const [app, created] = await App.findOrBuild({
				where: {
					name: position.name,
					guild: message.guild!.id
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
				await message.channel.send(
					await this.client.t('CONFIG.IGNORING_APP', message, { app: app.name })
				);
			map[data.id] = app.id;
		}
		// Transfer apps
		let submittedApps: ApplicationData[];
		try {
			submittedApps = await got
				.get(
					`https://${this.client.config.migrationApiUrl}/guilds/${
						message.guild!.id
					}/applications`,
					authHeaders
				)
				.json();
		} catch (e) {
			if (e instanceof HTTPError) await this.logError(message, e);
			else throw e;
			return;
		}
		for (const app of submittedApps) {
			if (!Object.keys(map).includes(app.position_id)) {
				await message.channel.send({
					content: await this.client.t('CONFIG.IGNORING_SUBMISSION', message),
					allowedMentions: {
						parse: []
					}
				});
				continue;
			}
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
		await got
			.patch(
				`https://${
					this.client.config.migrationApiUrl
				}/guilds/${message.guildId!}/migrated?value=true`,
				authHeaders
			)
			.catch(() => undefined);
		await message.util?.send(
			'Successfully migrated all compatible settings, positions, and submitted applications.'
		);
	}

	async logError(message: Message, e: HTTPError) {
		const errorNo = Math.floor(Math.random() * 6969696969) + 69; // hehe funny number
		const errorEmbed = this.client.util
			.embed()
			.setTitle(`Command error #${errorNo}`)
			.setDescription(
				stripIndent`
				**User:** <@${message.author.id}> (${message.author.tag})
				**Command:** config-migrate
				**Channel:** <#${message.channel.id}> (${message.channel.id})
				**Message:** [link](${message.url})
			`
			)
			.addField(
				'Error',
				await this.client.util.codeblock(`${e.stack}`, 1024, 'js')
			)
			.addField(
				'Http response',
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
			.setTitle(await this.client.t('ERRORS.COMMAND_ERROR_OCCURRED', message))
			.setDescription(
				await this.client.t('ERRORS.COMMAND_ERROR_MESSAGE', message, {
					command: message.util!.parsed!.alias,
					errorNo
				})
			);
		await message.util!.reply({
			embeds: [errorUserEmbed]
		});
		await message.util?.send({ embeds: [errorUserEmbed] });
	}
}
