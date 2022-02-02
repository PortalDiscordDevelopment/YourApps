/* eslint-disable @typescript-eslint/no-unused-vars */
import { exec } from 'child_process';
import { Message } from 'discord.js';
import { Util } from 'discord.js';
import { transpile } from 'typescript';
import { inspect, promisify } from 'util';
import { BotCommand } from '@lib/ext/BotCommand';

const sh = promisify(exec);

export default class EvalCommand extends BotCommand {
	public constructor() {
		super('eval', {
			aliases: ['eval', 'ev'],
			description: {
				content: () => await this.client.t('COMMANDS.DESCRIPTIONS.EVAL', message),
				usage: 'eval <code> [--depth #] [--ts]',
				examples: ['eval message.guild.name', 'eval this.client.ownerID']
			},
			args: [
				{
					id: 'depth',
					match: 'option',
					type: 'number',
					flag: '--depth',
					default: 0
				},
				{
					id: 'typescript',
					match: 'flag',
					flag: '--ts'
				},
				{
					id: 'code',
					match: 'rest'
				}
			],
			ownerOnly: true
		});
	}

	public async exec(
		message: Message,
		args: {
			code?: string;
			depth: number;
			typescript: boolean;
		}
	) {
		if (!args.code) {
			await message.util!.send(
				await this.client.t('ARGS.PLEASE_GIVE', message, { type: 'code' })
			);
			return;
		}
		const code: { js?: string | null; ts?: string | null; lang?: 'js' | 'ts' } =
			{};
		const embed = this.client.util.embed();
		args.code = args.code.replace(/[“”]/g, '"');
		if (args.typescript) {
			code.ts = args.code;
			code.js = transpile(args.code);
			code.lang = 'ts';
		} else {
			code.ts = null;
			code.js = args.code;
			code.lang = 'js';
		}

		try {
			let output;
			const me = message.member,
				member = message.member,
				bot = this.client,
				guild = message.guild,
				channel = message.channel,
				config = this.client.config,
				members = message.guild?.members,
				roles = message.guild?.roles;

			output = eval(code.js);
			output = await output;

			if (typeof output !== 'string')
				output = inspect(output, {
					depth: args.depth || 0,
					getters: true,
					showProxy: true,
					showHidden: true
				});

			output = output.replace(
				new RegExp(
					this.client.token!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
					'g'
				),
				await this.client.t('DEVELOPER.TOKEN_OMMITTED', message)
			);

			const inputJS = Util.cleanCodeBlockContent(code.js);

			embed.setTitle(await this.client.t('DEVELOPER.EVALED_CODE', message)).setFooter({
				text: message.author.tag,
				iconURL: message.author.displayAvatarURL({ dynamic: true })
			});
			if (code.lang === 'ts') {
				const inputTS = Util.cleanCodeBlockContent(code.ts!);
				embed
					.addField(
						await this.client.t('DEVELOPER.INPUT_TYPESCRIPT', message),
						await this.client.util.codeblock(inputTS, 1024, 'ts')
					)
					.addField(
						await this.client.t('DEVELOPER.INPUT_JAVASCRIPT', message),
						await this.client.util.codeblock(inputJS, 1024, 'js')
					);
			} else {
				embed.addField(
					await this.client.t('DEVELOPER.INPUT', message),
					await this.client.util.codeblock(inputJS, 1024, 'js')
				);
			}
			embed.addField(
				await this.client.t('DEVELOPER.OUTPUT', message),
				await this.client.util.codeblock(output, 1024, 'js')
			);
		} catch (e) {
			const inputJS = Util.cleanCodeBlockContent(code.js);
			embed.setTitle(await this.client.t('DEVELOPER.EVAL_ERROR', message)).setFooter({
				text: message.author.tag,
				iconURL: message.author.displayAvatarURL({ dynamic: true })
			});
			if (code.lang === 'ts') {
				const inputTS = Util.cleanCodeBlockContent(code.ts!);
				embed
					.addField(
						await this.client.t('DEVELOPER.INPUT_TYPESCRIPT', message),
						await this.client.util.codeblock(inputTS, 1024, 'ts')
					)
					.addField(
						await this.client.t('DEVELOPER.INPUT_JAVASCRIPT', message),
						await this.client.util.codeblock(inputJS, 1024, 'js')
					);
			} else {
				embed.addField(
					await this.client.t('DEVELOPER.INPUT', message),
					await this.client.util.codeblock(inputJS, 1024, 'js')
				);
			}
			embed.addField(
				await this.client.t('DEVELOPER.OUTPUT', message),
				await this.client.util.codeblock((e as Error).stack!, 1024, 'js')
			);
		}
		await message.util!.send({ embeds: [embed] });
	}
}
