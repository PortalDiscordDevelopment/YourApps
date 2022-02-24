/* eslint-disable @typescript-eslint/no-unused-vars */
import { exec } from 'child_process';
import { Message, MessageEmbed } from 'discord.js';
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
				},
				{
					id: 'out',
					match: 'flag',
					flag: '--out'
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
			out: boolean;
		}
	) {
		if (!args.code) {
			await message.util!.send(
				await this.client.t('ARGS.PLEASE_GIVE', message, { type: 'code' })
			);
			return;
		}

		const embed = this.client.util.embed();
		args.code = args.code.replace(/[“”]/g, '"'); // Replace fancy quotes with normal ones
		try {
			args.code = format(args.code, {
				// Format input code with prettier
				useTabs: false,
				tabWidth: 4,
				quoteProps: 'consistent',
				singleQuote: true,
				trailingComma: 'none',
				endOfLine: 'lf',
				arrowParens: 'avoid',
				parser: 'typescript'
			});
		} catch (e) {
			if (e instanceof SyntaxError) {
				await message.util!.reply({
					embeds: [
						await this.getEmbed(
							message,
							args.code,
							args.depth,
							result.err(new PrettierSyntaxError(e))
						)
					]
				});
				return;
			} else throw e;
		}
		const transpiledCode = this.transpileAsync(args.code); // Transpile the input code to javascript, and wrap it in an async function (that returns the last statement)

		const me = message.member, // Define some aliases for the evaled code
			member = message.member,
			bot = this.client,
			guild = message.guild,
			channel = message.channel,
			config = this.client.config,
			members = message.guild?.members,
			roles = message.guild?.roles;
		const output = await result.fromAsync(eval(transpiledCode)); // Eval transpiled code, awaiting the output if needed

		await message.reply({
			embeds: [
				await this.getEmbed(
					message,
					args.code,
					args.depth,
					output,
					transpiledCode,
					args.out
				)
			]
		});
	}

	/**
	 * Tranpiles typescript code to an async javascript function that returns the last statement
	 * @param code The typescript code to transpile
	 * @returns The transpiled javascript code, wrapped in an async function that returns the last statement
	 */
	private transpileAsync(code: string) {
		code = `(async () => { ${code} })()`; // Wrap code in an async function
		const sourceFile = this.project.createSourceFile('eval', code, {
			// Load wrapped typescript code into a source file
			scriptKind: ts.ScriptKind.TS,
			overwrite: true
		});
		const iife = (
			(
				(
					sourceFile.getStatements()[0] as ExpressionStatement
				).getExpression() as CallExpression
			).getExpression() as ParenthesizedExpression
		).getExpression() as ArrowFunction; // Get the arrow function from the sourceFile
		const statements = (iife.getBody() as Block).getStatements(); // Get all statements in the arrow function
		const lastStatement = statements[statements.length - 1]; // Get the last statement in the arrow function
		if (lastStatement.getKind() === ts.SyntaxKind.ExpressionStatement) {
			// If it is an expression statement, make it return
			iife.insertStatements(statements.length, writer =>
				Writers.returnStatement((lastStatement as ExpressionStatement).print())(
					writer
				)
			); // Insert the last stament except with return keyword into the arrow function
			lastStatement.remove(); // Remove the original statement
		}
		// Get all ImportDeclarations from the iife
		const imports = iife.getStatements().filter(s => s.getKind() === ts.SyntaxKind.ImportDeclaration);
		for (const importDeclaration of imports) {
			sourceFile.insertStatements(0, writer => writer.write(importDeclaration.print())); // Add the ImportDeclaration to the outer sourceFile
			importDeclaration.remove(); // Remove original ImportDeclaration
		}
		// Transpile the modified code
		return ts.transpile(sourceFile.print(), this.project.compilerOptions.get());
	}

	private async getEmbed(
		message: Message,
		originalCode: string,
		depth: number,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		output: result.Result<any, unknown>,
		transpiledCode?: string,
		showTranspiled?: boolean
	): Promise<MessageEmbed> {
		const embed = this.client.util.embed();
		embed.setTitle(`${output.success ? 'S' : 'Uns'}uccessfully evaluated code`);
		embed.setAuthor({
			name: message.author.tag,
			iconURL: message.author.displayAvatarURL()
		});
		embed.addField(
			'TypeScript code',
			await this.client.util.codeblock(originalCode, 1024, 'ts')
		);
		if (showTranspiled && transpiledCode)
			embed.addField(
				'Transpiled code',
				await this.client.util.haste(transpiledCode)
			); // Add the transpiled code to the embed if the --out flag was given
		embed.addField(
			`${output.success ? 'O' : 'Error o'}utput${
				output.success || output.error instanceof Error
					? ''
					: ' (non-error output)' // Mention if the error is not an actual error
			}`,
			await this.client.util.codeblock(
				this.stringifyOutput(output, depth),
				1024,
				'js'
			)
		);
		return embed;
	}

	private stringifyOutput(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		output: result.Result<any, unknown>,
		depth: number
	): string {
		let stringifiedOutput: string;
		if (output.success && typeof output.value === 'string')
			// Eval was successful, and the output is a string, so wrap it in quotes
			stringifiedOutput = `'${output.value}'`;
		else if (output.success)
			// Eval was successful, but the output is not a string, so inspect it
			stringifiedOutput = inspect(output.value, {
				depth: depth,
				getters: true,
				showProxy: true,
				showHidden: true
			});
		else if (output.error instanceof PrettierSyntaxError)
			// Eval failed because of a syntax error while formatting, so show the error message with ansi stripped
			stringifiedOutput = output.error.message.replace(
				// eslint-disable-next-line no-control-regex
				/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
				''
			);
		else if (output.error instanceof Error)
			// Eval failed, and the error is an error, so get the stack (or message if stack doesn't exist for some reason)
			stringifiedOutput = output.error.stack ?? output.error.message;
		// Eval failed, and the error is not an error (for some reason), so inspect it
		else
			stringifiedOutput = inspect(output.error, {
				depth: depth,
				getters: true,
				showProxy: true,
				showHidden: true
			});
		return stringifiedOutput;
	}
}

/**
 * A wrapper around SyntaxError to show that it came from prettier
 */
class PrettierSyntaxError extends SyntaxError {
	public constructor(e: SyntaxError) {
		super(e.message);
		this.name = 'PrettierSyntaxError';
	}
}
