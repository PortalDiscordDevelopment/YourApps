import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Identifiers, Precondition } from "@sapphire/framework";
import { CommandInteraction, GuildMemberRoleManager, Permissions } from "discord.js";
import { DefaultRolePermissions, GuildConfigModule, RoleConfigType } from "src/modules/config/guild";
import { ModuleInjection } from "src/modules/utils/devUtils";

@ApplyOptions<Precondition.Options>({
    name: "ReviewersOnly"
})
@ModuleInjection("guild-config")
export class ReviewerCheck extends Precondition {
    declare guildConfig: GuildConfigModule;

    override async chatInputRun(interaction: CommandInteraction, command: ChatInputCommand, context: Precondition.Context) {
        if (!interaction.guildId || !interaction.member) {
            this.container.logger.warn("A DM command was checked in the reviewer role check precondition!");
            // Send the normal GuildOnly error
            return this.error({ identifier: Identifiers.PreconditionGuildOnly, message: 'You cannot run this chat input command in DMs.' })
        };
        const rolesConfigured = await this.guildConfig.getRolesForType(interaction.guildId, RoleConfigType.Review);
        if (rolesConfigured === null) {
            interaction.member.permissions instanceof Permissions ? interaction.member.permissions.has(DefaultRolePermissions.Admin, true) : interaction.member.permissions;
        }
        const hasRole = interaction.member.roles instanceof GuildMemberRoleManager ? interaction.member.roles.cache.hasAny(rolesConfigured)
    }
}

declare module '@sapphire/framework' {
    interface Preconditions {
      ReviewerOnly: never;
    }
  }