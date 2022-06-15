import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction } from 'discord.js';

@ApplyOptions<CommandOptions>({
    name: 'config',
    description: 'The root command for all configuration commands',
    preconditions: [],
    slashOptions: { options: [] },
    subCommands: ['config-positions']
})
export class ConfigCommand extends BotCommand {
    override async chatInputRun(interaction: CommandInteraction) {
        this.client.logger.warn('root called')
        interaction;
    }
}