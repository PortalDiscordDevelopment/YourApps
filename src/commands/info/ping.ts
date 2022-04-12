import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators'
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction, Message } from 'discord.js';
import { stripIndent } from 'common-tags';

@ApplyOptions<CommandOptions>({
	name: 'ping',
	aliases: ['ping', 'pong'],
	description: 'Gets the ping of the bot',
	preconditions: [],
	slashOptions: {
		options: []
	},
})
export class PingCommand extends BotCommand {
    override async chatInputRun(interaction: CommandInteraction) {
        await interaction.deferReply()
        const reply = await interaction.fetchReply() as Message;
        await interaction.editReply(stripIndent`
            Shard: 0
            Delay: ${reply.createdTimestamp - interaction.createdTimestamp}ms
            Gateway: ${interaction.client.ws.ping}ms
        `)
    }
}