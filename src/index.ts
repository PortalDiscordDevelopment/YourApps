import { container, SapphireClient } from "@sapphire/framework";
import * as config from "./config";
import { ModuleStore } from "./structures/store";

// Sapphire plugins
import "@sapphire/plugin-logger/register";

(async () => {
	// Create the SapphireClient
	const client = new SapphireClient({
		intents: ["GUILDS"],
		logger: {
			level: config.logLevel
		}
	});

	// Register and initialize the module store
	container.stores.register(new ModuleStore());

	// Log into the bot
	client.login(config.token);
})();
