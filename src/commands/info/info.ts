import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction, Message } from 'discord.js';
import { stripIndent } from 'common-tags';
import * as config from '../../options/config';

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
		await interaction.editReply({
			embeds: [
				{
					title: 'Bot information',
					fields: [
						{
							name: await this.t(interaction, 'ping.title'),
							value: await this.t(interaction, 'ping.body', {
								delay: reply.createdTimestamp - interaction.createdTimestamp,
								gateway: this.client.ws.ping
							}),
							inline: true
						},
						{
							name: 'Cache',
							value: stripIndent`
									Servers: ${interaction.client.guilds.cache.size}
									Users: ${interaction.client.users.cache.size}
								`,
							inline: true
						},
						{
							name: 'Contributors',
							value: stripIndent`
									Owners: ${await Promise.all(
										config.owners.map(id => interaction.client.users.fetch(id))
									).then(us => us.map(u => u.tag))}
									Developers: ${await Promise.all(
										config.developers.map(id =>
											interaction.client.users.fetch(id)
										)
									).then(us => us.map(u => u.tag))}
									Contributors: None yet :(
								`,
							inline: true
						},
						{
							name: 'Source Code',
							value: stripIndent`
									Language: [TypeScript](https://www.typescriptlang.org/)
									Library: [discord.js](https://discord.js.org)
									Framework: [sapphire@next](https://www.sapphirejs.dev/)
									Source code: [link](https://github.com/PortalDiscordDevelopment/YourApps_JS)
									Software license: [Non-Profit Open Software License 3.0](https://opensource.org/licenses/NPOSL-3.0)
								`,
							inline: true
						}
					]
				}
			]
		});
	}
}
