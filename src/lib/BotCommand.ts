import {
	ApplicationCommandRegistry,
	Command,
	CommandOptions,
	PieceContext,
	RegisterBehavior
} from '@sapphire/framework';
import type { TOptions } from '@sapphire/plugin-i18next';
import type {
	ApplicationCommandData,
	ApplicationCommandOptionData,
	CommandInteraction,
	EmbedFieldData,
	Snowflake
} from 'discord.js';
import * as config from '../options/config';
import type { BotClient } from './BotClient';
import { Utils } from './Utils';

export type LocalizationOptions = TOptions<{
	/**
	 * If this localization should return an embed field object from the key or not
	 * If yes, the value for this key should have subkeys title and body.
	 * @default false
	 */
	embedField?: boolean
	/**
	 * Whether to return inline for this embed field or not.
	 * @default true
	 */
	inlineField?: boolean

	/**
	 * A generic index type allowing for variables to be inputted to strings
	 */
	[variableName: string]: unknown;
}>;

export class BotCommand extends Command {
	constructor(context: PieceContext, options: CommandOptions) {
		super(context, options);
	}

	override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		if (this.chatInputRun && this.name && this.options.slashOptions) {
			const command: ApplicationCommandData = {
				name: this.name,
				description:
					this.options.slashOptions.description ||
					this.description ||
					'No description provided.',
				options: this.options.slashOptions.options || []
			};

			registry.registerChatInputCommand(command, {
				idHints: this.options.slashOptions.idHints
					? this.options.slashOptions.idHints
					: config.slashHints[this.name]
					? [config.slashHints[this.name]]
					: [],
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
				...(config.dev
					? { guildIds: [config.devGuild] }
					: this.options.slashOptions.guildIDs
					? { guildIds: this.options.slashOptions.guildIDs }
					: {})
			});
		}
	}

	protected parseArgs = Utils.parseInteractionArgs;

	// Because of how typescript overloads work, the code below is a mess, but I tried to comment it as much as possible

	/**
	 * Resolve the command response from a command interaction, which is used to select the language.
	 * @param interaction The interaction to get language from
	 * @param options An optional object of additional options to pass to i18next
	 */
	protected async t(
		interaction: CommandInteraction,
		options?: LocalizationOptions
	): Promise<string>;

	/**
	 * Resolve text from a command interaction with a key, which is used to select the language.
	 * @param interaction The interaction to get language from
	 * @param key The key representing the text to resolve, will add `commands/${this.name}:` to the front if absent
	 * @param options An optional object of additional options to pass to i18next
	 */
	protected async t(
		interaction: CommandInteraction,
		key: string,
		options?: LocalizationOptions & { embedField: false }
	): Promise<string>;

	/**
	 * Resolve an embed field from a command interaction with a key, which is used to select the language.
	 * @param interaction The interaction to get language from
	 * @param key The key representing the text to resolve, will add `commands/${this.name}:` to the front if absent
	 * @param options An optional object of additional options to pass to i18next
	 */
	protected async t(
		interaction: CommandInteraction,
		key: string,
		options?: LocalizationOptions & { embedField: true }
	): Promise<EmbedFieldData>;

	// Actual function implementation
	protected async t(
		interaction: CommandInteraction,
		keyOrOptions?: string | LocalizationOptions, // Options/undefined if first overload, key if second overload
		options?: LocalizationOptions // Options/undefined if second overload
	): Promise<string|EmbedFieldData> {
		if (!options?.embedField && typeof keyOrOptions == 'string') { // Second overload, normal string lookup
			return this.container.t(
				interaction,
				keyOrOptions.includes(':') // Add commands/${this.name} if absent
				? keyOrOptions
				: `commands/${this.name}:${keyOrOptions}`,
				options ?? {}
			);
		} else if (!options?.embedField && typeof keyOrOptions != 'string') { // First overload, normal string lookup
			return this.container.t(
				interaction,
				`commands/${this.name}:response`,
				keyOrOptions ?? {}
			);
		} else if (options?.embedField && typeof keyOrOptions == 'string') { // Second overload, embed field lookup
			const obj: {
				title: string;
				body: string;
			} = await this.container.t(
				interaction,
				keyOrOptions.includes(':') // Add commands/${this.name} if absent
				? keyOrOptions
				: `commands/${this.name}:${keyOrOptions}`,
				{
					
					...options,
					returnObjects: true
				}
			);
			return {
				name: obj.title,
				value: obj.body,
				inline: options.inlineField ?? true
			}
		} else { // First overload, embed field lookup
			const options = keyOrOptions as LocalizationOptions|undefined ?? {};
			const obj: {
				title: string;
				body: string;
			} = await this.container.t(
				interaction,
				`commands/${this.name}:response`,
				{
					
					...options,
					returnObjects: true
				}
			);
			return {
				name: obj.title,
				value: obj.body,
				inline: options.inlineField ?? true
			}
		}
	}
	protected client = this.container.client as BotClient;
}

interface SlashCommandOptions {
	options?: ApplicationCommandOptionData[];
	idHints?: Snowflake[];
	description?: string;
	guildIDs?: Snowflake[];
}

declare module '@sapphire/framework' {
	interface CommandOptions {
		slashOptions?: SlashCommandOptions;
	}
	interface Command {
		slashOptions?: SlashCommandOptions;
	}
}
