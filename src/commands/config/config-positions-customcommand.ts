import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { Op } from 'sequelize';
import { Position } from '../../lib/models';
import * as result from '@sapphire/result';

@ApplyOptions<CommandOptions>({
	name: 'config-positions-customcommand',
	description: 'Sets a custom command for applying to a position',
	preconditions: ['GuildOnly'],
	slashOptions: {
		options: [
			{
				name: 'position',
				description:
					'The name of the position to create, set, or delete a custom command for',
				type: 'STRING',
				required: true,
				autocomplete: true
			},
			{
				name: 'command',
				description:
					'The name of the custom command to create, set, or delete. If not set, will delete the custom command',
				type: 'STRING',
				required: false
			}
		]
	}
})
export class ConfigPositionsCustomCommandCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const {
			position: positionName,
			command: customCommand
		}: {
			position: string;
			command?: string;
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
		if (position.customcommand && customCommand)
			state = CustomCommandState.MODIFY_EXISTING_COMMAND;
		else if (!position.customcommand && customCommand)
			state = CustomCommandState.ADD_COMMAND;
		else if (position.customcommand && !customCommand)
			state = CustomCommandState.REMOVE_COMMAND;
		else if (!position.customcommand && !customCommand)
			state = CustomCommandState.NO_COMMAND_TO_REMOVE;

		// Actual implementation based on state
		switch (state) {
			case CustomCommandState.ADD_COMMAND: {
				const { value: chatInputCommand, error } = await result.fromAsync(() =>
					interaction.guild!.commands.create({
						name: customCommand!,
						description: `Starts an application for ${position.name}`,
						type: 'CHAT_INPUT'
					})
				);
				if (error) {
					await interaction.editReply(
						await this.t(interaction, {
							context: 'failed',
							command: customCommand!
						})
					);
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
				);
				break;
			}

			case CustomCommandState.MODIFY_EXISTING_COMMAND: {
				const oldApplicationCommand = await interaction.guild!.commands.fetch(
					position.customcommand!
				);
				const oldName = oldApplicationCommand.name;
				const { value: newCommand, error } = await result.fromAsync(() =>
					oldApplicationCommand.edit({
						name: customCommand!,
						description: `Starts an application for ${position.name}`,
						type: 'CHAT_INPUT'
					})
				);
				if (error) {
					await interaction.editReply(
						await this.t(interaction, {
							context: 'failed',
							command: customCommand!
						})
					);
					return;
				}
				await interaction.editReply(
					await this.t(interaction, {
						context: 'changed',
						position: position.name,
						oldCommand: oldName,
						newCommand: newCommand!.name
					})
				);
				break;
			}

			case CustomCommandState.REMOVE_COMMAND: {
				// We don't catch errors here, because if this errors, there is an actual problem.
				await interaction.guild!.commands.delete(position.customcommand!);
				position.customcommand = null;
				await position.save();
				await interaction.editReply(
					await this.t(interaction, {
						context: 'removed',
						position: position.name
					})
				);
				break;
			}

			case CustomCommandState.NO_COMMAND_TO_REMOVE: {
				await interaction.editReply(
					await this.t(interaction, {
						context: 'nothing_to_remove',
						position: position.name
					})
				);
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
