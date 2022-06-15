import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../../lib/BotCommand';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { Op } from 'sequelize';
import { Position } from '../../../lib/models';

@ApplyOptions<CommandOptions>({
	name: 'config-positions-close',
	description: 'Closes a position for submissions',
	preconditions: [],
	slashOptions: {
		options: [
			{
				name: 'position',
				description: 'The position to close',
				type: 'STRING',
				autocomplete: true,
				required: true
			}
		]
	},
	isSubCommand: true,
	subcommandName: 'close'
})
export class ConfigPositionsCloseCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		// await interaction.deferReply();
		// const { position: positionName }: { position: string } =
		// 	this.parseArgs(interaction);
		// const position = await Position.findOne({
		// 	where: {
		// 		guild: interaction.guildId!,
		// 		name: positionName
		// 	}
		// });
		// if (!position)
		// 	return interaction.editReply(
		// 		await this.t(interaction, 'errors:position_not_found', {
		// 			name: positionName
		// 		})
		// 	);
		// if (position.closed)
		// 	return interaction.editReply(
		// 		await this.t(interaction, {
		// 			context: 'already_closed',
		// 			position: positionName
		// 		})
		// 	);
		// position.closed = true;
		// await position.save();
		// return interaction.editReply(
		// 	await this.t(interaction, { position: positionName })
		// );
		this.client.logger.warn('close called')
        interaction;
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
