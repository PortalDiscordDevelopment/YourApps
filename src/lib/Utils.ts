import { container } from '@sapphire/pieces';
import type {
	CommandInteraction,
	CommandInteractionOption,
	CacheType,
	User
} from 'discord.js';
import * as config from '../options/config';

export class Utils {
	/**
	 * @param interaction The command interaction you want to parse for options.
	 * @returns The parsed arguments from the interaction, as a simple key value object
	 */
	public static parseInteractionArgs<T>(interaction: CommandInteraction): T {
		const options: Record<string, unknown> = {};
		for (const option of interaction.options.data) {
			switch (option.type) {
				case 'STRING':
				case 'INTEGER':
				case 'BOOLEAN':
				case 'NUMBER':
					options[option.name] = option.value!;
					break;
				case 'USER':
					options[option.name] = { user: option.user!, member: option.member! };
					break;
				case 'CHANNEL':
					options[option.name] = option.channel!;
					break;
				case 'ROLE':
					options[option.name] = option.role!;
					break;
				case 'MENTIONABLE':
					options[option.name] = option.role
						? option.role
						: {
								user: option.user!,
								member: option.member!
						  };
					break;
				case 'SUB_COMMAND':
					options['subcommand'] = option.name;
					option.options?.forEach(subOption => {
						switch (subOption.type) {
							case 'STRING':
							case 'INTEGER':
							case 'BOOLEAN':
							case 'NUMBER':
								options[subOption.name] = subOption.value!;
								break;
							case 'USER':
								options[subOption.name] = {
									user: subOption.user!,
									member: subOption.member!
								};
								break;
							case 'CHANNEL':
								options[subOption.name] = subOption.channel!;
								break;
							case 'ROLE':
								options[subOption.name] = subOption.role!;
								break;
							case 'MENTIONABLE':
								options[subOption.name] = subOption.role
									? subOption.role
									: {
											user: subOption.user!,
											member: subOption.member!
									  };
								break;
						}
					});
					break;
				case 'SUB_COMMAND_GROUP': {
					options['subcommandGroup'] = option.name;

					const suboptions = (
						option.options as CommandInteractionOption<CacheType>[]
					)[0].options;

					if (option.options) {
						options['subcommand'] = option.options[0].name;
						(suboptions as CommandInteractionOption<CacheType>[]).forEach(
							subOption => {
								switch (subOption.type) {
									case 'STRING':
									case 'INTEGER':
									case 'BOOLEAN':
									case 'NUMBER':
										options[subOption.name] = subOption.value!;
										break;
									case 'USER':
										options[subOption.name] = {
											user: subOption.user!,
											member: subOption.member!
										};
										break;
									case 'CHANNEL':
										options[subOption.name] = subOption.channel!;
										break;
									case 'ROLE':
										options[subOption.name] = subOption.role!;
										break;
									case 'MENTIONABLE':
										options[subOption.name] = subOption.role
											? subOption.role
											: {
													user: subOption.user!,
													member: subOption.member!
											  };
										break;
								}
							}
						);
					}
					break;
				}
			}
		}

		return options as unknown as T;
	}

	public static async fetchUsers(): Promise<{
		developers: User[];
		owners: User[];
		contributors: User[];
	}> {
		const users = await Promise.all(
			Object.entries(config.users).map(async ([id, roles]) => [
				await container.client.users.fetch(id),
				roles
			]) as Promise<[User, 'developer' | 'owner' | 'contributor']>[]
		);
		return {
			developers: users
				.filter(([, roles]) => roles.includes('developer'))
				.map(([u]) => u),
			owners: users
				.filter(([, roles]) => roles.includes('owner'))
				.map(([u]) => u),
			contributors: users
				.filter(([, roles]) => roles.includes('contributor'))
				.map(([u]) => u)
		};
	}

	/**
	 * Truncates a string at a specified character limit, adding an ellipsis at the end if truncated
	 * @param string The string to truncate
	 * @param characterLimit The character limit to truncate at
	 * @returns The truncated string
	 */
	public static truncate(string: string, characterLimit: number): string {
		return string.length > characterLimit
			? string.substring(0, characterLimit - 3) + '...'
			: string;
	}

	/**
	 * Creates a new array from an existing one, inserting an item into the new array at a specific index
	 * @param array The array to insert into
	 * @param index The index to insert after
	 * @param item The item to insert into the array
	 * @returns The new array, with the item inserted
	 */
	public static arrayInsert<T>(array: T[], index: number, item: T): T[] {
		return [...array.slice(0, index + 1), item, ...array.slice(index + 1)];
	}
}

export enum DiscordFieldLimits {
	FIELD_NAME = 256
}
