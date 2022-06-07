// * Load sapphire plugins
import '@sapphire/plugin-logger/register'; // Load logger
import '@sapphire/plugin-i18next/register'; // Load i18n

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { Sequelize } from 'sequelize';
import * as config from '../options/config';
import * as Models from './models';
import { container } from '@sapphire/pieces';
import { resolveKey } from '@sapphire/plugin-i18next';

export class BotClient extends SapphireClient {
	public database: Sequelize;

	public constructor() {
		super({
			intents: ['GUILDS', 'GUILD_MESSAGES'],
			logger: { level: LogLevel.Debug },
			i18n: {
				fetchLanguage: async context => {
					if (context.user) {
						// If user available,
						const modelUser = await Models.User.findByPk(context.user.id); // Fetch user from DB (if any)
						const preferredLang =
							modelUser?.language ?? context.interactionLocale; // Get the "preferred" language proritizing user selected language, or their selected discord language if not
						if (preferredLang && container.i18n.languages.has(preferredLang))
							return preferredLang; // If either of the above exist, use it
						else return config.defaultLanguage; // If not, fallback to default
					} else return config.defaultLanguage; // Use default if no user for some reason
				}
			},
			defaultPrefix: config.defaultPrefix,
			loadMessageCommandListeners: true
		});
		this.database = new Sequelize({
			database: 'yourapps',
			dialect: 'postgres',
			username: config.database.username,
			password: config.database.password,
			host: config.database.host,
			port: config.database.port,
			logging: sql => this.logger.trace(sql)
		});
		Models.App.initModel(this.database);
		Models.AppButton.initModel(this.database);
		Models.Guild.initModel(this.database, config.defaultPrefix);
		Models.Submission.initModel(this.database);
		Models.User.initModel(this.database);
		container.database = this.database;
		container.t = resolveKey.bind(this);
	}

	public async initialize() {
		this.logger.info('[Init] Logging into the database...');
		await this.database.authenticate();
		this.logger.info('[Init] Logged in, syncing models...');
		await this.database.sync({ alter: true });
		this.logger.info('[Init] Finished initializing!');
	}

	public async start() {
		await this.initialize();
		return this.login(config.token);
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		database: Sequelize;
		t: typeof resolveKey;
	}
}
