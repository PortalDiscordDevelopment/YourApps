import { ApplyOptions } from "@sapphire/decorators";
import {
	type ChatInputCommand,
	type CommandOptions,
	Command
} from "@sapphire/framework";
import { devGuild } from "../../config";
import { inspect } from "util";
import { DevUtilsModule, ModuleInjection } from "../../modules/utils/devUtils";

@ApplyOptions<CommandOptions>({
	name: "eval",
	description: "A dev command"
})
@ModuleInjection({
	moduleName: "dev-utils",
	propertyName: "devUtilsModule"
})
export class EvalCommand extends Command {
	declare devUtilsModule: DevUtilsModule;

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
