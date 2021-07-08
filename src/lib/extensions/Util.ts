import { ClientUtil } from 'discord-akairo';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import { Util as DiscordUtil } from 'discord.js';
import got from 'got';
import { Message } from 'discord.js';
import { Guild } from '../models';
import { BotClient } from './BotClient';

const exec = promisify(execCallback);

enum RoleOverrideType {
	ADMIN,
	REVIEW
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
		return this.client.i18n.t('UNABLE_TO_POST');
	}

	/**
	 * Surrounds text in a code block with the specified language and puts it in a hastebin if its too long.
	 *
	 * * Embed Description Limit = 2048 characters
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
			hasteOut = this.client.i18n.t('USED_HASTEBIN', {
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

	static RoleOverrideType = RoleOverrideType;

	static getGuildRoleOverride(overrideType: RoleOverrideType) {
		return async (message: Message) => {
			const guildEntry = await Guild.findByPk(message.guild!.id);
			if (
				!guildEntry ||
				(overrideType == RoleOverrideType.ADMIN &&
					guildEntry.adminroles === null) ||
				(overrideType == RoleOverrideType.REVIEW &&
					guildEntry.reviewroles === null)
			) {
				return false;
			}
			switch (overrideType) {
				case RoleOverrideType.ADMIN:
					return message.member!.roles.cache.some((r) =>
						guildEntry.adminroles ? guildEntry.adminroles.includes(r.id) : false
					);
				case RoleOverrideType.REVIEW:
					return message.member!.roles.cache.some((r) =>
						guildEntry.reviewroles
							? guildEntry.reviewroles.includes(r.id)
							: false
					);
			}
		};
	}

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
}
