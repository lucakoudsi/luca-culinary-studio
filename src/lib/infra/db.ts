import { Sequelize } from 'sequelize';
import RezepteModel  from '../models/Rezepte';
import ZutatenModel  from '../models/Zutaten';
import IdeenModel    from '../models/Ideen';
import ProjekteModel from '../models/Projekte';

class DatabaseManager {
  readonly sequelize: Sequelize;
  readonly Rezepte:  RezepteModel;
  readonly Zutaten:  ZutatenModel;
  readonly Ideen:    IdeenModel;
  readonly Projekte: ProjekteModel;
  readonly ready:    Promise<Sequelize>;

  constructor() {
    // Postgres-Migration: dialect → 'postgres', storage entfernen,
    // host/port/username/password/database aus env lesen.
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_PATH ?? './database.sqlite',
      logging: false,
    });

    this.Rezepte  = new RezepteModel(this.sequelize);
    this.Zutaten  = new ZutatenModel(this.sequelize);
    this.Ideen    = new IdeenModel(this.sequelize);
    this.Projekte = new ProjekteModel(this.sequelize);

    this.ready = this.sequelize.sync();
  }
}

const globalForDb = global as typeof global & { _db?: DatabaseManager };

export function getDatabaseManager(): DatabaseManager {
  if (!globalForDb._db) {
    globalForDb._db = new DatabaseManager();
  }
  return globalForDb._db;
}

export type { DatabaseManager };
