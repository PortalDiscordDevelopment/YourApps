import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";

@ApplyOptions<Command.Options>({
	name: "config-roles-review"
})
export class ConfigRolesReviewCommand extends Command {
	override async chatInputRun(interaction: CommandInteraction) {}
}
