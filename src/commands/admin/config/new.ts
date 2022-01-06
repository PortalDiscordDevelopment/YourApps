import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { AppQuestion, AppQuestionType } from '@lib/models/types';
import { App } from '@lib/models/App';
import { Guild } from '@lib/models/Guild';

export default class ConfigNewCommand extends BotCommand {
	public constructor() {
		super('config-new', {
			aliases: ['config-new'],
			description: {
				content: () => this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_NEW'),
				usage: 'config new',
				examples: ['config new']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin',
			args: [
				{
					match: 'content',
					id: 'application'
				}
			]
		});
	}

	async exec(
		message: Message,
		{ application }: { application: string | null }
	) {
		if (!application) {
			await message.reply(
				this.client.i18n.t('ARGS.PLEASE_GIVE', { type: 'application' })
			);
			return;
		}
		// * Description
		const { result: description, cancelled: descriptionCancelled } =
			await this.sendPromptSingle(message, {
				title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
					application
				}),
				description: this.client.i18n.t(
					'CONFIG.APPLICATION_NEW.DESCRIPTION_BODY',
					{ application }
				),
				fieldName: this.client.i18n.t('CONFIG.APPLICATION_DESCRIPTION'),
				allowSkip: true,
				process: m => {
					return {
						success: true,
						processed: {
							user: m.content,
							data: m.content
						}
					};
				},
				ids: {
					continueButtonId: `continueAppCreation|0|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppCreation|0|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				}
			});
		if (descriptionCancelled) return;
		// * Questions
		const { collected: questions, endedReason: questionsEndReason } =
			await this.sendPrompt(message, {
				title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
					application
				}),
				description: this.client.i18n.t(
					'CONFIG.APPLICATION_NEW.NEW_APPLICATION_QUESTIONS',
					{ application }
				),
				fieldName: this.client.i18n.t('GENERIC.QUESTIONS'),
				allowZero: 'questions',
				process: m => {
					return {
						success: true,
						processed: {
							user: m.content,
							data: m.content
						}
					};
				},
				ids: {
					continueButtonId: `continueAppCreation|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppCreation|1|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				}
			});
		if (questionsEndReason === 'cancel') return;
		const parsedQuestions: AppQuestion[] = questions.map(q => ({
			question: q,
			type: AppQuestionType.STRING // TODO: Don't hardcode this
		}));
		// * Reward roles
		const { collected: parsedRewardRoles, endedReason: rewardRolesEndReason } =
			await this.sendPrompt(message, {
				title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
					application
				}),
				description: this.client.i18n.t(
					'CONFIG.APPLICATION_NEW.REWARD_ROLES_BODY',
					{ application }
				),
				fieldName: this.client.i18n.t('CONFIG.APPLICATION_REWARD_ROLES'),
				allowZero: true,
				process: m => {
					const role = this.client.util.resolveRole(
						m.content,
						m.guild!.roles.cache,
						false,
						true
					);
					if (role == undefined)
						return {
							success: false,
							error: `Unable to find role "${m.content}". Make sure your text is a valid id, mention, or name.`
						};
					else
						return {
							success: true,
							processed: {
								user: `<@&${role.id}>`,
								data: role.id
							}
						};
				},
				ids: {
					continueButtonId: `continueAppCreation|2|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppCreation|2|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				}
			});
		if (rewardRolesEndReason === 'cancel') return;
		// * Required roles
		const {
			collected: parsedRequiredRoles,
			endedReason: requiredRolesEndReason
		} = await this.sendPrompt(message, {
			title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
				application
			}),
			description: this.client.i18n.t(
				'CONFIG.APPLICATION_NEW.REQUIRED_ROLES_BODY',
				{ application }
			),
			fieldName: this.client.i18n.t('CONFIG.APPLICATION_REQUIRED_ROLES'),
			allowZero: true,
			process: m => {
				const role = this.client.util.resolveRole(
					m.content,
					m.guild!.roles.cache,
					false,
					true
				);
				if (role == undefined)
					return {
						success: false,
						error: `Unable to find role "${m.content}". Make sure your text is a valid id, mention, or name.`
					};
				else
					return {
						success: true,
						processed: {
							user: `<@&${role.id}>`,
							data: role.id
						}
					};
			},
			ids: {
				continueButtonId: `continueAppCreation|3|${message.id}|${
					message.editedTimestamp ?? message.createdTimestamp
				}`,
				cancelButtonId: `cancelAppCreation|3|${message.id}|${
					message.editedTimestamp ?? message.createdTimestamp
				}`
			}
		});
		if (requiredRolesEndReason === 'cancel') return;
		// * Remove roles
		const { collected: parsedRemoveRoles, endedReason: removeRolesEndReason } =
			await this.sendPrompt(message, {
				title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
					application
				}),
				description: this.client.i18n.t(
					'CONFIG.APPLICATION_NEW.REMOVE_ROLES_BODY',
					{ application }
				),
				fieldName: this.client.i18n.t('CONFIG.APPLICATION_REMOVE_ROLES'),
				allowZero: true,
				process: m => {
					const role = this.client.util.resolveRole(
						m.content,
						m.guild!.roles.cache,
						false,
						true
					);
					if (role == undefined)
						return {
							success: false,
							error: `Unable to find role "${m.content}". Make sure your text is a valid id, mention, or name.`
						};
					else
						return {
							success: true,
							processed: {
								user: `<@&${role.id}>`,
								data: role.id
							}
						};
				},
				ids: {
					continueButtonId: `continueAppCreation|4|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppCreation|4|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				}
			});
		if (removeRolesEndReason === 'cancel') return;
		// * Custom command
		const { result: customcommand, cancelled: customcommandCancelled } =
			await this.sendPromptSingle(message, {
				title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
					application
				}),
				description: this.client.i18n.t(
					'CONFIG.APPLICATION_NEW.CUSTOM_COMMAND_BODY',
					{ application }
				),
				fieldName: this.client.i18n.t('CONFIG.APPLICATION_CUSTOM_COMMAND'),
				allowSkip: true,
				process: m => {
					return {
						success: true,
						processed: {
							user: `\`${message.util!.parsed!.prefix}${m.content}\``,
							data: m.content
						}
					};
				},
				ids: {
					continueButtonId: `continueAppCreation|5|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppCreation|5|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				}
			});
		if (customcommandCancelled) return;
		// * Cooldown
		const { result: cooldown, cancelled: cooldownCancelled } =
			await this.sendPromptSingle(message, {
				title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
					application
				}),
				description: this.client.i18n.t(
					'CONFIG.APPLICATION_NEW.COOLDOWN_BODY',
					{ application }
				),
				fieldName: this.client.i18n.t('CONFIG.APPLICATION_COOLDOWN'),
				allowSkip: true,
				process: m => {
					if (isNaN(Number(m.content)))
						return {
							success: false,
							error:
								'please send an actual number (in milliseconds, without commas or periods).'
						};
					else
						return {
							success: true,
							processed: {
								user: `${m.content} milliseconds`,
								data: Number(m.content)
							}
						};
				},
				ids: {
					continueButtonId: `continueAppCreation|6|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppCreation|6|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				}
			});
		if (cooldownCancelled) return;
		// * Minimum join time
		const { result: minjointime, cancelled: minjointimeCancelled } =
			await this.sendPromptSingle(message, {
				title: this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
					application
				}),
				description: this.client.i18n.t(
					'CONFIG.APPLICATION_NEW.MIN_JOIN_TIME_BODY',
					{ application }
				),
				fieldName: this.client.i18n.t('CONFIG.APPLICATION_MIN_JOIN_TIME'),
				allowSkip: true,
				process: m => {
					if (isNaN(Number(m.content)))
						return {
							success: false,
							error:
								'please send an actual number (in milliseconds, without commas or periods).'
						};
					else
						return {
							success: true,
							processed: {
								user: `${m.content} milliseconds`,
								data: Number(m.content)
							}
						};
				},
				ids: {
					continueButtonId: `continueAppCreation|7|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`,
					cancelButtonId: `cancelAppCreation|7|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				}
			});
		if (minjointimeCancelled) return;
		// * Verify settings
		const verifyIds = {
			continueButtonId: `continueAppCreation|8|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`,
			cancelButtonId: `cancelAppCreation|8|${message.id}|${
				message.editedTimestamp ?? message.createdTimestamp
			}`
		};
		const verifyMessage = await message.reply({
			embeds: [
				this.client.util
					.embed()
					.setTitle(
						this.client.i18n.t('CONFIG.APPLICATION_NEW.NEW_APPLICATION', {
							application
						})
					)
					.setDescription(
						this.client.i18n.t('CONFIG.APPLICATION_NEW.PLEASE_VERIFY')
					)
					.setFields([
						{
							name: this.client.i18n.t('CONFIG.APPLICATION_DESCRIPTION'),
							value: description ?? this.client.i18n.t('CONFIG.NONE_SET'),
							inline: true
						},
						{
							name: this.client.i18n.t('GENERIC.QUESTIONS'),
							value: questions.map(q => `- ${q}`).join('\n'),
							inline: true
						},
						{
							name: this.client.i18n.t('CONFIG.APPLICATION_REWARD_ROLES'),
							value:
								parsedRewardRoles.map(q => `- <@&${q}>`).join('\n') ||
								this.client.i18n.t('CONFIG.NONE_SET'),
							inline: true
						},
						{
							name: this.client.i18n.t('CONFIG.APPLICATION_REQUIRED_ROLES'),
							value:
								parsedRequiredRoles.map(q => `- <@&${q}>`).join('\n') ||
								this.client.i18n.t('CONFIG.NONE_SET'),
							inline: true
						},
						{
							name: this.client.i18n.t('CONFIG.APPLICATION_REMOVE_ROLES'),
							value:
								parsedRemoveRoles.map(q => `- <@&${q}>`).join('\n') ||
								this.client.i18n.t('CONFIG.NONE_SET'),
							inline: true
						},
						{
							name: this.client.i18n.t('CONFIG.APPLICATION_CUSTOM_COMMAND'),
							value: customcommand
								? `\`${message.util!.parsed!.prefix}${customcommand}\``
								: this.client.i18n.t('CONFIG.NONE_SET'),
							inline: true
						},
						{
							name: this.client.i18n.t('CONFIG.APPLICATION_COOLDOWN'),
							value: cooldown
								? `${cooldown} milliseconds`
								: this.client.i18n.t('CONFIG.NONE_SET'),
							inline: true
						},
						{
							name: this.client.i18n.t('CONFIG.APPLICATION_MIN_JOIN_TIME'),
							value: minjointime
								? `${minjointime} milliseconds`
								: this.client.i18n.t('CONFIG.NONE_SET'),
							inline: true
						}
					])
			],
			components: [
				new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId(verifyIds.continueButtonId)
						.setLabel(this.client.i18n.t('GENERIC.CONTINUE'))
						.setStyle('SUCCESS')
						.setEmoji('💾'),
					new MessageButton()
						.setCustomId(verifyIds.cancelButtonId)
						.setLabel(this.client.i18n.t('GENERIC.CANCEL'))
						.setStyle('DANGER')
						.setEmoji('🗑')
				])
			]
		});
		const response = await verifyMessage.awaitMessageComponent({
			filter: i => Object.values(verifyIds).includes(i.customId),
			componentType: 'BUTTON'
		});
		if (response.customId == verifyIds.continueButtonId) {
			await response.deferReply();
			if (!(await Guild.findByPk(message.guild!.id))) {
				// Make sure constraints are handled
				await Guild.create({
					id: message.guild!.id
				});
			}
			const appEntry = App.build({
				name: application,
				guild: message.guild!.id,
				description: description ?? undefined,
				questions: parsedQuestions,
				rewardroles: parsedRewardRoles,
				requiredroles: parsedRequiredRoles,
				removeroles: parsedRemoveRoles,
				closed: false, // TODO: Maybe don't hardcode this
				cooldown: cooldown ?? undefined,
				minjointime: minjointime ?? undefined
			});
			await appEntry.save();
			await response.editReply({
				content: this.client.i18n.t('CONFIG.APPLICATION_NEW.SUCCESS')
			});
		} else {
			await response.reply(this.client.i18n.t('GENERIC.CANCELED'));
		}
	}

	async sendPrompt<T>(
		message: Message,
		options: {
			ids: {
				continueButtonId: string;
				cancelButtonId: string;
			};
			title: string;
			description: string;
			fieldName: string;
			allowZero: string | true;
			process: (m: Message) =>
				| {
						success: true;
						processed: {
							user: string;
							data: T;
						};
				  }
				| {
						success: false;
						error: string;
				  };
		}
	): Promise<{
		collected: T[];
		endedReason: 'cancel' | 'continue';
	}> {
		const collected: T[] = [];
		const newAppMessage = await message.reply({
			embeds: [
				this.client.util
					.embed()
					.setTitle(options.title)
					.setDescription(options.description)
					.addField(
						options.fieldName,
						this.client.i18n.t('GENERIC.NONE_YET'),
						false
					)
			],
			components: [
				new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId(options.ids.continueButtonId)
						.setLabel(this.client.i18n.t('GENERIC.CONTINUE'))
						.setStyle('SUCCESS')
						.setEmoji('💾'),
					new MessageButton()
						.setCustomId(options.ids.cancelButtonId)
						.setLabel(this.client.i18n.t('GENERIC.CANCEL'))
						.setStyle('DANGER')
						.setEmoji('🗑')
				])
			]
		});
		const messageCollector = await newAppMessage.channel.createMessageCollector(
			{
				filter: m => m.author.id == message.author.id,
				idle: 600_000
			}
		);
		messageCollector.on('collect', async m => {
			if (m.deletable) m.delete();
			const validate = options.process(m);
			if (!validate.success) {
				await m.channel
					.send({
						content: `<@${m.author.id}>, ${validate.error}`,
						allowedMentions: { repliedUser: false, parse: [] }
					})
					.then(rm => {
						if (rm.deletable) setTimeout(() => rm.delete(), 3000);
					});
				return;
			}
			await newAppMessage.edit({
				embeds: [
					newAppMessage.embeds[0].fields[0].value != 'None yet!'
						? newAppMessage.embeds[0].setFields({
								name: options.fieldName,
								value: `${newAppMessage.embeds[0].fields[0].value}\n- ${validate.processed.user}`
						  })
						: newAppMessage.embeds[0].setFields({
								name: options.fieldName,
								value: `- ${validate.processed.user}`
						  })
				]
			});
			collected.push(validate.processed.data);
		});
		newAppMessage
			.createMessageComponentCollector({
				filter: i => Object.values(options.ids).includes(i.customId),
				componentType: 'BUTTON'
			})
			.on('collect', async buttonInteraction => {
				if (buttonInteraction.customId == options.ids.cancelButtonId) {
					messageCollector.stop('cancel');
					await buttonInteraction.reply(this.client.i18n.t('GENERIC.CANCELED'));
				} else {
					if (collected.length === 0 && options.allowZero !== true) {
						await buttonInteraction.reply({
							content: this.client.i18n.t(
								'CONFIG.APPLICATION_NEW.NONE_GIVEN_MULTI',
								{
									type: options.allowZero
								}
							),
							ephemeral: true
						});
					} else {
						await buttonInteraction.deferUpdate();
						messageCollector.stop('continue');
					}
				}
			});
		return new Promise(resolve => {
			messageCollector.on('end', (_, reason) =>
				resolve({
					collected,
					endedReason: reason as 'cancel' | 'continue'
				})
			);
		});
	}

	async sendPromptSingle<T>(
		message: Message,
		options: {
			ids: {
				continueButtonId: string;
				cancelButtonId: string;
			};
			title: string;
			description: string;
			fieldName: string;
			allowSkip: boolean;
			process: (m: Message) =>
				| {
						success: true;
						processed: {
							user: string;
							data: T;
						};
				  }
				| {
						success: false;
						error: string;
				  };
		}
	): Promise<{
		result: T | null;
		cancelled: boolean;
	}> {
		let collected: T | null = null;
		const newAppMessage = await message.reply({
			embeds: [
				this.client.util
					.embed()
					.setTitle(options.title)
					.setDescription(options.description)
					.addField(
						options.fieldName,
						this.client.i18n.t('GENERIC.NONE_YET'),
						false
					)
			],
			components: [
				new MessageActionRow().addComponents([
					new MessageButton()
						.setCustomId(options.ids.continueButtonId)
						.setLabel(this.client.i18n.t('GENERIC.CONTINUE'))
						.setStyle('SUCCESS')
						.setEmoji('💾'),
					new MessageButton()
						.setCustomId(options.ids.cancelButtonId)
						.setLabel(this.client.i18n.t('GENERIC.CANCEL'))
						.setStyle('DANGER')
						.setEmoji('🗑')
				])
			]
		});
		const messageCollector = await newAppMessage.channel.createMessageCollector(
			{
				filter: m => m.author.id == message.author.id,
				idle: 600_000
			}
		);
		messageCollector.on('collect', async m => {
			if (m.deletable) m.delete();
			const validate = options.process(m);
			if (!validate.success) {
				await m.channel
					.send({
						content: `<@${m.author.id}>, ${validate.error}`,
						allowedMentions: { repliedUser: false, parse: [] }
					})
					.then(rm => {
						if (rm.deletable) setTimeout(() => rm.delete(), 3000);
					});
				return;
			}
			await newAppMessage.edit({
				embeds: [
					newAppMessage.embeds[0].setFields({
						name: options.fieldName,
						value: validate.processed.user
					})
				]
			});
			collected = validate.processed.data;
		});
		newAppMessage
			.createMessageComponentCollector({
				filter: i => Object.values(options.ids).includes(i.customId),
				componentType: 'BUTTON'
			})
			.on('collect', async buttonInteraction => {
				if (buttonInteraction.customId == options.ids.cancelButtonId) {
					messageCollector.stop('cancel');
					await buttonInteraction.reply(this.client.i18n.t('GENERIC.CANCELED'));
				} else {
					if (collected === null && options.allowSkip !== true) {
						await buttonInteraction.reply({
							content: this.client.i18n.t(
								'CONFIG.APPLICATION_NEW.NONE_GIVEN_SINGLE',
								{
									type: options.allowSkip
								}
							),
							ephemeral: true
						});
					} else {
						await buttonInteraction.deferUpdate();
						messageCollector.stop('continue');
					}
				}
			});
		return new Promise(resolve => {
			messageCollector.on('end', (_, reason) =>
				resolve({
					result: collected,
					cancelled: reason == 'cancel'
				})
			);
		});
	}
}
