import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction } from 'discord.js';
import { Position } from '../../lib/models';
import { Emojis } from '../../lib/Emojis';

@ApplyOptions<CommandOptions>({
	name: 'positions',
	aliases: ['positions', 'pos'],
	description: 'Lists all the positions of the current server',
	preconditions: ['GuildOnly'],
	slashOptions: { options: [] }
})
export class PositionsCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const positions = await Position.findAll({
			where: {
				guild: interaction.guildId!
			}
		});
		await interaction.editReply({
			embeds: [
				{
					title: await this.t(interaction, {
						context: 'title',
						guild: interaction.guild!.name
					}),
					description:
						positions.length > 0
							? positions
									.map(
										p =>
											`- ${
												p.closed ? Emojis.RED_CROSS : Emojis.GREEN_CHECKMARK
											} \`${p.name}\``
									)
									.join('\n')
							: await this.t(interaction, { context: 'no_positions' })
				}
			]
		});
	}
}
