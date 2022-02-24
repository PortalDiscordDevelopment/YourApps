/* eslint-disable @typescript-eslint/no-unused-vars */
import { exec } from 'child_process';
import { Message } from 'discord.js';
import {
	ts,
	Project,
	ExpressionStatement,
	ArrowFunction,
	CallExpression,
	ParenthesizedExpression,
	Block,
	Writers
} from 'ts-morph';
import { inspect, promisify } from 'util';
import { BotCommand } from '@lib/ext/BotCommand';
import { join } from 'path';
import * as result from '@sapphire/result';
import { format } from 'prettier';

const sh = promisify(exec);

export default class EvalCommand extends BotCommand {
	private project = new Project({
		tsConfigFilePath: join(__dirname, '../../..', 'tsconfig.json'),
		skipAddingFilesFromTsConfig: true
	});

	public constructor() {
		super('eval', {
			aliases: ['eval', 'ev'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.EVAL'),
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
		}
	) {
		if (!args.code) {
			await message.util!.send(
				await this.client.t('ARGS.PLEASE_GIVE', message, { type: 'code' })
			);
			return;
		}
		const embed = this.client.util.embed();
		args.code = args.code.replace(/[“”]/g, '"');
		const transpiledCode = this.transpileAsync(args.code);

		const me = message.member,
			member = message.member,
			bot = this.client,
			guild = message.guild,
			channel = message.channel,
			config = this.client.config,
			members = message.guild?.members,
			roles = message.guild?.roles;
		const output = await result.fromAsync(eval(transpiledCode)); // Eval transpiled code, awaiting the output if needed

		let stringifiedOutput: string;
		if (output.success && typeof output.value === 'string')
			stringifiedOutput = `'${output.value}'`;
		else if (output.success)
			stringifiedOutput = inspect(output.value, {
				depth: args.depth,
				getters: true,
				showProxy: true,
				showHidden: true
			});
		else if (output.error instanceof Error)
			stringifiedOutput = output.error.stack ?? output.error.message;
		else
			stringifiedOutput = inspect(output.error, {
				depth: args.depth,
				getters: true,
				showProxy: true,
				showHidden: true
			});

		embed.setTitle(`${output.success ? 'S' : 'Uns'}uccessfully evaluated code`);
		embed.setAuthor({
			name: message.author.tag,
			iconURL: message.author.displayAvatarURL()
		});
		embed.addField(
			'TypeScript code',
			await this.client.util.codeblock(
				format(args.code, {
					useTabs: true,
					quoteProps: 'consistent',
					singleQuote: true,
					trailingComma: 'none',
					endOfLine: 'lf',
					arrowParens: 'avoid',
					parser: 'typescript'
				}),
				1024,
				'ts'
			)
		);
		embed.addField(
			'Transpiled code',
			await this.client.util.haste(transpiledCode)
		);
		embed.addField(
			`${output.success ? 'O' : 'Error o'}utput${
				output.error instanceof Error ? '' : ' (non-error output)'
			}`,
			await this.client.util.codeblock(stringifiedOutput, 1024, 'js')
		);
		await message.reply({
			embeds: [embed]
		});
	}

	public stringToEnum<T>(str: string, object: Record<string, unknown>): T {
		const entries = Object.entries(object);
		const entry = entries.find(e => e[0].toLowerCase() === str.toLowerCase());
		return (entry?.[1] ?? null) as T;
	}

	public transpileAsync(code: string) {
		code = `(async () => { ${code} })()`;
		const sourceFile = this.project.createSourceFile('eval', code, {
			scriptKind: ts.ScriptKind.TS,
			overwrite: true
		});
		const iife = (
			(
				(
					sourceFile.getStatements()[0] as ExpressionStatement
				).getExpression() as CallExpression
			).getExpression() as ParenthesizedExpression
		).getExpression() as ArrowFunction;
		const statements = (iife.getBody() as Block).getStatements();
		const lastStatement = statements[statements.length - 1];
		if (lastStatement.getKind() === ts.SyntaxKind.ExpressionStatement) {
			iife.insertStatements(statements.length, writer =>
				Writers.returnStatement((lastStatement as ExpressionStatement).print())(
					writer
				)
			);
			lastStatement.remove();
		}
		return ts.transpile(sourceFile.print(), {
			...this.project.compilerOptions.get()
		});
	}
}
