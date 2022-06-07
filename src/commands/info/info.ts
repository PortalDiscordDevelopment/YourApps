import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction, Message } from 'discord.js';
import { Utils } from '../../lib/Utils';

@ApplyOptions<CommandOptions>({
	name: 'info',
	aliases: ['info', 'server'],
	description: 'Displays information about the bot',
	preconditions: [],
	slashOptions: { options: [] }
})
export class InfoCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const reply = (await interaction.fetchReply()) as Message;
		const users = await Utils.fetchUsers();
		await interaction.editReply({
			embeds: [
				{
					title: 'Bot information',
					fields: [
						await this.t(interaction, 'ping', {
							delay: reply.createdTimestamp - interaction.createdTimestamp,
							gateway: this.client.ws.ping,
							embedField: true
						}),
						await this.t(interaction, 'cache', {
							servers: interaction.client.guilds.cache.size,
							users: interaction.client.users.cache.size,
							embedField: true
						}),
						await this.t(interaction, 'contributors', {
							owners: users.owners.map(u => u.tag).join(', '),
							contributors: users.contributors.map(u => u.tag).join(', '),
							developers: users.developers.map(u => u.tag).join(', '),
							embedField: true
						}),
						await this.t(interaction, 'source_code', {
							embedField: true
						})
					]
				}
			]
		});
	}
}
