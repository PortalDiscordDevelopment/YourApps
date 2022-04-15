import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction } from 'discord.js';

@ApplyOptions<CommandOptions>({
	name: 'eval',
	aliases: ['eval'],
	description: 'Evaluates arbitrary JavaScript code',
	preconditions: ["DevOnly"],
	slashOptions: { options: [{
		name: 'code',
		description: 'The code to evaluate',
		type: 'STRING',
		required: true
	}] }
})
export class PingCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		console.log(await eval(this.parseArgs<{code: string}>(interaction).code));
		await interaction.editReply("ok")
	}
}
