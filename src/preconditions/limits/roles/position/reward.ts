import { ApplyOptions } from "@sapphire/decorators";
import { Command, Precondition } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import type DatabaseModule from "src/modules/database.js";
import { ModuleInjection } from "src/modules/utils/devUtils.js";
import {
	PreconditionIdentifier,
	PremiumLimits,
	StandardLimits
} from "src/types.js";

@ApplyOptions<Precondition.Options>({
	name: "RewardRoleLimit"
})
@ModuleInjection("database")
export class RewardRoleLimitPrecondition extends Precondition {
	declare database: DatabaseModule;

	override async chatInputRun(
		interaction: CommandInteraction,
		command: Command
	) {
		const positionModel = interaction.options.getPosition();
		if (positionModel === null) {
			this.container.logger.warn(
				`RewardRoleLimit precondition was run on command ${command.name}, however, the position option could not be found.`
			);
			return this.ok();
		}

		if (
			positionModel.rewardRoles.length >=
			(positionModel.guild.legacyPremium
				? PremiumLimits.Roles
				: StandardLimits.Roles)
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
		RewardRoleLimit: never;
	}
}
