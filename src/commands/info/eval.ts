import type { Args, CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction, Message } from 'discord.js';

@ApplyOptions<CommandOptions>({
	name: 'eval',
	aliases: ['eval'],
	description: 'Evaluates arbitrary JavaScript code',
	preconditions: ['DevOnly'],
	slashOptions: {
		options: [
			{
				name: 'code',
				description: 'The code to evaluate',
				type: 'STRING',
				required: true
			}
		]
	}
})
export class PingCommand extends BotCommand {
	override async messageRun(message: Message, args: Args) {
		console.log(await eval(await args.pick('string')));
		await message.reply('ok');
	}
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		console.log(await eval(this.parseArgs<{ code: string }>(interaction).code));
		await interaction.editReply('ok');
	}
}
