import {
	ApplicationCommandRegistry,
	Command,
	CommandOptions,
	PieceContext,
	RegisterBehavior
} from '@sapphire/framework';
import type {
	ApplicationCommandData,
	ApplicationCommandOptionData,
	Snowflake
} from 'discord.js';
import * as config from '../options/config';
import { Utils } from './Utils';

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

	parseArgs = Utils.parseInteractionArgs;
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
