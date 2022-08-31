import {
	ApplyOptions,
	createClassDecorator,
	createProxy
} from "@sapphire/decorators";
import { ModuleOptions, ModulePiece } from "../../structures/modules/piece";
import { request } from "undici";
import { container } from "@sapphire/pieces";
import type { CommandInteraction } from "discord.js";
import {
	ChatInputCommand,
	ChatInputCommandContext,
	Events
} from "@sapphire/framework";

@ApplyOptions<ModuleOptions>({
	name: "dev-utils"
})
export class DevUtilsModule extends ModulePiece {
	/**
	 * Uploads some text to hastebin, and returns the URL where it is accessible
	 *
	 * @todo Add multiple haste sources besides haste.tyman.systems
	 * @param text The text to upload to hastebin
	 * @returns The full URL of the uploaded haste
	 */
	public async haste(text: string): Promise<string> {
		const { statusCode, body } = await request(
			"https://haste.tyman.systems/documents",
			{
				body: text,
				method: "POST"
			}
		);

		if (statusCode != 200) throw new Error("Uploading to haste failed");
		return await body
			.json()
			.then(
				(response: { key: string }) =>
					`https://haste.tyman.systems/${response.key}`
			);
	}
}

/**
 * The options for module injection
 */
interface ModuleInjectionOptions {
	/**
	 * The name of the module to lazy load
	 */
	moduleName: string;
	/**
	 * The name of the property to add
	 */
	propertyName: string;
}

/**
 * A decorator that adds a property to the constructed class which will lazy load a module loaded in the pieces modules store
 * @param {string} name The name of the module to inject. As this is not given a property name, it defaults to the module name converted to camelCase
 */
export function ModuleInjection(name: string): ClassDecorator;
/**
 * A decorator that adds a property to the constructed class which will lazy load a module loaded in the pieces modules store
 * @param {ModuleInjectionOptions} options The options for the module injection, like the module name and property name
 */
export function ModuleInjection(
	options: ModuleInjectionOptions
): ClassDecorator;
export function ModuleInjection(
	optionsOrModuleName: ModuleInjectionOptions | string
) {
	const { propertyName, moduleName } =
		typeof optionsOrModuleName == "string"
			? {
					propertyName: optionsOrModuleName.replace(/-(\w)/g, m =>
						m[1].toUpperCase()
					),
					moduleName: optionsOrModuleName
			  }
			: optionsOrModuleName;
	// Return the actual decorator from the factory
	return createClassDecorator(
		<T extends { new (...args: any[]): {} }>(target: T) => {
			container.logger.debug(
				`Injecting module ${moduleName} into class ${target.name} with property ${target.name}#${propertyName}`
			);
			// Create a proxy over the existing class constructor
			return createProxy(target, {
				construct: (ctor, args: unknown[]) => {
					// Construct the class as usual
					const newClass = new ctor(...args);
					// Add a property with the name specified in options.propertyName to the class
					Object.defineProperty(newClass, propertyName, {
						// Define a getter which will fetch the module and then replace itself with that module, effectively lazy loading it
						get: () => {
							// Fetch module
							const module = container.stores.get("modules").get(moduleName);
							// Throw an error if the module is invalid
							if (!module) throw new Error(`Module ${moduleName} not found!`);
							// Redefine the property with the module
							Object.defineProperty(target, propertyName, {
								value: module,
								writable: false,
								enumerable: false,
								configurable: false
							});
							// Return the module
							return module;
						}
					});
					// Return the constructed class
					return newClass;
				}
			});
		}
	);
}

/**
 * Creates a dummy chatInputRun that just redirects to another command's chatInputRun method, for use with subcommands
 * @param name The name of the command to redirect to
 * @returns A chatInputRun function that redirects to the real one
 */
export function makeCommandRedirect(name: string) {
	let command: ChatInputCommand;

	return async (
		interaction: CommandInteraction,
		context: ChatInputCommandContext
	) => {
		if (!command) {
			// Fetch command if haven't already
			const foundCommand = container.stores.get("commands").get(name);
			if (!foundCommand)
				throw new Error(
					`External command with name ${name} was supposed to be run, but it could not be found!`
				);
			if (!foundCommand.chatInputRun)
				throw new Error(
					`External command with name ${name} was supposed to be run, but it did not have a chatInputRun method!`
				);

			command = foundCommand as ChatInputCommand;
		}

		// Check command preconditions
		const preconditionResult = await command.preconditions.chatInputRun(
			interaction,
			command,
			context
		);
		if (preconditionResult.isErr()) {
			container.client.emit(
				Events.ChatInputCommandDenied,
				preconditionResult.unwrapErr(),
				{ command, context, interaction }
			);
			return;
		}

		// Run the real chatInputRun
		return command.chatInputRun(interaction, context);
	};
}
