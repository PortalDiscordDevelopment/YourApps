import type { CommandOptions } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction } from 'discord.js';

@ApplyOptions<CommandOptions>({
	name: 'dump-slash-ids',
	description: 'Dumps all registered slash command ids in typescript format',
	preconditions: [],
	slashOptions: {
		options: [
			{
				type: 'BOOLEAN',
				name: 'guild',
				description:
					'Whether to dump commands for this guild or global commands',
				required: false
			}
		]
	}
})
export class Command extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const { guild }: { guild?: boolean } = this.parseArgs(interaction);
		const commands = await (guild
			? interaction.guild
			: this.client.application)!.commands.fetch({ force: true });
		await interaction.editReply(`
\`\`\`ts
export const slashHints: Record<string, \`\${bigint}\`> = {
${commands.map(c => `   '${c.name}': '${c.id}',`).join('\n')}
};
\`\`\`
		`);
	}
}
