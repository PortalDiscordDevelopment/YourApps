import {
	AkairoClient,
	CommandHandler,
	InhibitorHandler,
	ListenerHandler
} from 'discord-akairo';
import { join } from 'path';
import { Sequelize } from 'sequelize';
import { Util } from './Util';
import * as Models from '../models';

export interface BotConfig {
	token: string;
	db: {
		username: string;
		password: string;
		host: string;
		port: number;
	}
}

export class BotClient extends AkairoClient {
	public config: BotConfig;
	public commandHandler: CommandHandler = new CommandHandler(this, {
		prefix: '-',
		commandUtil: true,
		handleEdits: true,
		directory: join(__dirname, '..', '..', 'commands'),
		allowMention: true,
		automateCategories: true
	});
	public listenerHandler: ListenerHandler = new ListenerHandler(this, {
		directory: join(__dirname, '..', '..', 'listeners'),
		automateCategories: true
	});
	public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, {
		directory: join(__dirname, '..', '..', 'inhibitors')
	});
	public util: Util = new Util(this);
	public db: Sequelize;

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
			this.config.db.password, {
				dialect: 'postgres',
				host: this.config.db.host,
				port: this.config.db.port,
				logging: false
			}
		)
		await this.db.authenticate();
		for (const model of Object.values(Models)) {
			model.initModel(this.db)
		}
		await this.db.sync({ alter: true })
		// loads all the stuff
		const loaders = {
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
