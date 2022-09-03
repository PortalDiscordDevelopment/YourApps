import { container, SapphireClient } from "@sapphire/framework";
import * as config from "./config/index.js";
import { ModuleStore } from "./structures/modules/store.js";

// Sapphire plugins
import "@sapphire/plugin-logger/register";

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
await client.login(config.token);
