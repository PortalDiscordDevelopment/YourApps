import type { CommandInteraction, CommandInteractionOption, CacheType } from "discord.js"

export class Utils {
    /**
	 * @param interaction The command interaction you want to parse for options.
	 * @returns The args from the interaction, in the same formatting as `discord-akairo` has them.
	 */
	public static parseInteractionArgs<T>(interaction: CommandInteraction): T {
		const options: Record<string, unknown> = {}
		interaction.options.data.forEach((option) => {
			switch (option.type) {
				case 'STRING':
					options[option.name] = option.value!
					break
				case 'INTEGER':
					options[option.name] = option.value!
					break
				case 'BOOLEAN':
					options[option.name] = option.value!
					break
				case 'NUMBER':
					options[option.name] = option.value!
					break
				case 'USER':
					options[option.name] = { user: option.user!, member: option.member! }
					break
				case 'CHANNEL':
					options[option.name] = option.channel!
					break
				case 'ROLE':
					options[option.name] = option.role!
					break
				case 'MENTIONABLE':
					options[option.name] = option.role ? option.role : { user: option.user!, member: option.member! }
					break
				case 'SUB_COMMAND':
					options['subcommand'] = option.name
					option.options?.forEach((subOption) => {
						switch (subOption.type) {
							case 'STRING':
								options[subOption.name] = subOption.value!
								break
							case 'INTEGER':
								options[subOption.name] = subOption.value!
								break
							case 'BOOLEAN':
								options[subOption.name] = subOption.value!
								break
							case 'NUMBER':
								options[subOption.name] = subOption.value!
								break
							case 'USER':
								options[subOption.name] = { user: subOption.user!, member: subOption.member! }
								break
							case 'CHANNEL':
								options[subOption.name] = subOption.channel!
								break
							case 'ROLE':
								options[subOption.name] = subOption.role!
								break
							case 'MENTIONABLE':
								options[subOption.name] = subOption.role ? subOption.role : { user: subOption.user!, member: subOption.member! }
								break
						}
					})
					break
				case 'SUB_COMMAND_GROUP': {
					options['subcommandGroup'] = option.name

					const suboptions = (option.options as CommandInteractionOption<CacheType>[])[0].options

					if (option.options) {
						options['subcommand'] = option.options[0].name
						;(suboptions as CommandInteractionOption<CacheType>[]).forEach((subOption) => {
							switch (subOption.type) {
								case 'STRING':
									options[subOption.name] = subOption.value!
									break
								case 'INTEGER':
									options[subOption.name] = subOption.value!
									break
								case 'BOOLEAN':
									options[subOption.name] = subOption.value!
									break
								case 'NUMBER':
									options[subOption.name] = subOption.value!
									break
								case 'USER':
									options[subOption.name] = { user: subOption.user!, member: subOption.member! }
									break
								case 'CHANNEL':
									options[subOption.name] = subOption.channel!
									break
								case 'ROLE':
									options[subOption.name] = subOption.role!
									break
								case 'MENTIONABLE':
									options[subOption.name] = subOption.role ? subOption.role : { user: subOption.user!, member: subOption.member! }
									break
							}
						})
					}
					break
				}
			}
		})

		return options as unknown as T
	}
}