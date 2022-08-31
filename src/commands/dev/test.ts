import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Command } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import { devGuild } from "src/config";

@ApplyOptions<Command.Options>({
	name: "test",
	description: "A test command",
	preconditions: ["PositionsLimit"]
})
export class TestCommand extends Command {
	public override chatInputRun(interaction: CommandInteraction) {
		interaction.reply(":+1:");
	}

	public override registerApplicationCommands(
		registry: ChatInputCommand.Registry
	) {
		registry.registerChatInputCommand(
			builder => builder.setName(this.name).setDescription(this.description),
			{
				guildIds: [devGuild]
			}
		);
	}
}
