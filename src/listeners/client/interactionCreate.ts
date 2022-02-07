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
		if (!app) return;
		if (
			(await interaction.user.send({}).catch(e => e.message)) ==
			'Cannot send messages to this user'
		) {
			await interaction.reply({
				content: await this.client.t('ERRORS.CANNOT_DM', interaction),
				ephemeral: true
			});
			return;
		}
		const member = await interaction.guild!.members.fetch(interaction.user.id);
		if (!app.requiredroles.every(r => member.roles.cache.has(r))) {
			await interaction.reply({
				content: await this.client.t('ERRORS.NO_REQUIRED_ROLES', interaction),
				ephemeral: true
			});
			return;
		}
		if (
			app.minjointime &&
			interaction.createdTimestamp - member.joinedTimestamp! < app.minjointime
		) {
			await interaction.reply({
				content: await this.client.t(
					'ERRORS.NOT_JOINED_LONG_ENOUGH',
					interaction
				),
				ephemeral: true
			});
			return;
		}
		if (app.closed) {
			await interaction.reply({
				content: await this.client.t('ERRORS.APP_CLOSED', interaction),
				ephemeral: true
			});
			return;
		}
		await ApplyCommand.startApplication(interaction, app!);
	}
}
