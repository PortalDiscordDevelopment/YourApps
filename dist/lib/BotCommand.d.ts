import { ApplicationCommandRegistry, Command, CommandOptions, PieceContext } from '@sapphire/framework';
import type { ApplicationCommandOptionData, Snowflake } from 'discord.js';
import { Utils } from './Utils';
export declare class BotCommand extends Command {
    constructor(context: PieceContext, options: CommandOptions);
    registerApplicationCommands(registry: ApplicationCommandRegistry): void;
    parseArgs: typeof Utils.parseInteractionArgs;
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
export {};
//# sourceMappingURL=BotCommand.d.ts.map