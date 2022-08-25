import { ApplyOptions } from "@sapphire/decorators";
import type { ChatInputCommand } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { dev, devGuild } from "../../config";
import { makeCommandRedirect } from "../../modules/utils/devUtils";

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
					chatInputRun: makeCommandRedirect("config-roles-review"),
					type: "method"
				},
				{
					name: "admin",
					chatInputRun: makeCommandRedirect("config-roles-admin"),
					type: "method"
				},
				{
					name: "blacklist",
					chatInputRun: makeCommandRedirect("config-roles-blacklist"),
					type: "method"
				}
			]
		}
	]
})
export class ConfigCommand extends Subcommand {
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
											.setDescription(
												"The review role to add or remove (toggles)"
											)
											.setRequired(true)
									)
							)
							.addSubcommand(subcommandBuilder =>
								subcommandBuilder
									.setName("admin")
									.setDescription("Modifies the admin roles of the server")
									.addRoleOption(roleOptionBuilder =>
										roleOptionBuilder
											.setName("role")
											.setDescription(
												"The admin role to add or remove (toggles)"
											)
											.setRequired(true)
									)
							)
							.addSubcommand(subcommandBuilder =>
								subcommandBuilder
									.setName("blacklist")
									.setDescription("Modifies the blacklist roles of the server")
									.addRoleOption(roleOptionBuilder =>
										roleOptionBuilder
											.setName("role")
											.setDescription(
												"The blacklist role to add or remove (toggles)"
											)
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
