import { Sequelize } from 'sequelize';

import Rezepte from '../models/Rezepte.js';
import Zutaten from '../models/Zutaten.js';

class DatabaseManager {
  constructor(expressManager) {
    this.expressManager = expressManager;

    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_PATH || './database.sqlite',
    });

    this.Rezepte = new Rezepte(this.sequelize);
    this.Zutaten = new Zutaten(this.sequelize);
    this.Zutaten.associate({ Rezepte: this.Rezepte });
    this.Rezepte.associate({ Zutaten: this.Zutaten });

    this.ready = this.#sync();
  }

  async #sync() {
    return this.sequelize.sync();
  }
}

export default DatabaseManager;

