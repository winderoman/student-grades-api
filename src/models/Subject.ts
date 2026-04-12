import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export class Subject extends Model<InferAttributes<Subject>, InferCreationAttributes<Subject>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;
  declare description: CreationOptional<string>;
  declare credits: CreationOptional<number>;
  declare teacherId: ForeignKey<User['id']>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Subject.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    credits: { type: DataTypes.INTEGER, defaultValue: 1 },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'subjects' }
);

Subject.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Subject, { foreignKey: 'teacherId', as: 'subjects' });

export default Subject;
