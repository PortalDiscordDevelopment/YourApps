import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild, User } from '@lib/models';

export default class ConfigCommand extends BotCommand {
	public constructor() {
		super('language', {
			aliases: ['language', 'lang'],
			description: {
				content: () => this.client.t('COMMANDS.DESCRIPTIONS.LANGUAGE'),
				usage: 'language [code]',
				examples: ['language', 'lang en-US', 'language de']
			},
			args: [
				{
					id: 'code'
				}
			]
		});
	}
	async exec(message: Message, { code }: { code: string | null }) {
		if (!code) {
			const userEntry = await User.findByPk(message.author.id);
			if (!userEntry?.language) {
				await message.util!.reply(
					await this.client.t('CONFIG.NO_LANGUAGE', message)
				);
				return;
			}
			await message.util!.reply(
				await this.client.t('COMMANDS.LANGUAGE.YOUR_LANG', message, {
					lang: userEntry.language
				})
			);
		} else {
			const [userEntry] = await User.findOrBuild({
				where: {
					id: message.author.id
				},
				defaults: {
					id: message.author.id
				}
			});
		}
	}
}
