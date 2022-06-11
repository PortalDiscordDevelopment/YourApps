import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction } from 'discord.js';
import { Position, Guild } from '../../lib/models';

@ApplyOptions<CommandOptions>({
	name: 'positions-create',
	description: 'Creates a new position in the current server.',
	preconditions: ['GuildOnly'],
	slashOptions: {
		options: [
			{
				name: 'name',
				description: 'The name of the new position',
				type: 'STRING',
				required: true
			}
		]
	}
})
export class PositionsCreateCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const { name }: { name: string } = this.parseArgs(interaction);
        await Guild.createIfNotExists(interaction.guildId!);
		const position = await Position.create({
			name,
			guild: interaction.guildId!,
			questions: [],
			closed: true
		});
		await interaction.editReply(
			await this.t(interaction, {
				id: position.id,
				name
			})
		);
	}
}
