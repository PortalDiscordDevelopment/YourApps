import { ApplyOptions } from "@sapphire/decorators";
import {
	type ChatInputCommand,
	type CommandOptions,
	Command
} from "@sapphire/framework";
import { devGuild } from "../../config";
import { inspect } from "util";
import type { DevUtilsModule } from "../../modules/utils/devUtils";

@ApplyOptions<CommandOptions>({
	name: "eval",
	description: "A dev command"
})
export class PingCommand extends Command {
	get devUtilsModule() {
		const module = this.container.stores
			.get("modules")
			.get("dev-utils") as DevUtilsModule;

		Object.defineProperty(this, "devUtilsModule", {
			value: module,
			writable: false,
			configurable: false,
			enumerable: false
		});

		return module;
	}

	public override async chatInputRun(
		interaction: Command.ChatInputInteraction
	) {
		try {
			await interaction.reply({
				content: await this.devUtilsModule.haste(
					inspect(eval(interaction.options.getString("code", true)), true, 1)
				)
			});
		} catch (e) {
			await interaction.reply({
				content: await this.devUtilsModule.haste(
					e instanceof Error ? e.stack ?? e.message : `${e}`
				)
			});
			console.error(e);
		}
	}

	public override registerApplicationCommands(
		registry: ChatInputCommand.Registry
	) {
		registry.registerChatInputCommand(
			builder =>
				builder
					.setName("eval")
					.setDescription("A dev command")
					.addStringOption(optionBuilder =>
						optionBuilder
							.setName("code")
							.setDescription("The code to eval")
							.setRequired(true)
					),
			{
				guildIds: [devGuild]
			}
		);
	}
}
