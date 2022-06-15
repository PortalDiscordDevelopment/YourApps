import {
	ApplicationCommandRegistry,
	Command,
	CommandOptions,
	CommandStore,
	PieceContext,
	RegisterBehavior
} from '@sapphire/framework';
import type { TOptions } from '@sapphire/plugin-i18next';
import type {
	ApplicationCommandAutocompleteOption,
	ApplicationCommandChannelOptionData,
	ApplicationCommandChoicesData,
	ApplicationCommandData,
	ApplicationCommandNonOptionsData,
	ApplicationCommandNumericOptionData,
	ApplicationCommandOptionData,
	ApplicationCommandSubCommandData,
	ApplicationCommandSubGroupData,
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
	embedField?: boolean;
	/**
	 * Whether to return inline for this embed field or not.
	 * @default true
	 */
	inlineField?: boolean;

	/**
	 * A generic index type allowing for variables to be inputted to strings
	 */
	[variableName: string]: unknown;
}>;

export class BotCommand extends Command {
	constructor(context: PieceContext, options: CommandOptions) {
		super(context, options);
		this.slashOptions = options.slashOptions;
		this.isSubCommand = options.isSubCommand ?? false;
		this.isSubCommandGroup = options.isSubCommandGroup ?? false;
		this.subcommands = options.subCommands;
		this.subcommandName = options.subcommandName;
	}

	override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		if (
			this.chatInputRun &&
			!this.isSubCommand &&
			!this.isSubCommandGroup &&
			this.name &&
			this.options.slashOptions
		) {
			const subcommandOptions: (ApplicationCommandSubCommandData | ApplicationCommandSubGroupData)[] = [];

			for (const subcommand of this.subcommands ?? []) {
				const piece = (this.store as CommandStore).get(subcommand) as
					| BotCommand
					| undefined;
				if (!piece) {
					this.container.logger.warn(
						`Command ${this.name} declares a subcommand with name ${subcommand}, but this command could not be found in the store.`
					);
					continue;
				}
				if (!piece.slashOptions) {
					this.container.logger.warn(
						`Command ${this.name} declares a subcommand with name ${subcommand}, but the subcommand does not have any slashOptions.`
					);
					continue;
				}
				if (!piece.subcommandName) {
					this.container.logger.warn(
						`Command ${this.name} declares a subcommand with name ${subcommand}, but the subcommand does not have a subcommandName property.`
					);
					continue;
				}
				if (!piece.isSubCommand && !piece.isSubCommandGroup) {
					this.container.logger.warn(
						`Command ${this.name} declares a subcommand with name ${subcommand}, but the subcommand does not set isSubCommand or isSubCommandGroup as true.`
					);
					continue;
				}
				if (piece.isSubCommand) { // If this is a normal subcommand, not a group
					subcommandOptions.push({
						type: 'SUB_COMMAND',
						name: piece.subcommandName,
						description: piece.description,
						// Cast options to exclude more 
						options: piece.slashOptions.options as (
							| ApplicationCommandNonOptionsData
							| ApplicationCommandChannelOptionData
							| ApplicationCommandChoicesData
							| ApplicationCommandAutocompleteOption
							| ApplicationCommandNumericOptionData
						)[]
					});
				} else if (piece.isSubCommandGroup) {
					// Yes this is repeated code, but this code is not meant to look nice, it is meant to work until @sapphire/plugin-subcommands supports slash commands.
					const nestedSubcommandOptions: ApplicationCommandSubCommandData[] = [];

					for (const nestedSubcommand of piece.subcommands ?? []) {
						const nestedPiece = (this.store as CommandStore).get(nestedSubcommand) as
							| BotCommand
							| undefined;
						if (!nestedPiece) {
							this.container.logger.warn(
								`Subcommand group ${piece.name} declares a subcommand with name ${nestedSubcommand}, but this command could not be found in the store.`
							);
							continue;
						}
						if (!nestedPiece.slashOptions) {
							this.container.logger.warn(
								`Subcommand group ${piece.name} declares a subcommand with name ${nestedSubcommand}, but the subcommand does not have any slashOptions.`
							);
							continue;
						}
						if (!nestedPiece.subcommandName) {
							this.container.logger.warn(
								`Subcommand group ${this.name} declares a subcommand with name ${subcommand}, but the subcommand does not have a subcommandName property.`
							);
							continue;
						}
						if (!nestedPiece.isSubCommand) {
							this.container.logger.warn(
								`Subcommand group ${piece.name} declares a subcommand with name ${nestedSubcommand}, but the subcommand does not set isSubCommand as true.`
							);
							continue;
						}
						nestedSubcommandOptions.push({
							type: 'SUB_COMMAND',
							name: nestedPiece.subcommandName,
							description: nestedPiece.description,
							// Cast options to exclude more subcommands
							options: nestedPiece.slashOptions.options as (
								| ApplicationCommandNonOptionsData
								| ApplicationCommandChannelOptionData
								| ApplicationCommandChoicesData
								| ApplicationCommandAutocompleteOption
								| ApplicationCommandNumericOptionData
							)[]
						});
					}
					subcommandOptions.push({
						type: 'SUB_COMMAND_GROUP',
						name: piece.subcommandName,
						description: piece.description,
						// Cast options to exclude more 
						options: [...piece.slashOptions.options ?? [], ...nestedSubcommandOptions] as ApplicationCommandSubCommandData[]
					});
				}
			}

			const command: ApplicationCommandData = {
				name: this.name,
				description:
					this.options.slashOptions.description ??
					this.description ??
					'No description provided.',
				options: [...this.options.slashOptions.options ?? [], ...subcommandOptions]
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
		options?: LocalizationOptions & { embedField?: false }
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
		options?: LocalizationOptions & { embedField?: true }
	): Promise<EmbedFieldData>;

	// Actual function implementation
	protected async t(
		interaction: CommandInteraction,
		keyOrOptions?: string | LocalizationOptions, // Options/undefined if first overload, key if second overload
		options?: LocalizationOptions // Options/undefined if second overload
	): Promise<string | EmbedFieldData> {
		if (!options?.embedField && typeof keyOrOptions == 'string') {
			// Second overload, normal string lookup
			return this.container.t(
				interaction,
				keyOrOptions.includes(':') // Add commands/${this.name} if absent
					? keyOrOptions
					: `commands/${this.name}:${keyOrOptions}`,
				options ?? {}
			);
		} else if (!options?.embedField && typeof keyOrOptions != 'string') {
			// First overload, normal string lookup
			return this.container.t(
				interaction,
				`commands/${this.name}:response`,
				keyOrOptions ?? {}
			);
		} else if (options?.embedField && typeof keyOrOptions == 'string') {
			// Second overload, embed field lookup
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
			};
		} else {
			// First overload, embed field lookup
			const options = (keyOrOptions as LocalizationOptions | undefined) ?? {};
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
			};
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
		isSubCommand?: boolean;
		isSubCommandGroup?: boolean;
		subcommandName?: string;
		/**
		 * An array of sapphire command names to use as subcommands
		 */
		subCommands?: string[];
	}
	interface Command {
		slashOptions?: SlashCommandOptions;
		isSubCommand: boolean;
		isSubCommandGroup: boolean;
		subcommandName?: string;
		subcommands?: string[];
	}
}
