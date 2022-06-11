import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { Position } from '../../lib/models';
import { Op } from 'sequelize';

@ApplyOptions<CommandOptions>({
	name: 'config-positions-delete',
	description: 'Deletes a position in the current server.',
	preconditions: ['GuildOnly'],
	slashOptions: {
		options: [
			{
				name: 'name',
				description: 'The name of the position to delete',
				type: 'STRING',
				required: true,
				autocomplete: true
			}
		]
	}
})
export class PositionsDeleteCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const { name }: { name: string } = this.parseArgs(interaction);
		const position = await Position.findOne({
			where: {
				guild: interaction.guildId!,
				name
			}
		});
		if (!position)
			await interaction.editReply(
				await this.t(interaction, {
					context: 'not_found',
					name
				})
			);
		else {
			await position.destroy();
			await interaction.editReply(
				await this.t(interaction, {
					name,
					id: position.id
				})
			);
		}
	}

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
