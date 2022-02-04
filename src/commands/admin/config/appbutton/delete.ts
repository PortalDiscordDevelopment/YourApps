import { Message, TextChannel } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { AppButton } from '@lib/models';
import { CustomArgType, InvalidArgError } from '@lib/ext/BotClient';

export default class ConfigAppbuttonDeleteCommand extends BotCommand {
	public constructor() {
		super('config-appbutton-delete', {
			aliases: ['config-appbutton-delete'],
			description: {
				content: () =>
					this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_APPBUTTON_DELETE'),
				usage: 'config appbutton delete',
				examples: ['config appbutton delete']
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
			await message.util!.send(
				await this.client.t('ARGS.PLEASE_GIVE_VALID', message, { type: 'appbutton' })
			);
			return;
		}
		if (appbuttons === null) {
			await message.util!.send(
				await this.client.t('ARGS.PLEASE_GIVE', message, { type: 'appbutton' })
			);
			return;
		}
		await message.util!.reply(await this.client.t('GENERIC.DELETING', message));
		for (const btn of appbuttons) await btn.destroy();
		try {
			const channel = await this.client.channels.fetch(appbuttons[0].channel);
			if (!(channel && channel instanceof TextChannel)) throw Error();
			const message = await channel.messages.fetch(appbuttons[0].message);
			if (!message) throw new Error();
			await message.delete();
		} catch (e) {
			await message.util!.reply(
				await this.client.t('COMMANDS.APPBUTTON_DELETE.DELETED_NO_MESSAGE', message)
			);
			return;
		}
		await message.util!.reply(
			await this.client.t('COMMANDS.APPBUTTON_DELETE.DELETED', message)
		);
	}
}
