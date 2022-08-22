import {
	ApplyOptions,
	createClassDecorator,
	createProxy
} from "@sapphire/decorators";
import { ModuleOptions, ModulePiece } from "../../structures/piece";
import { request } from "undici";
import { container } from "@sapphire/pieces";

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

export function ModuleInjection(options: {
	moduleName: string;
	propertyName: string;
}) {
	return createClassDecorator(
		<T extends { new (...args: any[]): {} }>(target: T) =>
			createProxy(target, {
				construct: (ctor, args: unknown[]) => {
					const newClass = new ctor(...args);
					Object.defineProperty(newClass, options.propertyName, {
						get: () => {
							// Fetch module
							const module = container.stores
								.get("modules")
								.get(options.moduleName);
							// Throw an error if the module is invalid
							if (!module)
								throw new Error(`Module ${options.moduleName} not found!`);
							// Redefine the property with the module
							Object.defineProperty(target, options.propertyName, {
								value: module,
								writable: false,
								enumerable: false,
								configurable: false
							});
							// Return the module
							return module;
						}
					});
					return newClass;
				}
			})
	);
}
