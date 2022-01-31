import {
	Message,
	MessageActionRow,
	MessageButton,
	MessageSelectMenu,
	SelectMenuInteraction,
	TextChannel
} from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App, AppButton } from '@lib/models';
import ConfigNewCommand from '../new';

export default class ConfigAppbuttonCreateCommand extends BotCommand {
	public constructor() {
		super('config-appbutton-create', {
			aliases: ['config-appbutton-create'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_CREATE_APPBUTTON'),
				usage: 'config appbutton create <role>',
				examples: ['config appbutton create']
			},
			category: 'admin',
			args: [
				{
					id: 'channel',
					type: 'textChannel'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { channel }: { channel?: TextChannel }) {
		if (!channel) {
			await message.util!.send(
				this.client.i18n.t('ARGS.PLEASE_GIVE', { type: 'text channel' })
			);
			return;
		}
		const prompt = await (
			this.handler.modules.get('config-new') as ConfigNewCommand
		).sendPromptSingle(message, {
			ids: {
				continueButtonId: `continueCreateAppbuttonMessage|0|${message.id}|${
					message.editedTimestamp ?? message.createdTimestamp
				}`,
				cancelButtonId: `cancelCreateAppbuttonMessage|0|${message.id}|${
					message.editedTimestamp ?? message.createdTimestamp
				}`
			},
			allowSkip: 'message content',
			description: this.client.i18n.t('COMMANDS.APPBUTTON_CREATE.GIVE_MESSAGE'),
			fieldName: this.client.i18n.t('GENERIC.CONTENT'),
			title: this.client.i18n.t('COMMANDS.APPBUTTON_CREATE.NEW'),
			process: m => ({
				success: true,
				processed: {
					user: m.content,
					data: m.content
				}
			})
		});
		if (prompt.cancelled) return;
		const content = prompt.result!;
		const ids = {
			selectId: `selectAppCreateAppbuttonMessage|1|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			continueButtonId: `continueCreateAppbuttonMessage|1|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			cancelButtonId: `cancelCreateAppbuttonMessage|1|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const apps = await App.findAll({
			attributes: ['id', 'name', 'description'],
			where: {
				guild: message.guild!.id
			}
		});
		const appMessage = await message.util!.send({
			content: this.client.i18n.t('COMMANDS.APPBUTTON_CREATE.SELECT_APP'),
			components: [
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId(ids.selectId)
						.setOptions(
							apps.map(a => ({
								label: a.name,
								value: a.id.toString(),
								description: a.description ?? undefined
							}))
						)
						.setMaxValues(apps.length >= 5 ? 5 : apps.length)
						.setMinValues(1)
				),
				new MessageActionRow().addComponents(
					new MessageButton()
						.setLabel(this.client.i18n.t('GENERIC.CONTINUE'))
						.setCustomId(ids.continueButtonId)
						.setStyle('SUCCESS')
						.setEmoji('✅'),
					new MessageButton()
						.setLabel(this.client.i18n.t('GENERIC.CANCEL'))
						.setCustomId(ids.cancelButtonId)
						.setStyle('DANGER')
						.setEmoji('❌')
				)
			]
		});
		const appInteraction = appMessage.createMessageComponentCollector({
			filter: i => i.customId == ids.selectId,
			componentType: 'SELECT_MENU',
			time: 300000
		});
		let selectedApps: App[] | null = null;
		appInteraction.on('collect', i => {
			i.deferUpdate();
			selectedApps = apps.filter(a =>
				(i as SelectMenuInteraction).values.includes(a.id.toString())
			)!;
		});
		for (;;) {
			const buttonInteraction = await appMessage.awaitMessageComponent({
				filter: i =>
					[ids.continueButtonId, ids.cancelButtonId].includes(i.customId),
				componentType: 'BUTTON',
				time: 300000
			});
			if (buttonInteraction.customId === ids.cancelButtonId) {
				await buttonInteraction.deferUpdate();
				await message.util!.reply(this.client.i18n.t('GENERIC.CANCELED'));
				return;
			}
			if (
				buttonInteraction.customId === ids.continueButtonId &&
				selectedApps === null
			) {
				await buttonInteraction.reply({
					content: this.client.i18n.t('ERRORS.NO_APP_SELECTED'),
					ephemeral: true
				});
				continue;
			}
			if (
				buttonInteraction.customId === ids.continueButtonId &&
				selectedApps !== null
			) {
				await buttonInteraction.deferUpdate();
				break;
			}
			return;
		}
		const { id: appbuttonId } = await channel.send({
			content,
			components: [
				new MessageActionRow().addComponents(
					(selectedApps as App[]).map(app =>
						new MessageButton()
							.setCustomId(`startAppButton|${app.id}`)
							.setLabel(app.name)
							.setStyle('PRIMARY')
					)
				)
			]
		});
		for (const app of selectedApps as App[]) {
			await AppButton.create({
				app: app.id,
				channel: channel.id,
				guild: message.guildId!,
				message: appbuttonId
			});
		}
	}
}
