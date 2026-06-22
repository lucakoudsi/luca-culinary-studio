import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize';

class Zutaten {
  model: ModelStatic<Model>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define(
      'zutat',
      {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name:        { type: DataTypes.STRING,  allowNull: false, unique: true },
        category:    { type: DataTypes.STRING,  allowNull: false },
        seasons:     { type: DataTypes.JSON,    allowNull: false, defaultValue: [] },
        origin:      { type: DataTypes.STRING,  allowNull: true },
        aromas:      { type: DataTypes.JSON,    allowNull: false, defaultValue: [] },
        flavor:      { type: DataTypes.JSON,    allowNull: false },
        pairings:    { type: DataTypes.JSON,    allowNull: false, defaultValue: [] },
        description: { type: DataTypes.TEXT,    allowNull: true },
        storageTemp: { type: DataTypes.STRING,  allowNull: true },
        unit:        { type: DataTypes.STRING,  allowNull: true },
      },
      { tableName: 'zutaten', timestamps: false }
    );
  }
}

export default Zutaten;
