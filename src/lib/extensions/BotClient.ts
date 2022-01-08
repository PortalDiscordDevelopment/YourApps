import {
	AkairoClient,
	AkairoHandler,
	CommandHandler,
	InhibitorHandler,
	ListenerHandler
} from 'discord-akairo';
import { join } from 'path';
import { Op, Sequelize } from 'sequelize';
import { Util } from './Util';
import * as Models from '../models';
import { Intents, Message } from 'discord.js';
import { Snowflake } from 'discord.js';
import { TextChannel } from 'discord.js';
import { default as i18n } from 'i18next';

export interface BotConfig {
	token: string;
	db: {
		username: string;
		password: string;
		host: string;
		port: number;
	};
	defaultPrefix: string;
	channels: {
		error: Snowflake;
	};
	ownerIDs: string[];
	migrationToken: string;
}

export class BotClient extends AkairoClient {
	public config: BotConfig;
	public commandHandler!: CommandHandler;
	public listenerHandler!: ListenerHandler;
	public inhibitorHandler!: InhibitorHandler;
	public util: Util = new Util(this);
	public db!: Sequelize;
	public errorChannel!: TextChannel;
	public i18n!: typeof i18n;

	public constructor(config: BotConfig) {
		super(
			{
				ownerID: config.ownerIDs
			},
			{
				allowedMentions: {
					parse: ['users'] // Disables all mentions except for users
				},
				intents: Intents.resolve(32509) // All non priveledged intents
			}
		);
		this.config = config;
	}
	private async _init(): Promise<void> {
		this.i18n = i18n;
		await i18n.init({
			lng: 'en-US',
			fallbackLng: 'en-US',
			ns: 'YourApps',
			fallbackNS: 'YourApps'
		});
		await this.util.loadLanguages();
		this.commandHandler = new CommandHandler(this, {
			prefix: async (message: Message) => {
				if (!message.guild) return [this.config.defaultPrefix, 'ya-v4?'];
				const guildEntry = await Models.Guild.findByPk(message.guild.id);
				if (!guildEntry) return [this.config.defaultPrefix, 'ya-v4?'];
				return [...guildEntry.prefixes, 'ya-v4?'];
			},
			commandUtil: true,
			handleEdits: true,
			directory: join(__dirname, '..', '..', 'commands'),
			allowMention: true,
			automateCategories: true
		});
		this.commandHandler.resolver.addType(
			'application',
			async (message: Message, phrase: string) => {
				if (!phrase) return null;
				let foundApps: Models.App | null;
				if (!isNaN(Number(phrase))) {
					foundApps = await Models.App.findOne({
						where: {
							[Op.or]: [
								{
									id: Number(phrase),
									guild: message.guildId!
								},
								{
									name: {
										[Op.iLike]: phrase.replace(/[%_]/g, '\\')
									},
									guild: message.guildId!
								}
							]
						}
					});
				} else {
					foundApps = await Models.App.findOne({
						where: {
							name: {
								[Op.iLike]: phrase.replace(/[%_]/g, '\\')
							},
							guild: message.guildId!
						}
					});
				}
				return foundApps;
			}
		);
		this.commandHandler.resolver.addType(
			'commandAliasImproved',
			(message, phrase) => {
				return this.commandHandler.resolver.type('commandAlias')(
					message,
					phrase.replace(/ /g, '-')
				);
			}
		);
		this.listenerHandler = new ListenerHandler(this, {
			directory: join(__dirname, '..', '..', 'listeners'),
			automateCategories: true
		});
		this.inhibitorHandler = new InhibitorHandler(this, {
			directory: join(__dirname, '..', '..', 'inhibitors')
		});
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			listenerHandler: this.listenerHandler,
			process
		});
		// Connects to DB
		this.db = new Sequelize(
			'yourapps',
			this.config.db.username,
			this.config.db.password,
			{
				dialect: 'postgres',
				host: this.config.db.host,
				port: this.config.db.port,
				logging: false
			}
		);
		await this.db.authenticate();
		for (const model of Object.values(Models)) {
			model.initModel(this.db, this.config.defaultPrefix);
		}
		await this.db.sync({ alter: true });
		// loads all the stuff
		const loaders: Record<string, AkairoHandler> = {
			commands: this.commandHandler,
			listeners: this.listenerHandler,
			inhibitors: this.inhibitorHandler
		};
		for (const loader of Object.keys(loaders)) {
			try {
				loaders[loader].loadAll();
				console.log('Successfully loaded ' + loader + '.');
			} catch (e) {
				console.error('Unable to load ' + loader + ' with error ' + e);
			}
		}
	}

	public async start(): Promise<string> {
		await this._init();

		return this.login(this.config.token);
	}

	public camelCase(str: string): string {
		return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
			if (+match === 0) return '';
			return index === 0 ? match.toLowerCase() : match.toUpperCase();
		});
	}
}
