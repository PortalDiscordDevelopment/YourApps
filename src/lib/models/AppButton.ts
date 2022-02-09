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
