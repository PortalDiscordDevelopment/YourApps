import { Store } from "@sapphire/pieces";
import path = require("path");
import { ModulePiece } from "./piece";

export class ModuleStore extends Store<ModulePiece> {
	constructor() {
		super(ModulePiece, {
			name: "modules",
			paths: [path.resolve(__dirname, "..", "modules")]
		});
	}

	override async loadAll() {
		// Load the files by calling the original load all function
		await super.loadAll();

		// Initialize all the modules
		for (const [, module] of this) {
			await module?.init?.();
		}
	}
}

declare module "@sapphire/pieces" {
	export interface StoreRegistryEntries {
		modules: ModuleStore;
	}
}
