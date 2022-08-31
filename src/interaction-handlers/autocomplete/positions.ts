import { ApplyOptions } from "@sapphire/decorators";
import {
	InteractionHandler,
	InteractionHandlerTypes
} from "@sapphire/framework";
import type { AutocompleteInteraction } from "discord.js";
import type DatabaseModule from "src/modules/database";
import { ModuleInjection } from "src/modules/utils/devUtils";

@ApplyOptions<InteractionHandler.Options>({
	name: "position-autocomplete",
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
@ModuleInjection("database")
export class PositionAutocomplete extends InteractionHandler {
	declare database: DatabaseModule;

	public override async run(
		interaction: AutocompleteInteraction,
		result: InteractionHandler.ParseResult<this>
	) {
		return interaction.respond(result);
	}

	override async parse(interaction: AutocompleteInteraction) {
		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name !== "position")
			this.container.logger.debug(
				`Skipping positions autocomplete for option ${focusedOption.name}`
			);

		const positions = await this.database.client!.position.findMany({
			where: {
				guildId: BigInt(interaction.guildId!)
			}
		});
		if (positions.length < 1) return this.none();
		else
			return this.some(
				positions.map(p => ({
					name: p.name,
					value: p.id.toString()
				}))
			);
	}
}
