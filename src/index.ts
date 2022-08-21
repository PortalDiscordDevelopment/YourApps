import { SapphireClient } from "@sapphire/framework";
import * as config from "./config";

const client = new SapphireClient({ intents: ["GUILDS"] });

client.login(config.token);
