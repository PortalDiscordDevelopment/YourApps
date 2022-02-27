import {
	ButtonInteraction,
	GuildEmoji,
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
					this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_CREATE_APPBUTTON'),
				usage: 'config appbutton create <role>',
				examples: ['config appbutton create #roles']
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
				await this.client.t('ARGS.PLEASE_GIVE', message, {
					type: 'text channel'
				})
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
			description: await this.client.t(
				'COMMANDS.APPBUTTON_CREATE.GIVE_MESSAGE',
				message
			),
			fieldName: await this.client.t('GENERIC.CONTENT', message),
			title: await this.client.t('COMMANDS.APPBUTTON_CREATE.NEW', message),
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
								description: (a.description?.length > 100 ? a.description.slice(0,97) + "..." : a.description) ?? undefined
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
		const reactions: Record<number, string> = {};
		for (const [i, app] of Object.entries(selectedApps as App[])) {
			const skipId = `skipEmojiCreateAppbutton|${i + 2}|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`;
			const m = await message.util!.send({
				content: await this.client.t(
					'COMMANDS.APPBUTTON_CREATE.REACT',
					message,
					{
						app: app.name
					}
				),
				components: [
					new MessageActionRow().addComponents(
						new MessageButton()
							.setCustomId(skipId)
							.setEmoji('❌')
							.setLabel(await this.client.t('GENERIC.SKIP', message))
							.setStyle('DANGER')
					)
				]
			});
			for (;;) {
				const messageCollector = m.awaitMessageComponent({
					filter: i => i.user.id === message.author.id && skipId === i.customId,
					componentType: 'BUTTON',
					time: 60000
				});
				const reactionCollector = m.awaitReactions({
					filter: (_, u) => u.id === message.author.id,
					time: 60000,
					max: 1
				});
				const result = await Promise.any([messageCollector, reactionCollector]);
				if (result instanceof ButtonInteraction) {
					await result.deferUpdate();
					break;
				}
				const reaction = result.first()!;
				if (reaction.emoji instanceof GuildEmoji) {
					await message.util!.reply(
						await this.client.t(
							'COMMANDS.APPBUTTON_CREATE.INVALID_EMOJI',
							message
						)
					);
					continue;
				}
				reactions[app.id] = reaction.emoji.name!;
				await reaction.remove().catch(() => undefined);
				break;
			}
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
							.setEmoji(reactions[app.id])
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
		await message.util!.send({
			content: await this.client.t(
				'COMMANDS.APPBUTTON_CREATE.SUCCESS',
				message
			),
			components: []
		});
	}
}
