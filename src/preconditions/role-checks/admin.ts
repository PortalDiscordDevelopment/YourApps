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
} from "src/modules/config/guild.js";
import { ModuleInjection } from "src/modules/utils/devUtils.js";
import { PreconditionIdentifier } from "../../types.js";

@ApplyOptions<Precondition.Options>({
	name: "AdminOnly"
})
@ModuleInjection("guild-config")
export class AdminCheck extends Precondition {
	declare guildConfig: GuildConfigModule;

	override async chatInputRun(interaction: CommandInteraction) {
		if (!interaction.guildId || !interaction.member) {
			this.container.logger.warn(
				"A DM command was checked in the admin role check precondition!"
			);
			// Send the normal GuildOnly error
			return this.error({
				identifier: Identifiers.PreconditionGuildOnly,
				message: "You cannot run this chat input command in DMs."
			});
		}
		const rolesConfigured = await this.guildConfig.getRolesForType(
			interaction.guildId,
			RoleConfigType.Admin
		);
		if (rolesConfigured === null) {
			return (interaction.member.permissions as Readonly<Permissions>).has(
				DefaultRolePermissions.Admin,
				true
			)
				? this.ok()
				: this.error({
						identifier: PreconditionIdentifier.NotAdmin,
						message:
							"You do not have the manage server permission that is required for this command."
				  });
		}
		return (interaction.member.roles as GuildMemberRoleManager).cache.hasAny(
			...rolesConfigured
		)
			? this.ok()
			: this.error({
					identifier: PreconditionIdentifier.NotAdmin,
					message:
						"You do not have any of the configured admin roles that are required for this command."
			  });
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		AdminOnly: never;
	}
}
