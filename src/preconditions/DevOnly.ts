import { Precondition } from '@sapphire/framework';
import type { CommandInteraction, Message, User } from 'discord.js';
import * as config from '../options/config';

const developers = Object.entries(config.users).filter(([, roles]) => roles.includes('developer')).map(([id]) => id)

export class DevOnlyPrecondition extends Precondition {
	public override async messageRun(message: Message) {
		return this.run(message.author);
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.run(interaction.user);
	}

	private run(user: User) {
		return developers.includes(user.id)
			? this.ok()
			: this.error({
					identifier: 'ownerOnly',
					message: `Only the developer(s) of this bot can use this command.`
			  });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		DevOnly: never;
	}
}
