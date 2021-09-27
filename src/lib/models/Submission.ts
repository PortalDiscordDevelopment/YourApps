import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from './BaseModel';
import type {
	SubmissionModelAttributes,
	SubmissionModelCreationAttributes
} from './types';

export class Submission extends BaseModel<
	SubmissionModelAttributes,
	SubmissionModelCreationAttributes
> {
	declare id: number;
	declare author: string;
	declare guild: string;
	declare position: number;
	declare answers: Record<string, unknown>;
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
					type: DataTypes.ARRAY(DataTypes.JSON),
					allowNull: false
				}
			},
			{ sequelize }
		);
	}
}
