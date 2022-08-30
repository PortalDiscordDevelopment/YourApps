import { ApplyOptions } from "@sapphire/decorators";
import { Precondition } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import { PreconditionIdentifier } from "src/types";

// Globally disallows both DM commands and non-cached guild commands
@ApplyOptions<Precondition.Options>({
	name: "inServer",
	position: 100
})
export class InServerPrecondition extends Precondition {
	override async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.inGuild())
			return this.error({
				identifier: PreconditionIdentifier.NotGuild,
				message: "YourApps commands can only be used in servers, not DMs."
			});
		if (interaction.inRawGuild())
			return this.error({
				identifier: PreconditionIdentifier.NotCached,
				message:
					"In order for commands to work, this server must be cached. Not being cached is most likely a result of this bot being invited as an application, rather than a bot user."
			});
		return this.ok();
	}
}
