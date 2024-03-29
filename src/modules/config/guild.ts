import { ApplyOptions } from "@sapphire/decorators";
import type { Snowflake } from "discord.js";
import {
	type ModuleOptions,
	ModulePiece
} from "../../structures/modules/piece.js";
import type DatabaseModule from "../database.js";
import { ModuleInjection } from "../utils/devUtils.js";
import { Result } from "@sapphire/result";

export enum RoleConfigType {
	Review = "reviewRoles",
	Admin = "adminRoles",
	Blacklist = "blacklistRoles"
}

export enum DefaultRolePermissions {
	Review = "MANAGE_ROLES",
	Admin = "MANAGE_GUILD"
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

		const original = await this.databaseModule.client.guild.findUnique({
			where: {
				id: BigInt(guild.id)
			}
		});

		await this.databaseModule.client.guild.upsert({
			create: {
				id: BigInt(guild.id),
				[roleType]: [BigInt(role.id)]
			},
			update: {
				[roleType]: [BigInt(role.id), ...original![roleType]]
			},
			where: {
				id: BigInt(guild.id)
			}
		});
	}

	public async removeRoleFromConfig(
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
				"Invalid guild passed to GuildConfigModule#removeRoleFromConfig!"
			);

		// Role validation
		const role = await Result.fromAsync(() => guild.roles.fetch(roleId)).then(
			async result => result.unwrapOr(null)
		);
		if (role === null)
			throw new Error(
				"Invalid role passed to GuildConfigModule#removeRoleFromConfig!"
			);

		const original = await this.databaseModule.client.guild.findUnique({
			where: {
				id: BigInt(guild.id)
			}
		});
		if (!original)
			throw new Error(
				"Could not find a guild database entry to remove a role config from"
			);

		const newData = {
			...original,
			[roleType]: original[roleType].filter(r => r !== BigInt(role.id))
		};

		await this.databaseModule.client.guild.update({
			where: {
				id: original.id
			},
			data: newData
		});
	}

	/**
	 * Checks if a given user has one of the configured roles for a specific type in a given guild.
	 * Will also return `null` if no roles are configured in the given guild.
	 *
	 * @param guildId The ID of the guild to check in
	 * @param userId The ID of the user to check the roles for
	 * @param roleType The type of role to check fo in the user
	 * @returns A boolean stating whether or not the user has the role type or not (or null if the server doesn't have any configured roles for the given type)
	 */
	public async getRolesForType(
		guildId: string,
		roleType: RoleConfigType
	): Promise<string[] | null> {
		// Ensure database is connected
		if (this.databaseModule.client === null)
			throw new Error("Database client not initialized yet!");

		// Fetch guild from database to get the roles
		const databaseGuild = await this.databaseModule.client.guild.findUnique({
			where: {
				id: BigInt(guildId)
			}
		});

		if (databaseGuild === null) return null; // If there is no guild in the first place, return null to signal they neither have the role or don't have it
		if (databaseGuild[roleType].length < 1) return null; // If there are no configured roles, return null because of the same as above

		// Lastly, filter the configured roles for ones that the member has, and if they have at least 1, return true to say that they do have the role
		return databaseGuild[roleType].map(id => id.toString());
	}
}
