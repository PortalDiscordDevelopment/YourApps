import { ApplyOptions } from "@sapphire/decorators";
import { Identifiers, Precondition } from "@sapphire/framework";
import type {
	CommandInteraction,
	GuildMemberRoleManager,
	Permissions
} from "discord.js";
import {
	DefaultRolePermissions,
	GuildConfigModule,
	RoleConfigType
} from "src/modules/config/guild";
import { ModuleInjection } from "src/modules/utils/devUtils";
import { PreconditionIdentifier } from ".";

@ApplyOptions<Precondition.Options>({
	name: "ReviewersOnly"
})
@ModuleInjection("guild-config")
export class ReviewerCheck extends Precondition {
	declare guildConfig: GuildConfigModule;

	override async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.guildId || !interaction.member) {
			this.container.logger.warn(
				"A DM command was checked in the reviewer role check precondition!"
			);
			// Send the normal GuildOnly error
			return this.error({
				identifier: Identifiers.PreconditionGuildOnly,
				message: "You cannot run this chat input command in DMs."
			});
		}
		const rolesConfigured = await this.guildConfig.getRolesForType(
			interaction.guildId,
			RoleConfigType.Review
		);
		if (rolesConfigured === null) {
			return (interaction.member.permissions as Readonly<Permissions>).has(
				DefaultRolePermissions.Admin,
				true
			)
				? this.ok()
				: this.error({
						identifier: PreconditionIdentifier.NotReviewer,
						message:
							"You do not have the manage roles permission that is required for this command."
				  });
		}
		return (interaction.member.roles as GuildMemberRoleManager).cache.hasAny(
			...rolesConfigured
		)
			? this.ok()
			: this.error({
					identifier: PreconditionIdentifier.NotReviewer,
					message:
						"You do not have any of the configured review roles that are required for this command."
			  });
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		ReviewerOnly: never;
	}
}
