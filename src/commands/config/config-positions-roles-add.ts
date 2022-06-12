import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type {
	AutocompleteInteraction,
	CommandInteraction,
	Role
} from 'discord.js';
import { Op } from 'sequelize';
import { Position } from '../../lib/models';

@ApplyOptions<CommandOptions>({
	name: 'config-positions-roles-add',
	description:
		'Adds a role to the list of reward, remove, or required roles for a position',
	preconditions: [],
	slashOptions: {
		options: [
			{
				name: 'position',
				description: 'The position to add the role to',
				type: 'STRING',
				autocomplete: true,
				required: true
			},
			{
				name: 'role',
				description: 'The reward role to add',
				type: 'ROLE',
				required: true
			},
			{
				name: 'type',
				description: 'The type of role to add',
				type: 'STRING',
				choices: [
					{
						name: 'Reward roles',
						value: 'rewardroles'
					},
					{
						name: 'Required roles',
						value: 'requiredroles'
					},
					{
						name: 'Remove roles',
						value: 'removeroles'
					}
				],
				required: true
			}
		]
	}
})
export class ConfigPositionsRolesAddCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const {
			position: positionName,
			role,
			type
		}: {
			position: string;
			role: Role;
			type: `${'reward' | 'required' | 'remove'}roles`;
		} = this.parseArgs(interaction);
		const position = await Position.findOne({
			where: {
				guild: interaction.guildId!,
				name: positionName
			}
		});
		if (!position) {
			await interaction.editReply(
				await this.t(interaction, {
					context: 'position_not_found',
					name: positionName
				})
			);
			return;
		}
		if (position[type].includes(role.id)) {
			await interaction.editReply(
				await this.t(interaction, {
					context: 'already_added',
					role: role.name,
					type: type.substring(0, type.length - 5) // Removes "roles" (the last 5 chars) from the string
				})
			);
			return;
		}
		position[type].push(role.id);
		position.changed(type, true); // Mark field changed, as sequelize doesn't notice array changes for some reason
		await position.save();
		await interaction.editReply(
			await this.t(interaction, {
				role: role.id,
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
