import type { Guild as GuildModel, Position } from "@prisma/client";
import { ApplyOptions } from "@sapphire/decorators";
import { Precondition } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import type DatabaseModule from "src/modules/database.js";
import { ModuleInjection } from "src/modules/utils/devUtils.js";
import { PreconditionIdentifier } from "src/types.js";

// Globally disallows both DM commands and non-cached guild commands
@ApplyOptions<Precondition.Options>({
	name: "position-validation",
	position: 75
})
@ModuleInjection("database")
export class PositionValidationPrecondition extends Precondition {
	declare database: DatabaseModule;

	override async chatInputRun(interaction: CommandInteraction) {
		// Add a utility function to get the position argument on the interaction
		let positionModel:
			| (Position & {
					guild: GuildModel;
			  })
			| null = null;

		interaction.options.getPosition = () => {
			return positionModel;
		};

		// Actually validate the option
		const positionOption = interaction.options.getInteger("position", false);
		if (positionOption === null) return this.ok();

		positionModel = await this.database.client!.position.findFirst({
			where: {
				id: positionOption,
				guildId: BigInt(interaction.guildId!)
			},
			include: {
				guild: true
			}
		});

		if (!positionModel)
			return this.error({
				identifier: PreconditionIdentifier.PositionsValidation,
				message:
					"The position ID you gave was invalid. This is likely because you manually entered in a number instead of using autocomplete. Either check your ID, or use the autocomplete instead."
			});
		else return this.ok();
	}
}

declare module "discord.js" {
	interface CommandInteractionOptionResolver {
		/**
		 * Gets an already-validated position argument from the option name
		 */
		getPosition():
			| (Position & {
					guild: GuildModel;
			  })
			| null;
	}
}
