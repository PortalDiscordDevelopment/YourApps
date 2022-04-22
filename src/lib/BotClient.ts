// * Load sapphire plugins
import '@sapphire/plugin-logger/register'; // Load logger

import { LogLevel, SapphireClient } from '@sapphire/framework';
import { Sequelize } from 'sequelize';
import * as config from '../options/config';
import * as Models from './models';
import { container } from '@sapphire/pieces';
import type { CommandInteraction } from 'discord.js';
import i18n from 'i18next';
import I18nBackend from 'i18next-fs-backend';
import { join } from 'path';
import { promises as fs } from 'fs';

export class BotClient extends SapphireClient {
	public database: Sequelize;
	public i18n: typeof i18n;

	public constructor() {
		super({
			intents: ['GUILDS', 'GUILD_MESSAGES'],
			logger: { level: LogLevel.Debug }
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
		this.i18n = i18n;
		Models.App.initModel(this.database);
		Models.AppButton.initModel(this.database);
		Models.Guild.initModel(this.database, config.defaultPrefix);
		Models.Submission.initModel(this.database);
		Models.User.initModel(this.database);
		container.database = this.database;
		container.i18n = this.i18n;
		container.t = this.t.bind(this);
	}

	public async initialize() {
		this.logger.info('[Init] Logging into the database...');
		await this.database.authenticate();
		this.logger.info('[Init] Logged in, syncing models...');
		await this.database.sync({ alter: true });
		this.logger.info('[Init] Synced models, initializing i18n...');
		const languages = await fs.readdir(
			join(__dirname, '..', '..', 'src', 'languages')
		);
		const namespaces = await fs.readdir(
			join(__dirname, '..', '..', 'src', 'languages', config.defaultLanguage)
		);
		await this.i18n.use(I18nBackend).init({
			supportedLngs: languages,
			fallbackLng: config.defaultLanguage,
			ns: namespaces,
			fallbackNS: namespaces[0],
			interpolation: {
				escapeValue: false
			},
			backend: {
				loadPath: join(
					__dirname,
					'..',
					'..',
					'src',
					'languages',
					'{{lng}}',
					'{{ns}}.json'
				),
				addPath: join(
					__dirname,
					'..',
					'..',
					'src',
					'languages',
					'{{lng}}',
					'{{ns}}.missing.json'
				)
			},
			preload: languages,
			debug: true
		});
		this.logger.info('[Init] Finished initializing!');
	}

	public async start() {
		await this.initialize();
		return this.login(config.token);
	}

	public async t(
		interaction: CommandInteraction,
		key: string,
		options: Record<string, unknown>
	): Promise<string> {
		const user = await Models.User.findByPk(interaction.user.id);
		return this.i18n.t(key, {
			lng: this.i18n.languages.includes(user?.language ?? interaction.locale) ? user?.language ?? interaction.locale : this.i18n.languages[0],
			...options
		})
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		database: Sequelize;
		i18n: typeof i18n;
		t: typeof BotClient.prototype.t;
	}
}
