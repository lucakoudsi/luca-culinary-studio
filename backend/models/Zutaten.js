import { DataTypes } from 'sequelize';

class Zutaten {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.model = this.#defineZutatenModel();
  }

  #defineZutatenModel() {
    return this.sequelize.define('zutaten', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'zutaten',
      timestamps: false
    }
    );
  }

  associate(models) {
    // Rückrichtung der Beziehung
    this.model.belongsToMany(models.Rezepte.model, {
      through: 'rezept_zutaten',
      foreignKey: 'zutat_id',
      otherKey: 'rezept_id'
    });
  }
}

export default Zutaten;