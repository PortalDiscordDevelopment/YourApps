import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { AppQuestionTypeNice, Position } from '../../lib/models';
import { Op } from 'sequelize';
import { DiscordFieldLimits, Utils } from '../../lib/Utils';

@ApplyOptions<CommandOptions>({
	name: 'questions',
	description: 'Displays all of the questions for a position',
	preconditions: ['GuildOnly'],
	slashOptions: {
		options: [
			{
				name: 'position',
				description: 'The position to display the questions for',
				type: 'STRING',
				required: true,
				autocomplete: true
			}
		]
	}
})
export class QuestionsCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const { position: positionName }: { position: string } =
			this.parseArgs(interaction);
		const position = await Position.findOne({
			where: {
				guild: interaction.guildId!,
				name: positionName
			}
		});
		if (!position)
			return interaction.editReply(
				await this.t(interaction, 'errors:position_not_found', {
					name: positionName
				})
			);
		if (position.questions.length >= 1) return interaction.editReply({
			embeds: [
				{
					title: await this.t(interaction, 'embed_title'),
					fields: await Promise.all(
                        position.questions.map(async q => ({
                            name: Utils.truncate(
                                `${position.questions.indexOf(q) + 1}. ${q.question}`,
                                DiscordFieldLimits.FIELD_NAME
                            ),
                            value: await this.t(interaction, 'question_type', { type: AppQuestionTypeNice[q.type] }),
                            inline: true
                        }))
                    )
				}
			]
		});
        else return interaction.editReply(
            await this.t(interaction, 'no_questions', {
                position: positionName
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
