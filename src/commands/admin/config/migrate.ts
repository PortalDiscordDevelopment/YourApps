import { Message, Snowflake } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App, Guild, Submission } from '@lib/models';
import got, { HTTPError } from 'got';
import { AppQuestionType } from '@lib/models/types';

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
		super('config-logping', {
			aliases: ['config-logping'],
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
				.get(`https://api.yourapps.cyou/guilds/${message.guild!.id}`)
				.json();
		} catch (e) {
			if (e instanceof HTTPError && e.response.statusCode == 404) {
				await message.util!.send(
					this.client.i18n.t('ERROR.TRANSFER_GUILD_NOT_FOUND')
				);
			} else {
				await message.util!.send(
					this.client.i18n.t('ERROR.UNKNOWN_TRANSFER_ERROR')
				);
				console.error(e);
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
		// Transfer positions
		let guildPositions: GuildPositionData[];
		const map: Record<string, number> = {};
		try {
			guildPositions = await got
				.get(`https://api.yourapps.cyou/guilds/${message.guild!.id}/positions`)
				.json();
		} catch (e) {
			await message.util!.send(
				this.client.i18n.t('ERROR.UNKNOWN_TRANSFER_ERROR')
			);
			console.error(e);
			return;
		}
		for (const position of guildPositions) {
			let data: PositionData;
			try {
				data = await got
					.get(`https://api.yourapps.cyou/positions/${position.id}}`)
					.json();
			} catch (e) {
				if (e.response?.statusCode == 404) continue;
				await message.util!.send(
					this.client.i18n.t('ERROR.UNKNOWN_TRANSFER_ERROR')
				);
				console.error(e);
				return;
			}
			const app = App.build({
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
			});
			await app.save();
			map[data.id] = app.id;
		}
		// Transfer apps
		let submittedApps: ApplicationData[];
		try {
			submittedApps = await got
				.get(
					`https://api.yourapps.cyou/guilds/${message.guild!.id}/applications`
				)
				.json();
		} catch (e) {
			await message.util!.send(
				this.client.i18n.t('ERROR.UNKNOWN_TRANSFER_ERROR')
			);
			console.error(e);
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
}
