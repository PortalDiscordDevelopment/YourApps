// import { ArgumentOptions, Flag } from 'discord-akairo';
import { Message } from 'discord.js';
import { BotCommand } from '@lib/ext/BotCommand';
import { Guild } from '@lib/models';

export default class ConfigAdminCommand extends BotCommand {
	public constructor() {
		super('config-admin', {
			aliases: ['config-admin'],
			description: {
				content: 'Gets the admin roles of the server',
				usage: 'config admin',
				examples: ['config admin']
			},
			channel: 'guild',
			category: 'admin',
			permissionCheck: 'admin'
		});
	}
	// *args(): Generator<ArgumentOptions, Flag | undefined, string> {
	// 	const subcommand = yield {
	// 		type: [
	// 			['config-admin-add', 'add'],
	// 			['config-admin-remove', 'remove']
	// 		],
	// 		prompt: {
	// 			optional: true,
	// 			retry: 'Invalid subcommand. What subcommand would you like to use?'
	// 		}
	// 	};
	// 	if (subcommand !== null) {
	// 		return Flag.continue(subcommand);
	// 	}
	// }
	async exec(message: Message) {
		const guildEntry = await Guild.findByPk(message.guild!.id);
		if (
			!guildEntry ||
			!guildEntry.adminroles ||
			guildEntry.adminroles.length < 1
		) {
			await message.channel.send('This server has no admin roles.');
			return;
		}
		await message.channel.send(
			`The admin role(s) for this server are ${guildEntry.adminroles
				.map((p) => `<@&${p}>`)
				.join(', ')}.`
		);
	}
}
