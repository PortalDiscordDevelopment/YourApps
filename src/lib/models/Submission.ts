import type { Snowflake } from 'discord.js';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';

export type AnswerType = string;

export interface SubmissionModelAttributes {
	id: number;
	author: string;
	guild: string;
	position: number;
	answers: Record<string, AnswerType>;
}

export interface SubmissionModelCreationAttributes {
	id?: number;
	author: string;
	guild: string;
	position: number;
	answers: Record<string, AnswerType>;
}

export class Submission extends BaseModel<
	SubmissionModelAttributes,
	SubmissionModelCreationAttributes
> {
	declare id: number;
	declare author: Snowflake;
	declare guild: Snowflake;
	declare position: number;
	declare answers: Record<string, AnswerType>;
	static initModel(sequelize: Sequelize) {
		Submission.init(
			{
				id: {
					type: DataTypes.INTEGER,
					primaryKey: true,
					allowNull: false,
					autoIncrement: true
				},
				author: {
					type: DataTypes.STRING,
					allowNull: false
				},
				guild: {
					type: DataTypes.STRING,
					allowNull: false,
					references: {
						model: 'Guilds'
					}
				},
				position: {
					type: DataTypes.INTEGER,
					allowNull: false,
					references: {
						model: 'Apps'
					}
				},
				answers: {
					type: DataTypes.JSON,
					allowNull: false
				}
			},
			{ sequelize }
		);
	}
}
