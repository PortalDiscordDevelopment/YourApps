import { Model, DataTypes } from 'sequelize';

export class Guild extends Model {
	static initModel(sequelize) {
		Guild.init({
			id: {
				type: DataTypes.STRING,
				primaryKey: true,
				allowNull: false
			},
			prefixes: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			logchannel: {
				type: DataTypes.STRING,
				allowNull: true
			},
			logpings: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			archivechannel: {
				type: DataTypes.STRING,
				allowNull: true
			},
			adminroles: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			reviewroles: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			},
			blacklistroles: {
				type: DataTypes.ARRAY(DataTypes.STRING),
				allowNull: true
			}
		}, { sequelize })
	}
}