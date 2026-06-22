import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize';

class Rezepte {
  model: ModelStatic<Model>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define(
      'rezept',
      {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title:       { type: DataTypes.STRING,  allowNull: false },
        category:    { type: DataTypes.STRING,  allowNull: false },
        tags:        { type: DataTypes.JSON,    allowNull: false, defaultValue: [] },
        difficulty:  { type: DataTypes.STRING,  allowNull: false },
        time:        { type: DataTypes.INTEGER, allowNull: false },
        season:      { type: DataTypes.STRING,  allowNull: false },
        status:      { type: DataTypes.STRING,  allowNull: false },
        rating:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        image:       { type: DataTypes.STRING,  allowNull: true },
        description: { type: DataTypes.TEXT,    allowNull: true },
        lastEdited:  { type: DataTypes.STRING,  allowNull: false },
        views:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      },
      { tableName: 'rezepte', timestamps: false }
    );
  }
}

export default Rezepte;
