import { ApplyOptions } from "@sapphire/decorators";
import type { Snowflake } from "discord.js";
import { type ModuleOptions, ModulePiece } from "../../structures/piece";
import type DatabaseModule from "../database";
import { ModuleInjection } from "../utils/devUtils";
import { Result } from "@sapphire/result";

enum RoleConfigType {
	Review,
	Admin,
	Blacklist
}

@ApplyOptions<ModuleOptions>({
	name: "guild-config"
})
@ModuleInjection({
	moduleName: "database",
	propertyName: "databaseModule"
})
export class GuildConfigModule extends ModulePiece {
	public static RoleConfigType = RoleConfigType;

	declare databaseModule: DatabaseModule;

	public async addRoleToConfig(
		guildId: Snowflake,
		roleId: Snowflake,
		roleType: RoleConfigType
	) {
		if (this.databaseModule.client === null)
			throw new Error("Database client not initialized yet!");
		// Guild validation
		const guild = await Result.fromAsync(() =>
			this.container.client.guilds.fetch(guildId)
		).then(async result => result.unwrapOr(null));
		if (guild === null)
			throw new Error(
				"Invalid guild passed to GuildConfigModule#addRoleToConfig!"
			);

		// Role validation
		const role = await Result.fromAsync(() => guild.roles.fetch(roleId)).then(
			async result => result.unwrapOr(null)
		);
		if (role === null)
			throw new Error(
				"Invalid role passed to GuildConfigModule#addRoleToConfig!"
			);

		await this.databaseModule.client.guild.upsert({
			create: {
				id: BigInt(guild.id),
				reviewRoles:
					roleType == RoleConfigType.Review ? [BigInt(role.id)] : undefined,
				adminRoles:
					roleType == RoleConfigType.Admin ? [BigInt(role.id)] : undefined,
				blacklistRoles:
					roleType == RoleConfigType.Blacklist ? [BigInt(role.id)] : undefined
			},
			update: {
				reviewRoles:
					roleType == RoleConfigType.Review ? [BigInt(role.id)] : undefined,
				adminRoles:
					roleType == RoleConfigType.Admin ? [BigInt(role.id)] : undefined,
				blacklistRoles:
					roleType == RoleConfigType.Blacklist ? [BigInt(role.id)] : undefined
			},
			where: {
				id: BigInt(guild.id)
			}
		});
	}
}
