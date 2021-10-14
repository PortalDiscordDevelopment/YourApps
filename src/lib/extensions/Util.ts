import { ClientUtil } from 'discord-akairo';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import { Util as DiscordUtil } from 'discord.js';
import got from 'got';
import { BotClient } from './BotClient';
import { Snowflake } from 'discord.js';
import { App, Guild, Submission } from '@lib/models';
import { TextChannel } from 'discord.js';
import { AnswerType, AppQuestionType } from '@lib/models/types';

const exec = promisify(execCallback);

export enum LogEvent {
	PREFIX_ADD = 'LOGGING.PREFIX_ADDED',
	PREFIX_REMOVE = 'LOGGING.PREFIX_REMOVED',
	ADMIN_ROLE_ADD = 'LOGGING.ADMIN_ROLE_ADD',
	ADMIN_ROLE_REMOVE = 'LOGGING.ADMIN_ROLE_REMOVED',
	BLACKLIST_ROLE_ADD = 'LOGGING.BLACKLIST_ROLE_ADD',
	BLACKLIST_ROLE_REMOVE = 'LOGGING.BLACKLIST_ROLE_REMOVED',
	REVIEW_ROLE_ADD = 'LOGGING.REVIEW_ROLE_ADD',
	REVIEW_ROLE_REMOVE = 'LOGGING.REVIEW_ROLE_REMOVED',
	LOGPING_ROLE_ADD = 'LOGGING.LOGPING_ROLE_ADD',
	LOGPING_ROLE_REMOVE = 'LOGGING.LOGPING_ROLE_REMOVED',
	CLOSE = 'LOGGING.CLOSE',
	OPEN = 'LOGGING.OPEN',
	LOG_CHANNEL = 'LOGGING.LOG_CHANNEL',
	ARCHIVE_CHANNEL = 'LOGGING.ARCHIVE_CHANNEL',
	SUBMISSION_APPROVED = 'LOGGING.SUBMISSION_APPROVED',
	SUBMISSION_DENIED = 'LOGGING.SUBMISSION_DENIED',
	APPLICATION_SUBMITTED = 'LOGGING.APPLICATION_SUBMITTED'
}

export class Util extends ClientUtil {
	declare client: BotClient;

	/**
	 * The hastebin urls used to haste text
	 */
	private hasteURLs = [
		'https://hst.sh',
		'https://hastebin.com',
		'https://mystb.in',
		'https://hasteb.in',
		'https://paste.pythondiscord.com',
		'https://haste.unbelievaboat.com',
		'https://haste.clicksminuteper.net'
	];

	/**
	 * Runs a shell command and gives the output
	 * @param command The shell command to run
	 * @returns The stdout and stderr of the shell command
	 */
	public async shell(command: string) {
		return await exec(command);
	}

	/**
	 * Posts text to hastebin
	 * @param content The text to post
	 * @returns The url of the posted text
	 */
	public async haste(content: string) {
		for (const url of this.hasteURLs) {
			try {
				const res: {
					key: string;
				} = await got.post(`${url}/documents`, { body: content }).json();
				return `${url}/${res.key}`;
			} catch (e) {
				continue;
			}
		}
		return this.client.i18n.t('HASTEBIN.UNABLE_TO_POST');
	}

	/**
	 * Surrounds text in a code block with the specified language and puts it in a hastebin if its too long.
	 *
	 * * Embed Description Limit = 4096 characters
	 * * Embed Field Limit = 1024 characters
	 */
	public async codeblock(
		code: string,
		length: number,
		language: 'ts' | 'js' | 'sh' | 'json' | '' = ''
	): Promise<string> {
		let hasteOut = '';
		const tildes = '```';
		const formattingLength =
			2 * tildes.length + language.length + 2 * '\n'.length;
		if (code.length + formattingLength > length)
			hasteOut = this.client.i18n.t('HASTEBIN.TOO_LARGE', {
				link: await this.haste(code)
			});

		const code2 =
			code.length > length
				? code.substring(
						0,
						length - (hasteOut.length + '\n'.length + formattingLength)
				  )
				: code;
		return (
			tildes +
			language +
			'\n' +
			DiscordUtil.cleanCodeBlockContent(code2) +
			'\n' +
			tildes +
			(hasteOut.length ? '\n' + hasteOut : '')
		);
	}

