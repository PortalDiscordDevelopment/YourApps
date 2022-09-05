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
	name: "ReviewRoleLimit"
})
@ModuleInjection("database")
export class ReviewRoleLimitPrecondition extends Precondition {
	declare database: DatabaseModule;

	override async chatInputRun(interaction: CommandInteraction) {
		const guildModel = await this.database.client!.guild.findUnique({
			where: {
				id: BigInt(interaction.guildId!)
			}
		});
		if (!guildModel) return this.ok();
		if (
			guildModel.reviewRoles.length >=
			(guildModel.legacyPremium ? PremiumLimits.Roles : StandardLimits.Roles)
		)
			return this.error({
				identifier: PreconditionIdentifier.RolesLimit,
				message:
					"You cannot add any more review roles, as you have hit the limit!"
			});
		else return this.ok();
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		ReviewRoleLimit: never;
	}
}
