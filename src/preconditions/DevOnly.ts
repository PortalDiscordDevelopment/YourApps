import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, Message, User } from 'discord.js';
import * as config from '../options/config';

export class DevOnlyPrecondition extends Precondition {
	public override async messageRun(message: Message) {
		return this.run(message.author)
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.run(interaction.user)
	}

	private run(user: User) {
		return config.developers.includes(user.id)
			? this.ok()
			: this.error({
					identifier: 'ownerOnly',
					message: `Only the developer(s) of this bot can use this command.`,
			  })
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		DevOnly: never
	}
}