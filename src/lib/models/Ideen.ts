import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize';

class Ideen {
  model: ModelStatic<Model>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define(
      'idee',
      {
        id:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        text: { type: DataTypes.TEXT,   allowNull: false },
        tag:  { type: DataTypes.STRING, allowNull: true },
        date: { type: DataTypes.STRING, allowNull: false },
      },
      { tableName: 'ideen', timestamps: false }
    );
  }
}

export default Ideen;
