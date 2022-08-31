import { PrismaClient } from "@prisma/client";
import { ApplyOptions } from "@sapphire/decorators";
import { ModuleOptions, ModulePiece } from "../structures/modules/piece";

@ApplyOptions<ModuleOptions>({
	name: "database"
})
export default class DatabaseModule extends ModulePiece {
	/**
	 * The prisma client, if initialized, that is used by the bot
	 */
	public client: PrismaClient | null = null;

	/**
	 * Initializes the database module, setting up the client
	 */
	public override async init() {
		this.connect();
	}

	/**
	 * Destroys the database module, disconnecting the client
	 */
	public override async destroy() {
		await this.disconnect();
	}

	/**
	 * Creates a new client and connects to the database
	 */
	public connect() {
		if (this.client !== null)
			throw new Error(
				"The client has already been initialized, so it can't be connected again!"
			);
		this.client = new PrismaClient();
	}

	/**
	 * Disconnects from the database
	 */
	public async disconnect() {
		if (this.client === null)
			throw new Error(
				"The client has not been initialized yet, so it can't be disconnected!"
			);
		await this.client?.$disconnect();
		this.client = null;
	}
}
