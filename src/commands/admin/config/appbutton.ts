import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message, Snowflake } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { AppButton, App } from '@lib/models';
import { Op } from 'sequelize';

export default class ConfigBlacklistCommand extends BotCommand {
	public constructor() {
		super('config-appbutton', {
			aliases: ['config-appbutton'],
			description: {
				content: () =>
					this.client.t('COMMANDS.DESCRIPTIONS.CONFIG_BLACKLIST'),
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
			await message.util!.send(await this.client.t('CONFIG.NO_APPBUTTONS', message));
			return;
		}
		const apps = await App.findAll({
			where: {
				id: {
					[Op.in]: appbuttons.map(a => a.app)
				}
			}
		});
		const combinedAppbuttons: {
			message: Snowflake;
			channel: Snowflake;
			guild: Snowflake;
			apps: string[];
		}[] = [];
		for (const appbutton of appbuttons) {
			const existing = combinedAppbuttons.findIndex(
				ab => ab.message == appbutton.message
			);
			const app = apps.find(a => a.id === appbutton.app);
			if (existing !== -1) {
				combinedAppbuttons[existing].apps.push(app!.name);
			} else {
				combinedAppbuttons.push({
					message: appbutton.message,
					channel: appbutton.channel,
					guild: appbutton.guild,
					apps: [app!.name]
				});
			}
		}
		await message.util!.send({
			embeds: [
				this.client.util
					.embed()
					.setTitle(
						await this.client.t('CONFIG.APPBUTTONS', message, {
							guild: message.guild!.name
						})
					)
					.setDescription(
						combinedAppbuttons
							.map(
								ab =>
									`${ab.message}: ${ab.apps.join(
										', '
									)} ([message link](https://discord.com/channels/${ab.guild}/${
										ab.channel
									}/${ab.message}))`
							)
							.join('\n')
					)
			]
		});
	}
}
