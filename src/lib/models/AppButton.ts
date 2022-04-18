import type { Snowflake } from 'discord.js';
import { DataTypes, Optional, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';

export interface AppButtonModelAttributes {
	id: number;
	message: Snowflake;
	channel: Snowflake;
	guild: Snowflake;
	app: number;
}

export type AppButtonModelCreationAttributes = Optional<
	AppButtonModelAttributes,
	'id'
>;

export class AppButton extends BaseModel<
	AppButtonModelAttributes,
	AppButtonModelCreationAttributes
> {
	declare id: number;
	declare message: Snowflake;
	declare channel: Snowflake;
	declare guild: Snowflake;
	declare app: number;

	static initModel(sequelize: Sequelize) {
		AppButton.init(
			{
				id: {
					type: DataTypes.INTEGER,
					allowNull: false,
					primaryKey: true,
					autoIncrement: true
				},
				message: {
					type: DataTypes.STRING,
					allowNull: false
				},
				channel: {
					type: DataTypes.STRING,
					allowNull: false
				},
				guild: {
					type: DataTypes.STRING,
					allowNull: false,
					references: { model: 'Guilds' }
				},
				app: {
					type: DataTypes.INTEGER,
					allowNull: false,
					references: { model: 'Apps' }
				}
			},
			{ sequelize }
		);
	}
}
