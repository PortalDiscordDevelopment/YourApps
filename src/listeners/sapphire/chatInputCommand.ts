import { ApplyOptions } from "@sapphire/decorators";
import { Command, Events, Listener } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";

@ApplyOptions<Listener.Options>({
	name: "chatInputCommandRun",
	event: Events.ChatInputCommandRun
})
export class ChatInputCommandDeniedListener extends Listener {
	override run(interaction: CommandInteraction, command: Command) {
		this.container.logger.info(
			`User ${interaction.user.tag} is running command ${command.name}`
		);
	}
}
