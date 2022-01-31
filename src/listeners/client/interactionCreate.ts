import { BotListener } from '@lib/ext/BotListener';
import { ButtonInteraction, type Interaction } from 'discord.js';
import { App } from '@lib/models';
import ApplyCommand from '../../commands/applications/apply';

export default class InteractionCreateListener extends BotListener {
	public constructor() {
		super('interactionCreate', {
			emitter: 'client',
			event: 'interactionCreate'
		});
	}
	public async exec(interaction: Interaction) {
		if (
			!(
				interaction.isButton() &&
				interaction.guildId &&
				interaction instanceof ButtonInteraction &&
				interaction.customId.startsWith('startAppButton')
			)
		)
			return;
		const app = await App.findByPk(Number(interaction.customId.split('|')[1]));
		await ApplyCommand.startApplication(interaction, app!);
	}
}
