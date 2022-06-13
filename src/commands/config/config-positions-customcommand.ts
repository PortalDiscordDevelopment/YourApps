import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { Op } from 'sequelize';
import { Position } from '../../lib/models';
import result from '@sapphire/result';

@ApplyOptions<CommandOptions>({
    name: 'config-positions-customcommand',
    description: 'Sets a custom command for applying to a position',
    preconditions: ['GuildOnly'],
    slashOptions: { options: [
        {
            name: 'name',
            description: 'The name of the position to create, set, or delete a custom command for',
            type: 'STRING',
            required: true,
            autocomplete: true
        },
        {
            name: 'custom command',
            description: 'The name of the custom command to create, set, or delete. If this option is not set, it will delete the custom command for this position',
            type: 'STRING',
            required: false
        }
    ] }
})
export class ConfigPositionsCustomCommandCommand extends BotCommand {
    override async chatInputRun(interaction: CommandInteraction) {
        await interaction.deferReply();
		const {
			position: positionName,
			'custom command': customCommand
		}: {
			position: string;
			'custom command'?: string;
		} = this.parseArgs(interaction);
		const position = await Position.findOne({
			where: {
				guild: interaction.guildId!,
				name: positionName
			}
		});
		if (!position) {
			await interaction.editReply(
				await this.t(interaction, 'errors:position_not_found', {
					name: positionName
				})
			);
			return;
		}

        // Set state based on exhaustive checks on both existing command and custom command arg
        let state!: CustomCommandState;
        if (position.customcommand && customCommand) state = CustomCommandState.MODIFY_EXISTING_COMMAND;
        else if (!position.customcommand && customCommand) state = CustomCommandState.ADD_COMMAND;
        else if (position.customcommand && !customCommand) state = CustomCommandState.REMOVE_COMMAND;
        else if (!position.customcommand && !customCommand) state = CustomCommandState.NO_COMMAND_TO_REMOVE;

        // Actual implementation based on state
        switch (state) {
            case CustomCommandState.ADD_COMMAND: {
                const { value: chatInputCommand, error } = await result.fromAsync(() => interaction.guild!.commands.create({
                    name: customCommand!,
                    description: `Starts an application for ${position.name}`,
                    type: "CHAT_INPUT"
                }));
                if (error) {
                    await interaction.editReply(
                        await this.t(interaction, {
                            context: 'failed',
                            command: customCommand!
                        })
                    )
                    return;
                }
                position.customcommand = chatInputCommand!.id;
                await position.save();
                await interaction.editReply(
                    await this.t(interaction, {
                        context: 'created',
                        position: position.name,
                        command: chatInputCommand!.name
                    })
                )
                break;
            }
        }
    }

    // Autocomplete positions based on a substring search
	override async autocompleteRun(interaction: AutocompleteInteraction) {
		const positions = await Position.findAll({
			where: {
				name: {
					[Op.substring]: interaction.options.getString('name', false) ?? ''
				}
			}
		});
		await interaction.respond(
			positions.map(p => ({
				name: `${p.id} - ${p.name}`,
				value: p.name
			}))
		);
	}
}

/**
 * A simple enum to make the code more readable
 */
enum CustomCommandState {
    // Is currently a command, and user provides a command
    MODIFY_EXISTING_COMMAND,
    // Is currently not a command, and user provides a command
    ADD_COMMAND,
    // Is currently a command, and user doesn't provide a command
    REMOVE_COMMAND,
    // Is currently not a command, and user doesn't provide a command
    NO_COMMAND_TO_REMOVE
}