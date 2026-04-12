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

export class Student extends Model<InferAttributes<Student>, InferCreationAttributes<Student>> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<User['id']>;
  declare studentCode: string;
  declare grade: string;
  declare section: CreationOptional<string>;
  declare parentEmail: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Student.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    studentCode: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    grade: { type: DataTypes.STRING(20), allowNull: false },
    section: { type: DataTypes.STRING(10) },
    parentEmail: { type: DataTypes.STRING(255) },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'students' }
);

Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });

export default Student;
