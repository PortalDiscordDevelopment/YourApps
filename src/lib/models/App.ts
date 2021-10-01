import type { Snowflake } from 'discord.js';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';
import type {
	AppModelAttributes,
	AppModelCreationAttributes,
	AppQuestion
} from './types';

export class App extends BaseModel<
	AppModelAttributes,
	AppModelCreationAttributes
> {
	declare id: number;
	declare name: string;
	declare description: string | null;
	declare guild: Snowflake;
	declare questions: AppQuestion[];
	declare rewardroles: Snowflake[];
	declare removeroles: Snowflake[];
	declare requiredroles: Snowflake[];
	declare customcommand: string | null;
	declare closed: boolean;
	declare cooldown: number | null;
	declare minjointime: number | null;
	static initModel(sequelize: Sequelize) {
		App.init(
			{
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
					allowNull: false,
					defaultValue: []
				},
				removeroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: false,
					defaultValue: []
				},
				requiredroles: {
					type: DataTypes.ARRAY(DataTypes.STRING),
					allowNull: false,
					defaultValue: []
				},
				customcommand: {
					type: DataTypes.STRING(16),
					allowNull: true
				},
				closed: {
					type: DataTypes.BOOLEAN,
					allowNull: false,
					defaultValue: false
				},
				cooldown: {
					type: DataTypes.INTEGER,
					allowNull: true
				},
				minjointime: {
					type: DataTypes.INTEGER,
					allowNull: true
				}
			},
			{ sequelize }
		);
	}
}