	/**
	 * Loads (or reloads) the language files that the bot uses
	 */
	public async loadLanguages() {
		delete require.cache[require.resolve('@lib/i18n/en-US.json')];
		this.client.i18n.addResourceBundle(
			'en-US',
			'YourApps',
			await import('@lib/i18n/en-US.json'),
			true,
			true
		);
	}

	/**
	 * Utility method to create an embed with a default style and without importing MessageEmbed
	 * @param data Optional data to create the embed with
	 * @returns The created embed
	 */
	public embed(data?: Record<string, unknown>) {
		return super.embed(data).setTimestamp();
	}

	/**
	 * Logs an event to a guild's log channel
	 * @param guildID The id of the guild to log in
	 * @param event The event to log
	 * @param variables The variables to pass to the log message
	 */
	public async logEvent(
		guildID: Snowflake,
		event: LogEvent,
		variables: Record<string, string>
	) {
		const guild = await Guild.findByPk(guildID);
		if (!guild || !guild.logchannel) return;
		const channel = await this.client.channels.fetch(guild.logchannel);
		if (channel instanceof TextChannel) {
			await channel.send({
				allowedMentions: {
					parse: []
				},
				content: this.client.i18n.t(event, variables)
			});
		}
	}

	private questionValidationFunctions: Record<
		AppQuestionType,
		(answer: string) =>
			| {
					valid: true;
					processed: AnswerType;
					user: string;
			  }
			| {
					valid: false;
					error: string;
			  }
	> = {
		[AppQuestionType.STRING]: (answer: string) => ({
			valid: true,
			processed: answer,
			user: answer
		})
	};
	/**
	 * Parses an answer based on a question type
	 * @param answer The answer given
	 * @param type The application type
	 * @returns Processed data if valid, or an error message if not
	 */
	public validateQuestionType(
		answer: string,
		type: AppQuestionType
	):
		| {
				valid: true;
				processed: AnswerType;
				user: string;
		  }
		| {
				valid: false;
				error: string;
		  } {
		return this.questionValidationFunctions[type](answer);
	}

	public async approveSubmission(submission: Submission) {
		const app = (await App.findByPk(submission.position))!;
		const guild = await this.client.guilds.fetch(submission.guild);
		const member = await guild.members.fetch(submission.author);
		// Attempt to add all reward roles
		member.roles.add(app.rewardroles).catch(() => undefined);
		// Attempt to remove all remove roles
		member.roles.remove(app.removeroles).catch(() => undefined);
		submission.destroy(); // Delete submission
		this.logEvent(guild.id, LogEvent.SUBMISSION_APPROVED, {
			// Log submission
			user: member.user.tag,
			application: app.name
		});
		// Attempt to DM user
		await member
			.send(
				this.client.i18n.t('GENERIC.APPROVED', {
					application: app.name,
					guild: guild.name
				})
			)
			.catch(() => undefined);
	}

	public async denySubmission(submission: Submission) {
		const app = (await App.findByPk(submission.position))!;
		const guild = await this.client.guilds.fetch(submission.guild);
		const member = await guild.members.fetch(submission.author);
		submission.destroy(); // Delete submission
		this.logEvent(guild.id, LogEvent.SUBMISSION_DENIED, {
			// Log submission
			user: member.user.tag,
			application: app.name
		});
		// Attempt to DM user
		await member
			.send(
				this.client.i18n.t('GENERIC.DENIED', {
					application: app.name,
					guild: guild.name
				})
			)
			.catch(() => undefined);
	}
}
