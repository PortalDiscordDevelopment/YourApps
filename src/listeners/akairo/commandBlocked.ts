import { BotCommand } from '@lib/ext/BotCommand';
import { BotListener } from '@lib/ext/BotListener';
import { Message } from 'discord.js';

export default class CommandBlockedListener extends BotListener {
	constructor() {
		super('commandBlocked', {
			emitter: 'commandHandler',
			event: 'commandBlocked'
		});
	}
	async exec(message: Message, command: BotCommand, reason: string) {
		switch (reason) {
			case 'owner': {
				await message.util!.send(
					await this.client.t('BLOCKED.OWNER_ONLY', message)
				);
				break;
			}
			case 'dm': {
				await message.util!.send(
					await this.client.t('BLOCKED.DM_ONLY', message)
				);
				break;
			}
			case 'guild': {
				await message.util!.send(
					await this.client.t('BLOCKED.GUILD_ONLY', message)
				);
				break;
			}
			case 'notAdmin': {
				await message.util!.send(
					await this.client.t('BLOCKED.ADMIN_ONLY', message)
				);
				break;
			}
			case 'notReviewer': {
				await message.util!.send(
					await this.client.t('BLOCKED.REVIEWER_ONLY', message)
				);
				break;
			}
		}
	}
}
