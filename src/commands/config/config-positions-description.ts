import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { Op } from 'sequelize';
import { Position } from '../../lib/models';

@ApplyOptions<CommandOptions>({
	name: 'config-positions-description',
	description: 'Modifies the description of a position.',
	preconditions: [],
	slashOptions: {
		options: [
			{
				name: 'position',
				description: 'The position to modify the description of',
				type: 'STRING',
				autocomplete: true,
				required: true
			},
			{
				name: 'description',
				description: 'The new description of the position',
				type: 'STRING',
				required: true
			}
		]
	}
})
export class ConfigPositionsDescriptionCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const {
			position: positionName,
			description
		}: {
			position: string;
			description: string;
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
		position.description = description;
		await position.save();
		await interaction.editReply(
			await this.t(interaction, {
				name: positionName
			})
		);
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
