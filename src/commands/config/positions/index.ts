import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../../lib/BotCommand';
import type { CommandInteraction } from 'discord.js';

@ApplyOptions<CommandOptions>({
    name: 'config-positions',
    description: 'The subcommand group for all configuration options to do with positions',
    preconditions: [],
    slashOptions: { options: [] },
    isSubCommandGroup: true,
    subCommands: ['config-positions-close', 'config-positions-open'],
    subcommandName: 'positions'
})
export class ConfigPositionsCommand extends BotCommand {
    override async chatInputRun(interaction: CommandInteraction) {
        this.client.logger.warn('group called')
        interaction;
    }
}