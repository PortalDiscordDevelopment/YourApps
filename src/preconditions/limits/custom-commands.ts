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
	name: "CustomCommandsLimit"
})
@ModuleInjection({
	propertyName: "databaseModule",
	moduleName: "database"
})
export class CustomCommandsLimitPrecondition extends Precondition {
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
			guildModel.positions.flatMap(p => p.customCommandId ?? []).length >=
			(guildModel.legacyPremium
				? PremiumLimits.CustomCommands
				: StandardLimits.CustomCommands)
		) {
			return this.error({
				identifier: PreconditionIdentifier.CustomCommandsLimit,
				message:
					"You cannot add any more custom commands for this server, as you have hit the limit!"
			});
		} else return this.ok();
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		CustomCommandsLimit: never;
	}
}
