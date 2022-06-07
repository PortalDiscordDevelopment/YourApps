import { CommandOptions, container } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { BotCommand } from '../../lib/BotCommand';
import type { CommandInteraction } from 'discord.js';
import { User } from '../../lib/models';

@ApplyOptions<CommandOptions>({
	name: 'language',
	aliases: ['language', 'lang'],
	description: 'Sets your user language.',
	preconditions: [],
	slashOptions: { options: [{
        name: 'language',
        description: 'The language to set the bot to',
        choices: [...container.i18n.languages.keys()].map(lang => ({
            name: lang,
            value: lang
        })),
        type: 'STRING',
        required: true
    }] }
})
export class LanguageCommand extends BotCommand {
	override async chatInputRun(interaction: CommandInteraction) {
        const { language }: { language: string; } = this.parseArgs(interaction);
		await interaction.deferReply();
		const [userModel, created] = await User.findOrBuild({ 
            where: {
                id: interaction.user.id
            },
            defaults: {
                id: interaction.user.id,
                language
            }
        })
        await userModel.save();
		await interaction.editReply(
            await this.t(interaction, { language, context: created ? 'created' : 'updated' })
        );
	}
}
