import { BotCommand } from "@lib/ext/BotCommand";
import { BotListener } from "@lib/ext/BotListener";
import { Message } from "discord.js";

export default class CommandBlockedListener extends BotListener {
	constructor() {
		super('commandBlocked', {
			emitter: 'commandHandler',
			event: 'commandBlocked'
		})
	}
	async exec(message: Message, command: BotCommand, reason: string) {
		switch (reason) {
			case 'owner': {
				await message.util!.send(this.client.i18n.t('BLOCKED.OWNER_ONLY'))
				break
			}
			case 'dm': {
				await message.util!.send(this.client.i18n.t('BLOCKED.DM_ONLY'))
				break
			}
			case 'guild': {
				await message.util!.send(this.client.i18n.t('BLOCKED.GUILD_ONLY'))
				break
			}
			case 'notAdmin': {
				await message.util!.send(this.client.i18n.t('BLOCKED.ADMIN_ONLY'))
				break
			}
		}
	}
}