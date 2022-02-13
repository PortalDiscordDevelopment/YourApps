import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { App } from '@lib/models';
import ConfigNewCommand from './new';
import { BotClient } from '@lib/ext/BotClient';
import { AppQuestionType } from '@lib/models/types';

interface Props {
	[prop: string]: {
		skippable: true | string;
		multi: boolean;
		process: (m: Message) =>
			| {
					success: true;
					processed: {
						user: string;
						data: unknown;
					};
			  }
			| {
					success: false;
					error: string;
			  };
		get?: (app: App) => unknown;
	};
}

const props: Props = {
	'Name': {
		skippable: 'name',
		multi: false,
		process: (m: Message) => ({
			success: true,
			processed: {
				user: m.content,
				data: m.content
			}
		})
	},
	'Description': {
		skippable: true,
		multi: false,
		process: (m: Message) => ({
			success: true,
			processed: {
				user: m.content,
				data: m.content
			}
		})
	},
	'Questions': {
		skippable: 'questions',
		multi: true,
		process: (m: Message) => ({
			success: true,
			processed: {
				user: m.content,
				data: {
					question: m.content,
					type: AppQuestionType.STRING
				}
			}
		}),
		get: app => app.questions.map(q => q.question)
	},
	'Reward roles': {
		skippable: true,
		multi: true,
		process: (m: Message) => {
			const role = (m.client as BotClient).util.resolveRole(
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
		get: app => app.rewardroles.map(r => `<@&${r}>`)
	},
	'Required roles': {
		skippable: true,
		multi: true,
		process: (m: Message) => {
			const role = (m.client as BotClient).util.resolveRole(
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
		get: app => app.requiredroles.map(r => `<@&${r}>`)
	},
	'Remove roles': {
		skippable: true,
		multi: true,
		process: (m: Message) => {
			const role = (m.client as BotClient).util.resolveRole(
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
		get: app => app.removeroles.map(r => `<@&${r}>`)
	},
	'Custom command': {
		skippable: true,
		multi: false,
		process: (m: Message) => ({
			success: true,
			processed: {
				user: m.content,
				data: m.content
			}
		})
	},
	'Cooldown': {
		skippable: true,
		multi: false,
		process: (m: Message) => {
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
		}
	},
	'Min join time': {
		skippable: true,
		multi: false,
		process: (m: Message) => {
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
		}
	}
};

export default class EditCommand extends BotCommand {
	public constructor() {
		super('config-edit', {
			aliases: ['config-edit'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_EDIT'),
				usage: 'config edit <application>',
				examples: ['config edit moderator']
			},
			category: 'admin',
			args: [
				{
					id: 'application',
					type: 'application',
					match: 'rest'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(message: Message, { application }: { application?: App }) {
		if (!application) {
			await message.util!.send(
				await this.client.t('ARGS.INVALID', message, { type: 'application' })
			);
			return;
		}
		const configNewCommand = this.client.commandHandler.findCommand(
			'config-new'
		) as ConfigNewCommand;
		const btns = Object.keys(props).map(v =>
			new MessageButton()
				.setCustomId(
					`chooseEditPart|${v}|${message.id}|${
						message.editedTimestamp ?? message.createdTimestamp
					}`
				)
				.setLabel(v)
				.setStyle('PRIMARY')
		);
		const selectMessage = await message.util!.reply({
			content: await this.client.t('CONFIG.CHOOSE_PART', message),
			components: [
				new MessageActionRow().addComponents(
					btns.slice(0, 3).map(b => b.setStyle('PRIMARY'))
				),
				new MessageActionRow().addComponents(
					btns.slice(3, 6).map(b => b.setStyle('SECONDARY'))
				),
				new MessageActionRow().addComponents(
					btns.slice(6).map(b => b.setStyle('SUCCESS'))
				)
			]
		});
		const btnInteraction = await selectMessage.awaitMessageComponent({
			componentType: 'BUTTON',
			filter: i => i.user.id == message.author.id
		});
		await btnInteraction.deferUpdate();
		const parsed = btnInteraction.customId.split('|');
		const ids = {
			continueButtonId: `chooseEditPartSave|${parsed[1]}|${parsed[2]}|${parsed[3]}`,
			cancelButtonId: `chooseEditPartCancel|${parsed[1]}|${parsed[2]}|${parsed[3]}`
		};
		if (props[parsed[1]].multi) {
			const response = await configNewCommand.sendPrompt(message, {
				ids,
				title: `Change ${parsed[1]}`,
				description: `Please set a ${parsed[1].toLowerCase()}${
					props[parsed[1]].skippable === true
						? ' or press continue to delete the existing value.'
						: ''
				}`,
				allowZero: props[parsed[1]].skippable as string,
				fieldName: parsed[1],
				process: props[parsed[1]].process,
				previousValues: props[parsed[1]].get
					? // @ts-expect-error I hate this code it works but types are fucky
					  props[parsed[1]].get(application)
					: // @ts-expect-error Same as above because typescript doesn't have blocked ignores
					  application[this.client.util.dbcase(parsed[1])]
			});
			if (response.endedReason == 'cancel') {
				await message.util!.send(
					await this.client.t('GENERIC.CANCELED', message)
				);
				return;
			}
			//@ts-expect-error This works, however I do not know a way to make it better
			application[this.client.util.dbcase(parsed[1])] = response.collected;
		} else {
			const response = await configNewCommand.sendPromptSingle(message, {
				ids,
				title: `Change ${parsed[1]}`,
				description: `Please set a ${parsed[1].toLowerCase()}${
					props[parsed[1]].skippable === true
						? ' or press continue to delete the existing value.'
						: ''
				}`,
				allowSkip: props[parsed[1]].skippable,
				fieldName: parsed[1],
				process: props[parsed[1]].process,
				previousValue: props[parsed[1]].get
					? // @ts-expect-error I hate this code it works but types are fucky
					  props[parsed[1]].get(application)
					: // @ts-expect-error Same as above because typescript doesn't have blocked ignores
					  application[this.client.util.dbcase(parsed[1])]
			});
			if (response.cancelled) {
				await message.util!.send(
					await this.client.t('GENERIC.CANCELED', message)
				);
				return;
			}
			//@ts-expect-error This works, however I do not know a way to make it better
			application[this.client.util.dbcase(parsed[1])] = response.result;
		}
		await application.save();
		await message.util!.send(
			await this.client.t('CONFIG.SUCCESSFULLY_EDITED', message, {
				app: application.name,
				part: parsed[1].toLowerCase()
			})
		);
	}
}
