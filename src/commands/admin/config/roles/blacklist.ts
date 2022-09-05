import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import { GuildConfigModule, RoleConfigType } from "src/modules/config/guild.js";
import { ModuleInjection } from "src/modules/utils/devUtils.js";

// TODO Make role preconditions

@ApplyOptions<Command.Options>({
	name: "config-roles-blacklist",
	preconditions: ["BlacklistRoleLimit"]
})
@ModuleInjection("guild-config")
export class ConfigRoleBlacklistCommand extends Command {
	declare guildConfig: GuildConfigModule;

	override async chatInputRun(interaction: CommandInteraction) {
		const role = interaction.options.getRole("role", true);
		const guildBlacklistRoles = await this.guildConfig.getRolesForType(
			interaction.guildId!,
			RoleConfigType.Blacklist
		);
		if (guildBlacklistRoles !== null && guildBlacklistRoles.includes(role.id)) {
			await this.guildConfig.removeRoleFromConfig(
				interaction.guildId!,
				role.id,
				RoleConfigType.Blacklist
			);
			await interaction.reply(
				`Successfully removed role <@&${role.id}> from this server's blacklist roles.`
			);
		} else {
			await this.guildConfig.addRoleToConfig(
				interaction.guildId!,
				role.id,
				RoleConfigType.Blacklist
			);
			await interaction.reply(
				`Successfully added role <@&${role.id}> to this server's blacklist roles.`
			);
		}
	}
}
