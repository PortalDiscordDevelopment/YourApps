import { ApplyOptions } from "@sapphire/decorators";
import type { ChatInputCommand } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { dev, devGuild } from "../../config";
import { createSubcommandFileMapping } from "../../modules/utils/devUtils";

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
					chatInputRun: createSubcommandFileMapping("config-roles-review")
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
                                    .addRoleOption(
                                        roleOptionBuilder =>
                                            roleOptionBuilder
                                                .setName("role")
                                                .setDescription("The review role to add or remove")
                                    )
							)
					),
			{
				guildIds: dev ? [devGuild] : undefined
			}
		);
	}
}
