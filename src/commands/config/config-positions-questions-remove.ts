import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type {
	ApplicationCommandOptionChoiceData,
	AutocompleteInteraction,
	CommandInteraction
} from 'discord.js';
import { Op } from 'sequelize';
import { Position } from '../../lib/models';

@ApplyOptions<CommandOptions>({
    /*
     * This is called `del` and not `remove` because if I do remove, the command is 33 characters, and the discord limit is 32.
     * Once sapphire releases subcommand support for slash commands, this will be fixed, but for now this is the only solution.
     * 
     * Thanks discord.
     */
	name: 'config-positions-questions-del',
	description: 'Removes a question from an existing position',
	preconditions: [],
	slashOptions: {
		options: [
			{
				name: 'position',
				description: 'The position to remove a question from',
				type: 'STRING',
				autocomplete: true,
				required: true
			},
			{
				name: 'question',
				description: 'The question to remove',
				type: 'STRING',
                autocomplete: true,
                required: true
			}
		]
	}
})
export class ConfigPositionsQuestionsRemoveCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const {
			position: positionName,
			question: indexRaw
		}: {
			position: string;
			question: string;
		} = await this.parseArgs(interaction);
		// Convert (string) index to a number
		const index = Number(indexRaw);
		// Check if index is NaN (meaning a non-number was entered)
		if (isNaN(index))
			return interaction.editReply(
				await this.t(interaction, { context: 'invalid_index_type' })
			);
		const position = await Position.findOne({
			where: {
				name: positionName
			}
		});
		if (!position)
			return interaction.editReply(
				await this.t(interaction, 'errors:position_not_found', {
					name: positionName
				})
			);
		// Check if index is a valid index in the context of this position
		if (index != -1 && !(index in position.questions))
			return interaction.editReply(
				await this.t(interaction, { context: 'invalid_index' })
			);
		position.questions.splice(index, 1);
		position.changed('questions', true);
		await position.save();
		return interaction.editReply(
			await this.t(interaction, { position: positionName })
		);
	}

	// Autocomplete positions based on a substring search, and question based on a substring search
	override async autocompleteRun(interaction: AutocompleteInteraction) {
		if (interaction.options.get('position', false)?.focused) {
			// Position option is focused, send autocomplete for positions
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
		} else {
			// Index option is focused, send autocomplete for questions
			if (!interaction.options.getString('position', false))
				return interaction.respond([]);
			const position = await Position.findOne({
				where: {
					name: interaction.options.getString('position', true)
				}
			});
			if (!position) return interaction.respond([]);
			// Enumerate over questions and construct autocomplete responses
			const responses: ApplicationCommandOptionChoiceData[] = [];

			const search = interaction.options.getString('question', false);
			// Iterate over questions, adding a response for each one with the format `1 - Question content`, truncating as needed
			for (const index in position.questions) {
				// If there is an input and it is not a substring of this current iteration's question, don't add it as a response
				if (search && !position.questions[index].question.includes(search))
					continue;
				// Calculate the user-side name for this question
				const question = position.questions[index].question;
				// Add the response, truncating the user-side name if needed
				responses.push({
					name:
						question.length > 100
							? question.substring(0, 97) + '...'
							: question,
					value: index
				});
			}
			// Respond with all the responses, excluding any past the 25th, as 25 is the discord enforced limit.
			await interaction.respond(responses.slice(0, 25));
		}
	}
}
