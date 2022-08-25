import { ApplyOptions } from "@sapphire/decorators";
import type { Snowflake } from "discord.js";
import { type ModuleOptions, ModulePiece } from "../../structures/piece";
import type DatabaseModule from "../database";
import { ModuleInjection } from "../utils/devUtils";
import { Result } from "@sapphire/result";

export enum RoleConfigType {
	Review = "reviewRoles",
	Admin = "adminRoles",
	Blacklist = "blacklistRoles"
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

	public async checkIfRoleConfigured(
		guildId: Snowflake,
		roleId: Snowflake,
		roleType: RoleConfigType
	): Promise<boolean> {
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

		// Query the guild in the database
		const query = await this.databaseModule.client.guild.findUnique({
			where: {
				id: BigInt(guild.id)
			}
		});

		return query === null
			? false // If guild isn't found in the database, then the role cannot be configured
			: query[roleType].includes(BigInt(role.id)); // Otherwise, check if the role is included in the corresponding array
	}
}
