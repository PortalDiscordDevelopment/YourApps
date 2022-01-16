import { BotListener } from '@lib/ext/BotListener';
import { ButtonInteraction, type Interaction } from 'discord.js';
import { AppButton, App } from '@lib/models';
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
			!interaction.isButton() ||
			!interaction.guildId ||
			!(interaction instanceof ButtonInteraction)
		)
			return;
		const appButton = await AppButton.findByPk(interaction.message.id);
		if (!appButton) return;
		const app = await App.findByPk(appButton.app);
		await ApplyCommand.startApplication(interaction, app!);
	}
}
