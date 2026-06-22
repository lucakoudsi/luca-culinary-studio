import { NextRequest, NextResponse } from 'next/server';
import type { DatabaseManager } from '../infra/db';

class IdeenEndpoint {
  private db: DatabaseManager;

  constructor({ databaseManager }: { databaseManager: DatabaseManager }) {
    this.db = databaseManager;
  }

  async listIdeen(): Promise<NextResponse> {
    try {
      const rows = await this.db.Ideen.model.findAll({ order: [['id', 'DESC']] });
      return NextResponse.json(rows);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async createIdee(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const row = await this.db.Ideen.model.create({
        ...body,
        date: new Date().toISOString().slice(0, 10),
      });
      return NextResponse.json(row, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async deleteIdee(id: string): Promise<NextResponse> {
    try {
      await this.db.Ideen.model.destroy({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }
}

export default IdeenEndpoint;
