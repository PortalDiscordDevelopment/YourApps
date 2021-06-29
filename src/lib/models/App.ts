import { Snowflake } from 'discord.js';
import { DataTypes } from 'sequelize';
import { BaseModel } from './BaseModel';

interface ModelAttributes {
	id: number;
	name: string;
	description: string;
	guild: Snowflake;
	questions: Record<string, unknown>[];
	rewardroles: Snowflake[];
	removeroles: Snowflake[];
	requiredroles: Snowflake[];
	customcommand: string;
	closed: boolean;
	cooldown: number;
	minjointime: number;
}

interface ModelCreationAttributes {
	id?: number;
	name: string;
	description?: string;
	guild: Snowflake;
	questions: Record<string, unknown>[];
	rewardroles?: Snowflake[];
	removeroles?: Snowflake[];
	requiredroles?: Snowflake[];
	customcommand?: string;
	closed?: boolean;
	cooldown?: number;
	minjointime?: number;
}

export class App extends BaseModel<ModelAttributes, ModelCreationAttributes> {
	static initModel(sequelize) {
		App.init({
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				allowNull: false,
				autoIncrement: true
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false
			},
			description: {
				type: DataTypes.STRING(2000),
				allowNull: true
			},
			guild: {
				type: DataTypes.STRING,
				allowNull: false,
				references: {
					model: 'Guilds'
				}
			},
			questions: {
				type: DataTypes.ARRAY(DataTypes.JSON),
				allowNull: false
			},
			rewardroles: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			removeroles: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			requiredroles: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			customcommand: {
				type: DataTypes.STRING(16),
				allowNull: true
			},
			closed: {
				type: DataTypes.BOOLEAN,
				allowNull: true
			},
			cooldown: {
				type: DataTypes.INTEGER,
				allowNull: true
			},
			minjointime: {
				type: DataTypes.INTEGER,
				allowNull: true
			}
		}, { sequelize })
	}
}