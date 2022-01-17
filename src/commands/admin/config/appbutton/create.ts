import { Message, TextChannel } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';
import { Role } from 'discord.js';
import { LogEvent } from '@lib/ext/Util';
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
			allowSkip: false,
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
		const appMessage = await message.util!.send({
			content: this.client.i18n.t('COMMANDS.APPBUTTON_CREATE.SELECT_APP'),
			components: []
		});
	}
}
