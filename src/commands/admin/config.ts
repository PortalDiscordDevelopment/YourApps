import { ApplyOptions } from "@sapphire/decorators";
import type { ChatInputCommand } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import type { CommandInteraction } from "discord.js";
import { dev, devGuild } from "../../config";
import { GuildConfigModule, RoleConfigType } from "../../modules/config/guild";
import { ModuleInjection } from "../../modules/utils/devUtils";

// TODO Make role preconditions

@ApplyOptions<Subcommand.Options>({
	name: "config",
	description: "The root command for configuring a server",
	subcommands: [
		{
			name: "roles",
			type: "group",
			entries: [
				{
					name: "review",
					chatInputRun: 'configRolesReview',
					type: "method"
				}
			]
		}
	]
})
@ModuleInjection("guild-config")
export class ConfigCommand extends Subcommand {
	declare guildConfig: GuildConfigModule;

	async configRolesReview(interaction: CommandInteraction) {
		const role = interaction.options.getRole("role", true);
		const roleConfigured = await this.guildConfig.checkIfRoleConfigured(interaction.guildId!, role.id, RoleConfigType.Review)
		if (roleConfigured) {
			await this.guildConfig.removeRoleFromConfig(interaction.guildId!, role.id, RoleConfigType.Review);
			await interaction.reply(`Successfully removed role <@&${role.id}> from this server's review roles.`)
		} else {
			await this.guildConfig.addRoleToConfig(interaction.guildId!, role.id, RoleConfigType.Review);
			await interaction.reply(`Successfully added role <@&${role.id}> to this server's review roles.`)
		}
	}

	public override registerApplicationCommands(
		registry: ChatInputCommand.Registry
	) {
		registry.registerChatInputCommand(
			builder =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addSubcommandGroup(subcommandGroupBuilder =>
						subcommandGroupBuilder
							.setName("roles")
							.setDescription(
								"The subcommand group to modify guild role configurations (review, admin, and blacklist roles)"
							)
							.addSubcommand(subcommandBuilder =>
								subcommandBuilder
									.setName("review")
									.setDescription("Modifies the review roles of the server")
									.addRoleOption(roleOptionBuilder =>
										roleOptionBuilder
											.setName("role")
											.setDescription("The review role to add or remove (toggles)")
											.setRequired(true)
									)
							)
					),
			{
				guildIds: dev ? [devGuild] : undefined
			}
		);
	}
}
