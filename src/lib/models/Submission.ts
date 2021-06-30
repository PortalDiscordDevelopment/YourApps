import { Model, DataTypes } from 'sequelize';

export class Submission extends Model {
	static initModel(sequelize) {
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
				}
			},
			{ sequelize }
		);
	}
}
