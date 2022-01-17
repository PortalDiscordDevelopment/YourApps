import { BotCommand } from '@lib/ext/BotCommand';
import { Message } from 'discord.js';

export default class HelpCommand extends BotCommand {
	constructor() {
		super('help', {
			aliases: ['help'],
			category: 'info',
			description: {
				content: () => this.client.i18n.t('COMMANDS.HELP_DESCRIPTION'),
				usage: 'help [command]',
				examples: ['help prefix add']
			},
			args: [
				{
					id: 'command',
					type: 'commandAliasImproved',
					match: 'content'
				}
			]
		});
	}

	public async exec(message: Message, { command }: { command: BotCommand }) {
		const prefix =
			message.util!.parsed?.prefix ?? this.client.config.defaultPrefix;

		if (!command) {
			const embed = this.client.util.embed();
			embed.setFooter({
				text: `For more information about a command use ${prefix}help <command>`
			});
			for (const [, category] of this.handler.categories) {
				const categoryFilter = category.filter(command => {
					if (command.channel == 'guild' && !message.guild) return false;
					else if (
						command.ownerOnly &&
						!this.client.ownerID.includes(message.author.id)
					)
						return false;
					else if (
						category.find(c => (c as BotCommand).children.includes(command.id))
					)
						return false;
					else return true;
				});
				const categoryNice = category.id
					.replace(/(\b\w)/gi, lc => lc.toUpperCase())
					.replace(/'(S)/g, letter => letter.toLowerCase());
				const categoryCommands = categoryFilter
					.filter(cmd => cmd.aliases.length > 0)
					.map(
						cmd =>
							`\`${cmd.aliases[0]}${
								(cmd as BotCommand).children.length > 0
									? ` ${this.client.i18n.t('GENERIC.PARENT')}`
									: ''
							}\``
					);
				if (categoryCommands.length > 0) {
					embed.addField(`${categoryNice}`, `${categoryCommands.join(' ')}`);
				}
			}
			await message.reply({ embeds: [embed] });
		} else {
			const embed = this.client.util
				.embed()
				.setTitle(`\`${command.description.usage}\``)
				.addField(
					'Description',
					`${command.description.content()} ${
						command.ownerOnly ? '\n__Developer Only__' : ''
					}`
				);

			if (command.aliases.length > 1)
				embed.addField('Aliases', `\`${command.aliases.join('` `')}\``, true);

			embed.addField(
				'Examples',
				`\`${command.description.examples.join('`\n`')}\``,
				true
			);

			if (command.children.length > 0) {
				embed.addField(
					'Subcommands',
					command.children
						.map(id => {
							const cmd = this.handler.modules.get(id) as BotCommand;
							if (!cmd) return;
							return `\`${cmd.aliases[0].replace(/-/g, ' ')}${
								cmd.children.length > 0
									? ` ${this.client.i18n.t('GENERIC.PARENT')}`
									: ''
							}\``;
						})
						.join('\n')
				);
			}

			await message.reply({ embeds: [embed] });
		}
	}
}
