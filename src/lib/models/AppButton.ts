import { Snowflake } from 'discord.js';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';
import type {
	AppButtonModelAttributes,
	AppButtonModelCreationAttributes
} from './types';

export class AppButton extends BaseModel<
	AppButtonModelAttributes,
	AppButtonModelCreationAttributes
> {
	declare message: Snowflake;
	declare channel: Snowflake;
	declare guild: Snowflake;
	declare app: number;

	static initModel(sequelize: Sequelize) {
		AppButton.init(
			{
				message: {
					type: DataTypes.STRING,
					primaryKey: true,
					allowNull: false
				},
				channel: {
					type: DataTypes.STRING,
					primaryKey: false,
					allowNull: false
				},
				guild: {
					type: DataTypes.STRING,
					primaryKey: false,
					allowNull: false,
					references: { model: 'Guilds' }
				},
				app: {
					type: DataTypes.INTEGER,
					primaryKey: false,
					allowNull: false,
					references: { model: 'Apps' }
				}
			},
			{ sequelize }
		);
	}
}
