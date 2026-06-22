import { DataTypes } from 'sequelize';

class Rezepte {
    constructor(sequelize) {
        this.sequelize = sequelize;
        this.model = this.#defineRezepteModel();
    }

    #defineRezepteModel() {
        return this.sequelize.define('rezept', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            cover: {
                type: DataTypes.STRING,
                allowNull: true
            },
            steps: {
                type: DataTypes.JSON,
                allowNull: false
            }
        },
        {
            tableName: 'rezepte',
            timestamps: false
        });
    }

    associate(models) {
        // Ein Rezept hat viele Zutaten, eine Zutat kann in vielen Rezepten sein
        this.model.belongsToMany(models.Zutaten.model, {
            through: 'rezept_zutaten',
            foreignKey: 'rezept_id',
            otherKey: 'zutat_id'
        });
    }
}

export default Rezepte;
