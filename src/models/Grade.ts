import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import sequelize from '../config/database';
import Student from './Student';
import Subject from './Subject';
import User from './User';

export class Grade extends Model<InferAttributes<Grade>, InferCreationAttributes<Grade>> {
  declare id: CreationOptional<number>;
  declare studentId: ForeignKey<Student['id']>;
  declare subjectId: ForeignKey<Subject['id']>;
  declare registeredById: ForeignKey<User['id']>;
  declare score: number;
  declare period: string;
  declare gradeType: string;
  declare comments: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Grade.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'students', key: 'id' },
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'subjects', key: 'id' },
    },
    registeredById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    period: { type: DataTypes.STRING(20), allowNull: false },
    gradeType: {
      type: DataTypes.ENUM('parcial', 'final', 'tarea', 'proyecto', 'examen'),
      allowNull: false,
    },
    comments: { type: DataTypes.TEXT },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'grades' }
);

Grade.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Grade.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Grade.belongsTo(User, { foreignKey: 'registeredById', as: 'registeredBy' });
Student.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });
Subject.hasMany(Grade, { foreignKey: 'subjectId', as: 'grades' });

export default Grade;
