import { Command, CommandOptions } from 'discord-akairo';
import { BotClient } from './BotClient';

interface BotCommandOptions extends CommandOptions {
	description: {
		content: () => string;
		usage: string;
		examples: string[];
	};
	children?: string[];
	permissionCheck?: 'admin' | 'reviewer';
}

export class BotCommand extends Command {
	declare client: BotClient;
	declare description: {
		content: () => string;
		usage: string;
		examples: string[];
	};
	public children: string[];
	public permissionCheck?: 'admin' | 'reviewer';
	public constructor(id: string, options: BotCommandOptions) {
		super(id, options);
		this.children = options.children ?? [];
		this.permissionCheck = options.permissionCheck;
	}
}
