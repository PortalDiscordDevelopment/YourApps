import type { Snowflake } from 'discord.js';
import { DataTypes, Optional, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';

export interface UserModelAttributes {
	id: Snowflake;
	language: string;
}

export type UserModelCreationAttributes = Optional<
	UserModelAttributes,
	'language'
>;

export class User extends BaseModel<
	UserModelAttributes,
	UserModelCreationAttributes
> {
	declare id: Snowflake;
	declare language: string | null;
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
