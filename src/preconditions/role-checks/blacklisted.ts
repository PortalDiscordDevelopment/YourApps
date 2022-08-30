import { ApplyOptions } from "@sapphire/decorators";
import { Identifiers, Precondition } from "@sapphire/framework";
import type { CommandInteraction, GuildMemberRoleManager } from "discord.js";
import { GuildConfigModule, RoleConfigType } from "src/modules/config/guild";
import { ModuleInjection } from "src/modules/utils/devUtils";
import { PreconditionIdentifier } from "../../types";

@ApplyOptions<Precondition.Options>({
	name: "Blacklisted"
})
@ModuleInjection("guild-config")
export class BlacklistedCheck extends Precondition {
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
			RoleConfigType.Blacklist
		);
		if (rolesConfigured === null) return this.ok();
		return (interaction.member.roles as GuildMemberRoleManager).cache.hasAny(
			...rolesConfigured
		)
			? this.error({
					identifier: PreconditionIdentifier.Blacklisted,
					message:
						"You have a role that blacklists you from running this command."
			  })
			: this.ok();
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		Blacklisted: never;
	}
}
