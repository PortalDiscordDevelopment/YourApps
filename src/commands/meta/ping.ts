import { ApplyOptions } from "@sapphire/decorators";
import {
	type ChatInputCommand,
	type CommandOptions,
	Command
} from "@sapphire/framework";
import { Message } from "discord.js";
import { stripIndent } from "common-tags";
import { dev, devGuild } from "../../config/index.js";

@ApplyOptions<CommandOptions>({
	name: "ping",
	description: "Checks the bot's response time"
})
export class PingCommand extends Command {
	public override async chatInputRun(
		interaction: Command.ChatInputInteraction
	) {
		const msg = await interaction.reply({
			content: `Ping?`,
			ephemeral: false,
			fetchReply: true
		});

		const diff =
			(msg instanceof Message ? msg.createdTimestamp : Number(msg.timestamp)) -
			interaction.createdTimestamp;

		const ping = Math.round(this.container.client.ws.ping);
		return interaction.editReply(
			stripIndent`
                Pong!
                Response time: ${diff}ms.
                Heartbeat: ${ping}ms.
            `
		);
	}

	public override registerApplicationCommands(
		registry: ChatInputCommand.Registry
	) {
		registry.registerChatInputCommand(
			builder => builder.setName(this.name).setDescription(this.description),
			{
				guildIds: dev ? [devGuild] : undefined
			}
		);
	}
}
