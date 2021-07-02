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
import { Message } from 'discord.js';

export interface BotConfig {
	token: string;
	db: {
		username: string;
		password: string;
		host: string;
		port: number;
	};
	defaultPrefix: string;
}

export class BotClient extends AkairoClient {
	public config: BotConfig;
	public commandHandler!: CommandHandler;
	public listenerHandler!: ListenerHandler;
	public inhibitorHandler!: InhibitorHandler;
	public util: Util = new Util(this);
	public db!: Sequelize;

	public constructor(config: BotConfig) {
		super(
			{
				ownerID: ['487443883127472129']
			},
			{
				allowedMentions: {
					parse: ['users'] // Disables all mentions except for users
				}
			}
		);
		this.config = config;
	}
	private async _init(): Promise<void> {
		this.commandHandler = new CommandHandler(this, {
			prefix: async (message: Message) => {
				if (!message.guild) return this.config.defaultPrefix;
				const guildEntry = await Models.Guild.findByPk(message.guild.id);
				if (!guildEntry) return this.config.defaultPrefix;
				return guildEntry.prefixes;
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
				let foundApps: Models.App[];
				if (!isNaN(Number(phrase))) {
					foundApps = await Models.App.findAll({
						where: {
							[Op.or]: [
								{
									id: Number(phrase)
								},
								{
									name: phrase
								}
							]
						}
					});
				} else {
					foundApps = await Models.App.findAll({
						where: {
							name: phrase
						}
					});
				}
				if (foundApps.length < 1) return null;
				return foundApps[0];
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
}
