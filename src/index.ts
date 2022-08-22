import { container, SapphireClient } from "@sapphire/framework";
import * as config from "./config";
import { ModuleStore } from "./structures/store";

(async () => {
	// Create the SapphireClient
	const client = new SapphireClient({ intents: ["GUILDS"] });

	// Register and initialize the module store
	container.stores.register(new ModuleStore());

	// Log into the bot
	client.login(config.token);
})();
