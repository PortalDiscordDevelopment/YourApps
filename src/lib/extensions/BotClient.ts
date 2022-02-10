import {
	AkairoClient,
	AkairoHandler,
	CommandHandler,
	InhibitorHandler,
	ListenerHandler
} from 'discord-akairo';
import { join } from 'path';
import { Op, Sequelize } from 'sequelize';
import { Util } from '@lib/ext/Util';
import * as Models from '@lib/models';
import { Collection, Intents, Interaction, Message } from 'discord.js';
import { Snowflake } from 'discord.js';
import { TextChannel } from 'discord.js';
import i18n, { TOptions } from 'i18next';
import I18nBackend from 'i18next-fs-backend';
import { User as ModelUser } from '@lib/models/User';

// I love typescript fuckery I can just copy paste from stackoverflow
export type RecursiveKeyOf<TObj extends object> = {
	[TKey in keyof TObj & (string | number)]: TObj[TKey] extends unknown[]
		? `${TKey}`
		: TObj[TKey] extends object
		? `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
		: `${TKey}`;
}[keyof TObj & (string | number)];

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
	migrationApiUrl: string;
}

export class InvalidArgError extends Error {}
export type CustomArgType<T> = T | InvalidArgError;

export class BotClient extends AkairoClient {
	public config: BotConfig;
	public commandHandler!: CommandHandler;
	public listenerHandler!: ListenerHandler;
	public inhibitorHandler!: InhibitorHandler;
	public util: Util = new Util(this);
	public db: Sequelize;
	public static dbConnected = false;
	public errorChannel!: TextChannel;
	public i18n: typeof i18n;
	public languageCache: Collection<
		Snowflake,
		{
			lang: string;
			cachedAt: number;
		}
	>;
	public supportedLangs = ['en-US', 'de', 'nl'];

	public constructor(config: BotConfig) {
		super(
			{
				ownerID: config.ownerIDs
			},
			{
				allowedMentions: {
					parse: ['users'] // Disables all mentions except for users
				},
				intents: [
					Intents.FLAGS.GUILDS,
					Intents.FLAGS.GUILD_MESSAGES,
					Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
					Intents.FLAGS.DIRECT_MESSAGES
				]
			}
		);
		this.config = config;
		this.languageCache = new Collection();
		this.i18n = i18n;
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
	}
	private async _init(): Promise<void> {
		await i18n.use(I18nBackend).init({
			supportedLngs: this.supportedLangs,
			fallbackLng: this.supportedLangs[0],
			ns: ['bot'],
			fallbackNS: 'bot',
			interpolation: {
				escapeValue: false
			},
			backend: {
				loadPath: join(__dirname, '../../../src/languages/{{lng}}/{{ns}}.json'),
				addPath: join(
					__dirname,
					'../../../src/languages/{{lng}}/{{ns}}.missing.json'
				)
			},
			preload: this.supportedLangs
		});
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
			'appbutton',
			async (message: Message, phrase: string) => {
				if (!phrase) return null;
				const btns = await Models.AppButton.findAll({
					where: {
						message: phrase
					}
				});
				if (btns.length < 1) return new InvalidArgError();
				else return btns;
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
		await this.db.authenticate();
		for (const model of Object.values(Models)) {
			model.initModel(this.db, this.config.defaultPrefix);
		}
		await this.db.sync({ alter: true });
		BotClient.dbConnected = true;
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

	// Just a wrapper for client.i18n.t that uses message to determine language (and more strict typing)
	public async t(
		key: RecursiveKeyOf<typeof import('../../languages/en-US/bot.json')>,
		message?: Message | Interaction,
		options: TOptions = {}
	) {
		if (!message) {
			return this.i18n.t(key, options);
		}
		const lng = await ModelUser.findByPk(
			(message instanceof Message ? message.author : message.user).id
		).then(u => u?.language ?? undefined);
		return this.i18n.t(key, {
			lng,
			...options
		});
	}
}
