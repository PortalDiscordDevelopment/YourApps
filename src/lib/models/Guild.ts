import { Snowflake } from 'discord.js';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';

interface ModelAttributes {
	id: string;
	prefixes: string[];
	logchannel: Snowflake;
	archivechannel: Snowflake;
	logpings: Snowflake[];
	adminroles: Snowflake[];
	reviewroles: Snowflake[];
	blacklistroles: Snowflake[];
}

interface ModelCreationAttributes {
	id: string;
	prefixes?: string[];
	logchannel?: Snowflake;
	archivechannel?: Snowflake;
	logpings?: Snowflake[];
	adminroles?: Snowflake[];
	reviewroles?: Snowflake[];
	blacklistroles?: Snowflake[];
}

export class Guild extends BaseModel<ModelAttributes, ModelCreationAttributes> {
	id: string;
	prefixes: string[] | null;
	logchannel: Snowflake | null;
	archivechannel: Snowflake | null;
	logpings: Snowflake[] | null;
	adminroles: Snowflake[] | null;
	reviewroles: Snowflake[] | null;
	blacklistroles: Snowflake[] | null;
	static initModel(sequelize: Sequelize, defaultPrefix: string) {
		Guild.init(
			{
				id: {
					type: DataTypes.STRING,
					primaryKey: true,
					allowNull: false
				},
				prefixes: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: false,
					defaultValue: [defaultPrefix]
				},
				logchannel: {
					type: DataTypes.STRING,
					allowNull: true
				},
				logpings: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: true
				},
				archivechannel: {
					type: DataTypes.STRING,
					allowNull: true
				},
				adminroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: true
				},
				reviewroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: true
				},
				blacklistroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: true
				}
			},
			{ sequelize }
		);
	}
}
