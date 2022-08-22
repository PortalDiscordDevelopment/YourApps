import { Store } from "@sapphire/pieces";
import path = require("path");
import { ModulePiece } from "./piece";

export class ModuleStore extends Store<ModulePiece> {
	constructor() {
		super(ModulePiece, {
			name: "modules",
			paths: [path.resolve(__dirname, "..", "modules")],
		});
	}

	async initializeModules() {
		for (const [, module] of this) {
			await module.init();
		}
	}
}

declare module "@sapphire/pieces" {
    export interface StoreRegistryEntries {
        modules: ModuleStore
    }
}