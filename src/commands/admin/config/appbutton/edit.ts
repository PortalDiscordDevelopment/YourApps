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
import { CustomArgType, InvalidArgError } from '@lib/ext/BotClient';
import ConfigNewCommand from '../new';

export default class ConfigAppbuttonEditCommand extends BotCommand {
	public constructor() {
		super('config-appbutton-edit', {
			aliases: ['config-appbutton-edit'],
			description: {
				content: () =>
					this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_APPBUTTON_EDIT'),
				usage: 'config appbutton edit <ID>',
				examples: ['config appbutton edit 939983044088045610']
			},
			category: 'admin',
			args: [
				{
					id: 'appbuttons',
					type: 'appbutton'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(
		message: Message,
		{ appbuttons }: { appbuttons: CustomArgType<AppButton[]> }
	) {
		if (appbuttons instanceof InvalidArgError) {
			await message.util!.reply(
				await this.client.t('ARGS.PLEASE_GIVE_VALID', message, {
					type: 'appbutton'
				})
			);
			return;
		}
		if (appbuttons === null) {
			await message.util!.reply(
				await this.client.t('ARGS.PLEASE_GIVE', message, { type: 'appbutton' })
			);
			return;
		}
		const ids = {
			contentButtonId: `continueAppbuttonEditContent|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			appsButtonId: `continueAppbuttonEditApps|0|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const partMessage = await message.util!.reply({
			content: await this.client.t('COMMANDS.APPBUTTON_EDIT.PART', message),
			components: [
				new MessageActionRow().addComponents(
					new MessageButton()
						.setCustomId(ids.contentButtonId)
						.setEmoji('💬')
						.setLabel(await this.client.t('GENERIC.CONTENT', message))
						.setStyle('SUCCESS'),
					new MessageButton()
						.setCustomId(ids.appsButtonId)
						.setEmoji('📝')
						.setLabel(await this.client.t('GENERIC.APPS', message))
						.setStyle('PRIMARY')
				)
			]
		});
		const part = await partMessage.awaitMessageComponent({
			componentType: 'BUTTON',
			filter: i =>
				i.user.id === message.author.id &&
				Object.values(ids).includes(i.customId),
			time: 300000
		});
		const configNewCommand = this.handler.modules.get(
			'config-new'
		) as ConfigNewCommand;
		const channel = (await this.client.channels.fetch(
			appbuttons[0].channel
		)) as TextChannel;
		const m = await channel.messages.fetch(appbuttons[0].message);
		await part.deferUpdate();
		switch (part.customId) {
			case ids.contentButtonId: {
				const newContent = await configNewCommand.sendPromptSingle(message, {
					ids: {
						continueButtonId: `continueAppbuttonEdit|1|${message.id}|${
							message.editedTimestamp ?? message.createdTimestamp
						}`,
						cancelButtonId: `cancelAppbuttonEdit|1|${message.id}|${
							message.editedTimestamp ?? message.createdTimestamp
						}`
					},
					allowSkip: await this.client
						.t('GENERIC.CONTENT', message)
						.then(t => t.toLowerCase()),
					description: await this.client.t(
						'COMMANDS.APPBUTTON_EDIT.CONTENT_DESCRIPTION',
						message
					),
					fieldName: await this.client.t('GENERIC.CONTENT', message),
					process: m => ({
						success: true,
						processed: {
							user: m.content,
							data: m.content
						}
					}),
					title: await this.client.t(
						'COMMANDS.APPBUTTON_EDIT.CONTENT_TITLE',
						message
					)
				});
				if (newContent.cancelled) return;
				await m.edit({
					content: newContent.result!
				});
				await part.editReply({
					content: await this.client.t(
						'COMMANDS.APPBUTTON_EDIT.CONTENT_SUCCESS',
						message
					),
					components: [],
					embeds: []
				});
				break;
			}
			case ids.appsButtonId: {
				const ids = {
					selectId: `selectAppEditAppbutton|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					continueButtonId: `continueAppEditAppbutton|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppEditAppbutton|1|${message.id}|${
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
					content: await this.client.t(
						'COMMANDS.APPBUTTON_CREATE.SELECT_APP',
						message
					),
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
								.setLabel(await this.client.t('GENERIC.CONTINUE', message))
								.setCustomId(ids.continueButtonId)
								.setStyle('SUCCESS')
								.setEmoji('✅'),
							new MessageButton()
								.setLabel(await this.client.t('GENERIC.CANCEL', message))
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
						await message.util!.reply(
							await this.client.t('GENERIC.CANCELED', message)
						);
						return;
					}
					if (
						buttonInteraction.customId === ids.continueButtonId &&
						selectedApps === null
					) {
						await buttonInteraction.reply({
							content: await this.client.t('ERRORS.NO_APP_SELECTED', message),
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
				await m.edit({
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
				await message.util!.send(
					await this.client.t('COMMANDS.APPBUTTON_EDIT.APPS_SUCCESS', message)
				);
				break;
			}
			default:
				return;
		}
	}
}
