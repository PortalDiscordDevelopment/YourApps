import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import { GuildConfigModule, RoleConfigType } from "src/modules/config/guild";
import { ModuleInjection } from "src/modules/utils/devUtils";

// TODO Make role preconditions

@ApplyOptions<Command.Options>({
	name: "config-roles-blacklist"
})
@ModuleInjection("guild-config")
export class ConfigRoleBlacklistCommand extends Command {
	declare guildConfig: GuildConfigModule;

	override async chatInputRun(interaction: CommandInteraction) {
		const role = interaction.options.getRole("role", true);
		const roleConfigured = await this.guildConfig.checkIfRoleConfigured(
			interaction.guildId!,
			role.id,
			RoleConfigType.Blacklist
		);
		if (roleConfigured) {
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
