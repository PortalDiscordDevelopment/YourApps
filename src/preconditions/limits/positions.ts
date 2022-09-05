import { ApplyOptions } from "@sapphire/decorators";
import { Precondition } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import type DatabaseModule from "src/modules/database.js";
import { ModuleInjection } from "src/modules/utils/devUtils.js";
import {
	PreconditionIdentifier,
	PremiumLimits,
	StandardLimits
} from "src/types.js";

@ApplyOptions<Precondition.Options>({
	name: "PositionsLimit"
})
@ModuleInjection({
	propertyName: "databaseModule",
	moduleName: "database"
})
export class PositionsLimitPrecondition extends Precondition {
	declare databaseModule: DatabaseModule;

	override async chatInputRun(interaction: CommandInteraction) {
		let guildModel = await this.databaseModule.client!.guild.findUnique({
			where: {
				id: BigInt(interaction.guildId!)
			},
			include: {
				positions: true
			}
		});
		if (!guildModel)
			guildModel = await this.databaseModule.client!.guild.create({
				data: {
					id: BigInt(interaction.guildId!)
				},
				include: {
					positions: true
				}
			});

		if (
			guildModel.positions.length >=
			(guildModel.legacyPremium
				? PremiumLimits.Positions
				: StandardLimits.Positions)
		) {
			return this.error({
				identifier: PreconditionIdentifier.PositionsLimit,
				message: "You cannot add any more positions, as you have hit the limit!"
			});
		} else return this.ok();
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		PositionsLimit: never;
	}
}
