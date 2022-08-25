import { ApplyOptions } from "@sapphire/decorators";
import { ChatInputCommand, Precondition } from "@sapphire/framework";
import type { CommandInteraction } from "discord.js";
import type { GuildConfigModule } from "src/modules/config/guild";
import { ModuleInjection } from "src/modules/utils/devUtils";

@ApplyOptions<Precondition.Options>({
    name: "ReviewersOnly"
})
@ModuleInjection("guild-config")
export class ReviewerCheck extends Precondition {
    declare guildConfig: GuildConfigModule;

    override async chatInputRun(interaction: CommandInteraction, command: ChatInputCommand, context: Precondition.Context) {
        if (!interaction.guildId) return this.error("Reviewer only commands cannot be run in DMs")
        const releConfigured = await this.guildConfig.checkIfRoleConfigured(interaction.guildId);
        interaction.member!.roles
    }
}