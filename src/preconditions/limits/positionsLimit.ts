import { ApplyOptions } from "@sapphire/decorators";
import { Precondition } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";

@ApplyOptions<Precondition.Options>({
	name: "PositionsLimit"
})
export class PositionsLimitPrecondition extends Precondition {
	override async chatInputRun(interaction: CommandInteraction) {
		
		return this.ok();
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		PositionsLimit: never;
	}
}
