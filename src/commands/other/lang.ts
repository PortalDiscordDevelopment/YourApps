import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { User } from '@lib/models';

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
			await message.util!.reply(
				await this.client.t('COMMANDS.LANGUAGE.YOUR_LANG', message, {
					lang: userEntry?.language ?? this.client.supportedLangs[0]
				})
			);
		} else {
			if (!this.client.supportedLangs.includes(code)) {
				await message.util!.reply(
					await this.client.t('COMMANDS.LANGUAGE.INVALID_LANG', message, {
						code,
						langs: this.client.supportedLangs
							.map(code => `\`${code}\``)
							.join(', ')
					})
				);
				return;
			}
			const [userEntry] = await User.findOrBuild({
				where: {
					id: message.author.id
				},
				defaults: {
					id: message.author.id
				}
			});
			const oldCode = userEntry.language ?? this.client.supportedLangs[0];
			userEntry.language = code;
			await userEntry.save();
			await message.util!.reply(
				await this.client.t('COMMANDS.LANGUAGE.CHANGED_LANG', message, {
					code,
					oldCode
				})
			);
		}
	}
}
