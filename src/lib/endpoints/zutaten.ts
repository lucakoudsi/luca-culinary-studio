import { NextRequest, NextResponse } from 'next/server';
import type { DatabaseManager } from '../infra/db';

class ZutatenEndpoint {
  private db: DatabaseManager;

  constructor({ databaseManager }: { databaseManager: DatabaseManager }) {
    this.db = databaseManager;
  }

  async listZutaten(): Promise<NextResponse> {
    try {
      const rows = await this.db.Zutaten.model.findAll();
      return NextResponse.json(rows);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async createZutat(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const row = await this.db.Zutaten.model.create(body);
      return NextResponse.json(row, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }
}

export default ZutatenEndpoint;
