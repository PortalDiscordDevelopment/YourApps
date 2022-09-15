import { ApplyOptions } from "@sapphire/decorators";
import type { Guild, User } from "discord.js";
import { ModuleOptions, ModulePiece } from "src/structures/modules/piece.js";
import type DatabaseModule from "./database.js";
import { ModuleInjection } from "./utils/devUtils.js";

/**
 * The guild config log types. The format is `title:body:hex` and variables can be included surrounded by curly braces like so: `title:body {variable} body2:hex`.
 */
export enum GuildConfigLogType {
	// * Configured roles
	// Admin
	ADMIN_ROLE_ADD,
	ADMIN_ROLE_REMOVE,
	// Review
	REVIEW_ROLE_ADD,
	REVIEW_ROLE_REMOVE,
	// Blacklist
	BLACKLIST_ROLE_ADD,
	BLACKLIST_ROLE_REMOVE,

	// * Position state
	POSITION_CLOSE,
	POSITION_OPEN,

	// * Configured channels
	// Log channel
	LOG_CHANNEL_SET,
	LOG_CHANNEL_REMOVE,
	// Archive channel
	ARCHIVE_CHANNEL_SET,
	ARCHIVE_CHANNEL_REMOVE,
	// Submissions channel
	SUBMISSIONS_CHANNEL_SET,
	SUBMISSIONS_CHANNEL_REMOVE
}

@ApplyOptions<ModuleOptions>({
	name: "guild-logger"
})
@ModuleInjection({
	moduleName: "database",
	propertyName: "databaseModule"
})
export class GuildLoggerModule extends ModulePiece {
	declare database: DatabaseModule;

	/**
	 * Logs a configuration event to a guild's configured log channel.
	 * @param type The type of config event to log
	 * @param guild The guild to log the event to
	 * @param extraData Extra data to include in the logged message
	 * @param author The (optional) author of this event, to include in the embed
	 */
	public async logGuildConfigEvent(
		type: GuildConfigLogType,
		guild: Guild,
		extraData: Record<string, string>,
		author?: User
	): Promise<void> {
		if (this.database.client === null)
			throw new Error("Database client not initialized yet!");

        // Fetch the database entry for this guild
		const guildModel = await this.database.client.guild.findUnique({
			where: {
				id: BigInt(guild.id)
			}
		});
        // If there is no entry, or the entry does not contain a log channel, ignore the event
		if (!guildModel || !guildModel.logChannel) return;

        // Fetch the channel specified in the database
		const logChannel = await guild.channels.fetch(
			guildModel.logChannel.toString()
		);
        // If the channel does not exist, or isn't a text channel, ignore the event
		if (!logChannel || !logChannel.isText()) return;

        const [embedTitle, embedDescription, embedColor] = type.split(":");
        await logChannel.send({
            embeds: [{
                title: 
            }]
        })
	}
}
