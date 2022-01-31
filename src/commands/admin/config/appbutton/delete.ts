import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { AppButton } from '@lib/models';
import { CustomArgType, InvalidArgError } from '@lib/ext/BotClient';

export default class ConfigAppbuttonDeleteCommand extends BotCommand {
	public constructor() {
		super('config-appbutton-delete', {
			aliases: ['config-appbutton-delete'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_APPBUTTON_DELETE'),
				usage: 'config appbutton delete',
				examples: ['config appbutton delete']
			},
			category: 'admin',
			args: [
				{
					id: 'appbutton'
				}
			],
			channel: 'guild',
			permissionCheck: 'admin'
		});
	}
	async exec(
		message: Message,
		{ appbutton }: { appbutton: CustomArgType<AppButton> }
	) {
		if (appbutton instanceof InvalidArgError) {
			await message.util!.send(
				this.client.i18n.t('ARGS.PLEASE_GIVE_VALID', { type: 'appbutton' })
			);
			return;
		}
		if (appbutton === null) {
			await message.util!.send(
				this.client.i18n.t('ARGS.PLEASE_GIVE', { type: 'appbutton' })
			);
			return;
		}
	}
}
