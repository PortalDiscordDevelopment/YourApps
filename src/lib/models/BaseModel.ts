import { Model } from 'sequelize';

export abstract class BaseModel<A, B> extends Model<A, B> {
	declare readonly createdAt: Date;
	declare readonly updatedAt: Date;
}
