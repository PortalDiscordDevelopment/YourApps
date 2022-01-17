import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { AppButton, Guild } from '@lib/models';

export default class ConfigBlacklistCommand extends BotCommand {
	public constructor() {
		super('config-appbutton', {
			aliases: ['config-appbutton'],
			description: {
				content: () =>
					this.client.i18n.t('COMMANDS.DESCRIPTIONS.CONFIG_BLACKLIST'),
				usage: 'config appbutton',
				examples: ['config appbutton']
			},
			channel: 'guild',
			children: ['config-appbutton-create', 'config-appbutton-delete'],
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	*args(): Generator<ArgumentOptions, Flag | undefined, string> {
		const subcommand = yield {
			type: [
				['config-appbutton-create', 'add', 'create', 'new'],
				['config-appbutton-delete', 'remove', 'delete']
			]
		};
		if (subcommand !== null) {
			return Flag.continue(subcommand);
		}
	}
	async exec(message: Message) {
		const appbuttons = await AppButton.findAll({
			where: {
				guild: message.guildId!
			}
		});
		if (appbuttons.length < 1) {
			await message.util!.send(this.client.i18n.t('CONFIG.NO_APPBUTTONS'));
			return;
		}
		await message.util!.send({
			embeds: [
				this.client.util.embed()
					.setTitle(this.client.i18n.t('CONFIG.APPBUTTONS', {
						guild: message.guildId!
					}))
					.setDescription(
						appbuttons
					)
			]
		});
	}
}
