import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize';

class Projekte {
  model: ModelStatic<Model>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define(
      'projekt',
      {
        id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name:        { type: DataTypes.STRING,  allowNull: false },
        description: { type: DataTypes.TEXT,    allowNull: true },
        color:       { type: DataTypes.STRING,  allowNull: false, defaultValue: '#C9A84C' },
        createdAt:   { type: DataTypes.STRING,  allowNull: false },
        status:      { type: DataTypes.STRING,  allowNull: false, defaultValue: 'Aktiv' },
        recipeIds:   { type: DataTypes.JSON,    allowNull: false, defaultValue: [] },
        menuIds:     { type: DataTypes.JSON,    allowNull: false, defaultValue: [] },
        notes:       { type: DataTypes.JSON,    allowNull: false, defaultValue: [] },
      },
      { tableName: 'projekte', timestamps: false }
    );
  }
}

export default Projekte;
