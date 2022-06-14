import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type {
	ApplicationCommandOptionChoiceData,
	AutocompleteInteraction,
	CommandInteraction
} from 'discord.js';
import {
	AppQuestionTypeNice,
	Position,
	PositionQuestionType
} from '../../lib/models';
import { Op } from 'sequelize';
import { DiscordFieldLimits, Utils } from '../../lib/Utils';

@ApplyOptions<CommandOptions>({
	name: 'config-positions-questions-add',
	description: 'Adds a question to an existing position',
	preconditions: ['GuildOnly'],
	slashOptions: {
		options: [
			{
				name: 'position',
				description: 'The position to add a question to',
				type: 'STRING',
				autocomplete: true,
				required: true
			},
			{
				name: 'question',
				description: 'The question to add to the position',
				required: true,
				type: 'STRING'
			},
			{
				name: 'type',
				description: 'The type of question to add',
				required: true,
				type: 'STRING',
				choices: [
					{
						name: AppQuestionTypeNice[PositionQuestionType.STRING],
						value: PositionQuestionType.STRING
					},
					{
						name: AppQuestionTypeNice[PositionQuestionType.NUMBER],
						value: PositionQuestionType.NUMBER
					}
				]
			},
			{
				name: 'index',
				description: 'The question to add the new question after',
				required: true,
				type: 'STRING',
				autocomplete: true
			}
		]
	}
})
export class Command extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const {
			position: positionName,
			type,
			question,
			index: indexRaw
		}: {
			position: string;
			type: PositionQuestionType;
			question: string;
			index: string;
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
		// Add question and save model to database
		position.questions = Utils.arrayInsert(position.questions, index, {
			question,
			type
		});
		await position.save();
		// Respond with success message
		return interaction.editReply(
			await this.t(interaction, { position: positionName })
		);
	}

	// Autocomplete positions based on a substring search, and index based on a substring search
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

			// Add first question response (-1)
			responses.push({
				name: 'Add as first question',
				value: '-1'
			});
			const search = interaction.options.getString('index', false);
			// Iterate over questions, adding a response for each one with the format `1 - Question content`, truncating as needed
			for (const index in position.questions) {
				// If there is an input and it is not a substring of this current iteration's question, don't add it as a response
				if (search && !position.questions[index].question.includes(search))
					continue;
				// Add the response, truncating the user-side name if needed
				responses.push({
					name: Utils.truncate(`${Number(index) + 1} - ${
						position.questions[index].question
					}`, DiscordFieldLimits.AUTOCOMPLETION_NAME),
					value: index
				});
			}
			// Respond with all the responses, excluding any past the 25th, as 25 is the discord enforced limit.
			await interaction.respond(responses.slice(0, 25));
		}
	}
}
