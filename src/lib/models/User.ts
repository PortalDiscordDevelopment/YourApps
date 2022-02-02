import { Snowflake } from 'discord.js';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';
import type { UserModelAttributes, UserModelCreationAttributes } from './types';

export class User extends BaseModel<
	UserModelAttributes,
	UserModelCreationAttributes
> {
	declare id: Snowflake;
	declare language: string;
	static initModel(sequelize: Sequelize) {
		User.init(
			{
				id: {
					type: DataTypes.STRING,
					primaryKey: true,
					allowNull: false
				},
				language: {
					type: DataTypes.STRING,
					primaryKey: false,
					allowNull: true
				}
			},
			{ sequelize }
		);
	}
}
