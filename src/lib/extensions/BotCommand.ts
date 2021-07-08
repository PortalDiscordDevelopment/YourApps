import { Command, CommandOptions } from 'discord-akairo';
import { BotClient } from './BotClient';

interface BotCommandOptions extends CommandOptions {
	description: {
		content: () => string;
		usage: string;
		examples: string[];
	};
	parent?: boolean;
	permissionCheck?: 'admin' | 'reviewer';
}

export class BotCommand extends Command {
	declare client: BotClient;
	public parent: boolean;
	public permissionCheck?: 'admin' | 'reviewer';
	public constructor(id: string, options: BotCommandOptions) {
		super(id, options);
		this.parent = options.parent ?? false;
		this.permissionCheck = options.permissionCheck;
	}
}
