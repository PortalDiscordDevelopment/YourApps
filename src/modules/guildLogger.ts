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
	ADMIN_ROLE_ADD = "Admin role added:The role <@&{role}> was added to this server's admin roles.:#00FF00",
	ADMIN_ROLE_REMOVE = "Admin role removed:The role <@&{role}> was removed from this server's admin roles.:#FF0000",
	// Review
	REVIEW_ROLE_ADD = "Review role added:The role <@&{role}> was added to this server's review roles.:#00FF00",
	REVIEW_ROLE_REMOVE = "Review role removed:The role <@&{role}> was removed from this review's admin roles.:#FF0000",
	// Blacklist
	BLACKLIST_ROLE_ADD = "Blacklist role added:The role <@&{role}> was added to this server's blacklist roles.:#00FF00",
	BLACKLIST_ROLE_REMOVE = "Blacklist role removed:The role <@&{role}> was removed from this server's Blacklist roles.:#FF0000",

	// * Position state
	POSITION_CLOSE = "Position closed:The position {position} was closed.:#FF0000",
	POSITION_OPEN = "Position opened:The position {position} was opened.:#00FF00",

	// * Configured channels
	// Log channel
	LOG_CHANNEL_SET = "Log channel set:The server's log channel was set to <#channel>.:#00FF00",
	LOG_CHANNEL_REMOVE = "Log channel removed:The server's log channel was removed.:#FF0000",
	// Archive channel
	ARCHIVE_CHANNEL_SET = "Archive channel set:The server's archive channel was set to <#channel>.:#00FF00",
	ARCHIVE_CHANNEL_REMOVE = "Archive channel removed:The server's archive channel was removed.:#FF0000",
	// Submissions channel
	SUBMISSIONS_CHANNEL_SET = "Submissions channel set:The server's submissions channel was set to <#channel>.:#00FF00",
	SUBMISSIONS_CHANNEL_REMOVE = "Submissions channel removed:The server's submissions channel was removed.:#FF0000"
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

        const [embedTitle, embedDescription, embedColor] = type.split(":").map(p => {
			let result = p;
			for (const [key, value] of Object.entries(extraData)) {
				result = result.replaceAll(key, value)
			}
			return result;
		}) as [string, string, `#${string}`];
        await logChannel.send({
            embeds: [{
                title: embedTitle,
				description: embedDescription,
				color: embedColor,
				...(
					author === undefined
					? {}
					: {
						author: {
							name: author.tag,
							iconURL: author.displayAvatarURL()
						}
					}
				)
            }]
        })
	}
}
