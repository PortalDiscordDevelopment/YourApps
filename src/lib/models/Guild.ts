import type { Snowflake } from 'discord.js';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';

export interface GuildModelAttributes {
	id: string;
	logchannel: Snowflake;
	archivechannel: Snowflake;
	logpings: Snowflake[];
	adminroles: Snowflake[];
	reviewroles: Snowflake[];
	blacklistroles: Snowflake[];
	legacypremium: boolean;
}

export interface GuildModelCreationAttributes {
	id: string;
	logchannel?: Snowflake;
	archivechannel?: Snowflake;
	logpings?: Snowflake[];
	adminroles?: Snowflake[];
	reviewroles?: Snowflake[];
	blacklistroles?: Snowflake[];
	legacypremium?: boolean;
}

export class Guild extends BaseModel<
	GuildModelAttributes,
	GuildModelCreationAttributes
> {
	declare id: string;
	declare logchannel: Snowflake | null;
	declare archivechannel: Snowflake | null;
	declare logpings: Snowflake[];
	declare adminroles: Snowflake[];
	declare reviewroles: Snowflake[];
	declare blacklistroles: Snowflake[];
	declare legacypremium: boolean;

	static initModel(sequelize: Sequelize) {
		Guild.init(
			{
				id: {
					type: DataTypes.STRING,
					primaryKey: true,
					allowNull: false
				},
				logchannel: {
					type: DataTypes.STRING,
					allowNull: true
				},
				logpings: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: false,
					defaultValue: []
				},
				archivechannel: {
					type: DataTypes.STRING,
					allowNull: true
				},
				adminroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: false,
					defaultValue: []
				},
				reviewroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: false,
					defaultValue: []
				},
				blacklistroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: false,
					defaultValue: []
				},
				legacypremium: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				}
			},
			{ sequelize }
		);
	}

	static async createIfNotExists(id: Snowflake, defaults?: GuildModelCreationAttributes) {
		await Guild.findOrCreate({
			where: { id },
			defaults: { id, ...defaults }
		})
	}
}
