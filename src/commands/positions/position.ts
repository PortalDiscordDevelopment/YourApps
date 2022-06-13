import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js';
import { Op } from 'sequelize';
import { Position } from '../../lib/models';

@ApplyOptions<CommandOptions>({
	name: 'position',
	description: 'Displays specific information about a position',
	preconditions: ['GuildOnly'],
	slashOptions: {
		options: [
			{
				name: 'name',
				description: 'The name of the position to display info about',
				required: true,
				autocomplete: true,
				type: 'STRING'
			}
		]
	}
})
export class PositionCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const { name }: { name: string } = this.parseArgs(interaction);
		const position = await Position.findOne({
			where: {
				guild: interaction.guildId!,
				name
			}
		});
		if (!position) {
			await interaction.editReply(
				await this.t(interaction, 'errors:position_not_found', {
					name
				})
			);
			return;
		}

		const lang = {
			open: await this.t(interaction, 'open'),
			closed: await this.t(interaction, 'closed'),
			noneSet: await this.t(interaction, 'none_set'),
			fields: (await this.t(interaction, 'field_titles', {
				returnObjects: true
			})) as unknown as typeof import('../../languages/en-US/commands/position.json')['field_titles'] // TODO Add actual overloads for { returnObjects: true }
		};

		const roles = {
			reward:
				position.rewardroles.length >= 1
					? position.rewardroles.map(id => `- <@&${id}>`).join('\n')
					: lang.noneSet,
			required:
				position.requiredroles.length >= 1
					? position.requiredroles.map(id => `- <@&${id}>`).join('\n')
					: lang.noneSet,
			remove:
				position.removeroles.length >= 1
					? position.removeroles.map(id => `- <@&${id}>`).join('\n')
					: lang.noneSet
		};

		await interaction.editReply({
			embeds: [
				{
					title: await this.t(interaction, 'embed_title'),
					fields: [
						{
							name: lang.fields.name,
							value: position.name,
							inline: true
						},
						{
							name: lang.fields.description,
							value: position.description ?? lang.noneSet,
							inline: true
						},
						{
							name: lang.fields.question_count,
							value: position.questions.length.toString(),
							inline: true
						},
						{
							name: lang.fields.reward_roles,
							value: roles.reward,
							inline: true
						},
						{
							name: lang.fields.required_roles,
							value: roles.required,
							inline: true
						},
						{
							name: lang.fields.remove_roles,
							value: roles.remove,
							inline: true
						},
						{
							name: lang.fields.custom_command,
							value: position.customcommand
								? await interaction
										.guild!.commands.fetch(position.customcommand)
										.then(cmd => `/${cmd.name}`)
								: lang.noneSet,
							inline: true
						},
						{
							name: lang.fields.status,
							value: position.closed ? lang.closed : lang.open,
							inline: true
						},
						{
							name: lang.fields.cooldown,
							value: position.cooldown
								? await this.t(interaction, 'duration_minutes', {
										duration: position.cooldown / 60000 // Converts the milliseconds to minutes
								  })
								: lang.noneSet,
							inline: true
						},
						{
							name: lang.fields.min_join_time,
							value: position.minjointime
								? await this.t(interaction, 'duration_minutes', {
										duration: position.minjointime / 60000 // Converts the milliseconds to minutes
								  })
								: lang.noneSet,
							inline: true
						}
					]
				}
			]
		});
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
