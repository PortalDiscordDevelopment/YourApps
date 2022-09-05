import { ApplyOptions } from "@sapphire/decorators";
import {
	type ChatInputCommand,
	type CommandOptions,
	Command
} from "@sapphire/framework";
import { devGuild } from "../../config/main.js";
import { inspect } from "util";
import {
	DevUtilsModule,
	ModuleInjection
} from "../../modules/utils/devUtils.js";

@ApplyOptions<CommandOptions>({
	name: "eval",
	description: "A dev command"
})
@ModuleInjection("dev-utils")
export class EvalCommand extends Command {
	declare devUtils: DevUtilsModule;

	public override async chatInputRun(
		interaction: Command.ChatInputInteraction
	) {
		try {
			await interaction.reply({
				content: await this.devUtils.haste(
					inspect(
						await eval(interaction.options.getString("code", true)),
						true,
						1
					)
				)
			});
		} catch (e) {
			await interaction.reply({
				content: await this.devUtils.haste(
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
					.setName(this.name)
					.setDescription(this.description)
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
